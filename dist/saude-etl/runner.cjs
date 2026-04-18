#!/usr/bin/env node
/* Saúde ETL Runner — orchestrates SINASC/SIM (Python via pysus) and PNI/SISAGUA
 * (Node modules), batch-inserts indicators into saude_indicadores_municipio,
 * and tracks runs in saude_ingestao_log.
 *
 * Usage:
 *   node dist/saude-etl/runner.cjs --source sinasc --states MG --years 2022
 *   node dist/saude-etl/runner.cjs --source sim    --states ALL --years 2020-2024
 *   node dist/saude-etl/runner.cjs --source pni    --states MG --years 2023
 *   node dist/saude-etl/runner.cjs --source sisagua --year 2024
 *   node dist/saude-etl/runner.cjs --source sinasc --states MG --years 2022 --co-municipio 3151206
 */
'use strict';

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const readline = require('readline');

// pg comes from the bundled dist/index.cjs at runtime; we re-resolve it.
let Pool;
try { Pool = require('pg').Pool; }
catch (_) {
  // Fallback: load from the bundled file
  const bundlePath = path.join(__dirname, '..', 'index.cjs');
  process.env.NODE_PATH = path.dirname(bundlePath);
  require('module').Module._initPaths();
  Pool = require('pg').Pool;
}

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PY_BIN = path.join(REPO_ROOT, '.venv-saude', 'bin', 'python');

function loadEnv() {
  const envPath = path.join(REPO_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  }
}
loadEnv();

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = (i + 1 < argv.length && !argv[i+1].startsWith('--')) ? argv[++i] : 'true';
      out[k] = v;
    }
  }
  return out;
}

async function withPool(fn) {
  const pool = new Pool({
    connectionString: process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 4,
  });
  try { return await fn(pool); }
  finally { await pool.end(); }
}

async function logIngestion(pool, fonte, escopo, status, detalhes) {
  try {
    const r = await pool.query(
      `INSERT INTO saude_etl_runs (fonte, escopo, status, detalhes, finalizado_em)
       VALUES ($1, $2::jsonb, $3, $4::jsonb, now()) RETURNING id`,
      [fonte, JSON.stringify(escopo || {}), status, JSON.stringify(detalhes || {})]
    );
    return r.rows[0]?.id;
  } catch (e) { console.error('[log] insert failed:', e.message); }
}

async function batchUpsert(pool, batch) {
  if (batch.length === 0) return 0;
  // Dedupe by unique key (last write wins)
  const dedup = new Map();
  for (const r of batch) {
    const key = `${r.co_municipio}|${r.ano}|${r.mes ?? 0}|${r.fonte}|${r.indicador}|${r.recorte ?? ''}`;
    dedup.set(key, r);
  }
  const rows = [...dedup.values()];
  const cols = ['co_municipio', 'ano', 'mes', 'fonte', 'indicador', 'recorte',
                'valor', 'denominador', 'unidade', 'metadata'];
  const values = [];
  const placeholders = [];
  let i = 1;
  for (const r of rows) {
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}::jsonb)`);
    values.push(
      String(r.co_municipio),
      Number(r.ano),
      r.mes != null ? Number(r.mes) : null,
      String(r.fonte),
      String(r.indicador),
      r.recorte || null,
      Number(r.valor),
      r.denominador != null ? Number(r.denominador) : null,
      r.unidade || null,
      JSON.stringify(r.metadata || {})
    );
  }
  const sql = `INSERT INTO saude_indicadores_municipio (${cols.join(',')}) VALUES ${placeholders.join(',')}
    ON CONFLICT (co_municipio, ano, COALESCE(mes,0), fonte, indicador, COALESCE(recorte,''))
    DO UPDATE SET valor = EXCLUDED.valor, denominador = EXCLUDED.denominador,
      unidade = EXCLUDED.unidade, metadata = EXCLUDED.metadata, updated_at = now()`;
  await pool.query(sql, values);
  return rows.length;
}

async function streamPython(pool, scriptName, args, onProgress) {
  const script = path.join(__dirname, 'sources', scriptName);
  if (!fs.existsSync(script)) throw new Error('script not found: ' + script);
  if (!fs.existsSync(PY_BIN)) throw new Error('python venv missing: ' + PY_BIN);

  return await new Promise((resolve, reject) => {
    const child = spawn(PY_BIN, [script, ...args], {
      env: { ...process.env, PYTHONUNBUFFERED: '1', PIP_USER: '0', PYTHONUSERBASE: '' },
      cwd: REPO_ROOT,
    });

    let buf = [];
    let inserted = 0;
    let received = 0;
    let parseErrs = 0;
    let upsertErrs = 0;
    let lastUpsertErr = null;
    // Serialize all upserts through this chain so we can await draining
    let writeChain = Promise.resolve();
    let closed = false;
    let exitCode = null;

    const flushChunk = (chunk) => {
      writeChain = writeChain.then(async () => {
        try {
          const n = await batchUpsert(pool, chunk);
          inserted += n;
          if (onProgress) onProgress(inserted, received);
        } catch (e) {
          upsertErrs++;
          lastUpsertErr = e.message;
          console.error('[upsert] failed:', e.message);
        }
      });
      return writeChain;
    };

    child.stderr.on('data', d => process.stderr.write(d));
    const rl = readline.createInterface({ input: child.stdout });
    // Capture rl 'close' upfront to avoid race when finalize() runs after readline already drained
    const rlClosed = new Promise((res) => rl.once('close', res));
    rl.on('line', (line) => {
      const s = line.trim();
      if (!s) return;
      let rec;
      try { rec = JSON.parse(s); }
      catch (e) {
        parseErrs++;
        if (parseErrs < 5) console.error('[parse]', e.message, 'line:', s.slice(0, 200));
        return;
      }
      buf.push(rec);
      received++;
      if (buf.length >= 200) {
        const chunk = buf; buf = [];
        flushChunk(chunk);
      }
    });

    const finalize = async () => {
      // wait for readline to drain stdout (uses upfront-captured promise)
      await rlClosed;
      // flush remaining buffer
      if (buf.length > 0) {
        const chunk = buf; buf = [];
        flushChunk(chunk);
      }
      // wait for ALL queued upserts to settle
      await writeChain;
      console.log(`[${scriptName}] python exit=${exitCode} received=${received} inserted=${inserted} parseErrs=${parseErrs} upsertErrs=${upsertErrs}`);
      if (exitCode !== 0) return reject(new Error(`python exit ${exitCode}`));
      if (upsertErrs > 0) return reject(new Error(`${upsertErrs} batch upsert error(s); last: ${lastUpsertErr}`));
      resolve({ received, inserted, parseErrs, upsertErrs });
    };

    child.on('close', (code) => {
      if (closed) return;
      closed = true;
      exitCode = code;
      finalize().catch(reject);
    });
    child.on('error', reject);
  });
}

async function runSinasc(opts) {
  const args = ['--states', opts.states || 'ALL', '--years', opts.years || '2018-2022'];
  if (opts['co-municipio']) args.push('--co-municipio', opts['co-municipio']);
  return await withPool(async (pool) => {
    const t0 = Date.now();
    let res;
    try {
      res = await streamPython(pool, 'sinasc.py', args,
        (ins, rec) => { if (ins % 1000 === 0) console.log(`  sinasc inserted=${ins} received=${rec}`); });
      await logIngestion(pool, 'SINASC', { states: opts.states, years: opts.years, co_municipio: opts['co-municipio'] || null },
        'OK', { ...res, ms: Date.now() - t0 });
    } catch (e) {
      await logIngestion(pool, 'SINASC', { states: opts.states, years: opts.years },
        'ERROR', { error: e.message, ms: Date.now() - t0 });
      throw e;
    }
    return res;
  });
}

async function runSim(opts) {
  const args = ['--states', opts.states || 'ALL', '--years', opts.years || '2020-2024'];
  if (opts['co-municipio']) args.push('--co-municipio', opts['co-municipio']);
  return await withPool(async (pool) => {
    const t0 = Date.now();
    let res;
    try {
      res = await streamPython(pool, 'sim.py', args,
        (ins, rec) => { if (ins % 1000 === 0) console.log(`  sim inserted=${ins} received=${rec}`); });
      await logIngestion(pool, 'SIM', { states: opts.states, years: opts.years, co_municipio: opts['co-municipio'] || null },
        'OK', { ...res, ms: Date.now() - t0 });
    } catch (e) {
      await logIngestion(pool, 'SIM', { states: opts.states, years: opts.years },
        'ERROR', { error: e.message, ms: Date.now() - t0 });
      throw e;
    }
    return res;
  });
}

async function runPni(opts) {
  const args = ['--states', opts.states || 'ALL', '--years', opts.years || '2015-2019'];
  if (opts['co-municipio']) args.push('--co-municipio', opts['co-municipio']);
  return await withPool(async (pool) => {
    const t0 = Date.now();
    let res;
    try {
      res = await streamPython(pool, 'pni.py', args,
        (ins, rec) => { if (ins % 1000 === 0) console.log(`  pni inserted=${ins} received=${rec}`); });
      await logIngestion(pool, 'PNI', { states: opts.states, years: opts.years, co_municipio: opts['co-municipio'] || null },
        'OK', { ...res, ms: Date.now() - t0 });
    } catch (e) {
      await logIngestion(pool, 'PNI', { states: opts.states, years: opts.years },
        'ERROR', { error: e.message, ms: Date.now() - t0 });
      throw e;
    }
    return res;
  });
}

async function runSinan(opts) {
  const args = ['--years', opts.years || '2020-2026'];
  if (opts.diseases) args.push('--diseases', opts.diseases);
  if (opts['co-municipio']) args.push('--co-municipio', opts['co-municipio']);
  return await withPool(async (pool) => {
    const t0 = Date.now();
    let res;
    try {
      res = await streamPython(pool, 'sinan.py', args,
        (ins, rec) => { if (ins % 1000 === 0) console.log(`  sinan inserted=${ins} received=${rec}`); });
      await logIngestion(pool, 'SINAN', { diseases: opts.diseases || 'default', years: opts.years, co_municipio: opts['co-municipio'] || null },
        'OK', { ...res, ms: Date.now() - t0 });
    } catch (e) {
      await logIngestion(pool, 'SINAN', { diseases: opts.diseases || 'default', years: opts.years },
        'ERROR', { error: e.message, ms: Date.now() - t0 });
      throw e;
    }
    return res;
  });
}

async function runSisagua(opts) {
  const args = ['--years', opts.years || '2020-2024', '--states', opts.states || 'ALL'];
  if (opts['co-municipio']) args.push('--co-municipio', opts['co-municipio']);
  return await withPool(async (pool) => {
    const t0 = Date.now();
    let res;
    try {
      res = await streamPython(pool, 'sisagua.py', args,
        (ins, rec) => { if (ins % 500 === 0) console.log(`  sisagua inserted=${ins} received=${rec}`); });
      await logIngestion(pool, 'SISAGUA', { states: opts.states, years: opts.years, co_municipio: opts['co-municipio'] || null },
        'OK', { ...res, ms: Date.now() - t0 });
    } catch (e) {
      await logIngestion(pool, 'SISAGUA', { states: opts.states, years: opts.years },
        'ERROR', { error: e.message, ms: Date.now() - t0 });
      throw e;
    }
    return res;
  });
}

async function main() {
  const opts = parseArgs(process.argv);
  const src = (opts.source || '').toLowerCase();
  if (!src) { console.error('--source required (sinasc|sim|pni|sisagua|all)'); process.exit(2); }
  const t0 = Date.now();
  if (src === 'sinasc') await runSinasc(opts);
  else if (src === 'sim') await runSim(opts);
  else if (src === 'pni') await runPni(opts);
  else if (src === 'sinan') await runSinan(opts);
  else if (src === 'sisagua') await runSisagua(opts);
  else if (src === 'all') {
    await runSinasc(opts); await runSim(opts);
    await runPni(opts);    await runSinan(opts); await runSisagua(opts);
  } else { console.error('unknown source: ' + src); process.exit(2); }
  console.log(`[runner] DONE in ${((Date.now()-t0)/1000).toFixed(1)}s`);
}

if (require.main === module) {
  main().catch(e => { console.error('[runner] FATAL', e); process.exit(1); });
}

module.exports = { runSinasc, runSim, runPni, runSisagua, withPool, batchUpsert };
