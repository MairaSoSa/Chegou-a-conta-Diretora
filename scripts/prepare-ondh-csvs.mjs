/**
 * prepare-ondh-csvs.mjs
 * Downloads COMPLETE Disque 100 CSV files from dadosabertos.mdh.gov.br using
 * chunked HTTP Range requests (10 MB per request) to avoid environment timeouts.
 * Enriches rows with IBGE municipality codes from vw_municipios,
 * aggregates by dimension, and upserts into ondh_denuncias.
 *
 * Import is idempotent: existing rows for each (semestre, canal) pair are
 * deleted before new data is inserted for that period.
 *
 * Usage:
 *   node scripts/prepare-ondh-csvs.mjs          # all files
 *   node scripts/prepare-ondh-csvs.mjs 2020-S1  # specific semester only
 *
 * Requires: RAILWAY_DATABASE_URL or DATABASE_URL environment variable.
 */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import https from 'https';
import http from 'http';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (key && typeof process.env[key] === 'undefined') process.env[key] = val;
  }
}
loadEnv();

const DB_URL = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;
if (!DB_URL) { console.error('[prepare-ondh] ERROR: RAILWAY_DATABASE_URL or DATABASE_URL not set.'); process.exit(1); }

let pg;
try { pg = require('pg'); } catch { console.error('[prepare-ondh] pg not found. Run: npm install pg'); process.exit(1); }

const pool = new pg.Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

const CHUNK_BYTES = 10 * 1024 * 1024;

// ── Table management ───────────────────────────────────────────────────────────
async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ondh_denuncias (
      id SERIAL PRIMARY KEY,
      co_ibge VARCHAR(7),
      sg_uf VARCHAR(2),
      no_municipio VARCHAR(120),
      semestre VARCHAR(10),
      canal VARCHAR(60),
      tp_violacao VARCHAR(120),
      ds_especie_violacao VARCHAR(200),
      grupo_vulneravel VARCHAR(120),
      tp_sexo_vitima VARCHAR(20),
      faixa_etaria_vitima VARCHAR(40),
      quantidade INTEGER NOT NULL DEFAULT 1,
      UNIQUE (co_ibge, semestre, canal, tp_violacao, ds_especie_violacao,
              grupo_vulneravel, tp_sexo_vitima, faixa_etaria_vitima)
    );
    CREATE INDEX IF NOT EXISTS idx_ondh_co_ibge   ON ondh_denuncias(co_ibge);
    CREATE INDEX IF NOT EXISTS idx_ondh_semestre  ON ondh_denuncias(semestre);
  `);
  console.log('[prepare-ondh] Table ondh_denuncias ensured.');
}

async function deleteForSemestre(client, semestre, canal) {
  const r = await client.query(
    'DELETE FROM ondh_denuncias WHERE semestre = $1 AND canal = $2',
    [semestre, canal]
  );
  console.log(`[prepare-ondh] Deleted ${r.rowCount} rows for semestre=${semestre} canal=${canal}`);
}

// ── Municipality IBGE lookup ───────────────────────────────────────────────────
async function buildIbgeLookup(client) {
  const res = await client.query('SELECT co_municipio, no_municipio, uf FROM vw_municipios');
  const lookup = new Map();
  for (const row of res.rows) {
    lookup.set(`${row.uf.toUpperCase()}|${normName(row.no_municipio)}`, String(row.co_municipio));
  }
  console.log(`[prepare-ondh] Loaded ${lookup.size} municipality codes from vw_municipios.`);
  return lookup;
}

function normName(s) {
  return (s || '').toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function resolveIbge(lookup, uf, mun) {
  return mun ? (lookup.get(`${(uf || '').trim().toUpperCase()}|${normName(mun)}`) || null) : null;
}

// ── CSV utilities ──────────────────────────────────────────────────────────────
function csvParseField(line, sep) {
  const fields = []; let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === sep) { fields.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

function normalizeHeader(h) {
  return h.replace(/^\uFEFF/, '').trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function getField(row, ...keys) {
  for (const k of keys) { if (row[k] !== undefined && row[k] !== '' && row[k] !== 'NULL') return row[k]; }
  return '';
}

// Parse municipality field that may contain an embedded IBGE code: "261160 | RECIFE"
// (format introduced in 2022-S2 and standard in 2023+)
function parseMunicipio(raw) {
  const s = (raw || '').trim();
  if (!s || s === 'NULL') return { co_ibge: null, name: null };
  const pipe = s.indexOf('|');
  if (pipe > 0) {
    const code = s.slice(0, pipe).trim().replace(/\D/g, '').slice(0, 7);
    const name = s.slice(pipe + 1).trim().slice(0, 120);
    return { co_ibge: code || null, name: name || null };
  }
  return { co_ibge: null, name: s.slice(0, 120) };
}

// Parse UF field which may be:
//   "SP"          → plain 2-letter UF code (most common)
//   "SP | SÃO PAULO" → code before pipe (take first token)
//   "BR" or "BR | BRASIL" → country-level record, no specific UF → return ""
function parseUf(raw) {
  const s = (raw || '').trim();
  if (!s || s === 'NULL') return '';
  const pipe = s.indexOf('|');
  // Take the token before the pipe (or the whole value if no pipe)
  const first = (pipe > 0 ? s.slice(0, pipe).trim() : s).toUpperCase().slice(0, 2);
  // "BR" is the ISO-3166 country code for Brazil — not a UF code
  if (first === 'BR') {
    // If there is a part after the pipe, it might be a UF code or state name
    if (pipe > 0) {
      const after = s.slice(pipe + 1).trim().toUpperCase().slice(0, 2);
      // Only use it if it looks like a valid 2-letter UF (not "BR", not empty, not digits)
      if (after && after !== 'BR' && /^[A-Z]{2}$/.test(after)) return after;
    }
    return '';
  }
  return first;
}

// Extract normalized fields from a CSV row.
// CSV column naming varies across years:
//   2020–2022-S1: spaces, e.g. "Município da vítima", "Grupo vulnerável"
//   2022-S2+: underscores, e.g. "Município_da_vítima", "Grupo_vulnerável"
//   2023+: municipality values embed IBGE code "261160 | RECIFE";
//           one column exported as "(Nenhum nome de coluna)" (blank name in source)
//           which contains the grupo_vulneravel data.
function extractRow(row, source) {
  const munRaw = getField(row,
    'municipio  da vitima', 'municipio da vitima', 'municipio vitima',
    'municipio', 'nm municipio'
  );
  if (!munRaw) return null;

  const { co_ibge: embeddedIbge, name: munName } = parseMunicipio(munRaw);

  const ufRaw = getField(row, 'uf da vitima', 'uf vitima', 'uf', 'estado');
  const uf = parseUf(ufRaw);

  const canal = (getField(row, 'canal de atendimento') || source.canal).trim().slice(0, 60);

  const tp_violacao = getField(row, 'violacao', 'violacoes', 'tipo violacao', 'cenario da violacao').trim().slice(0, 120) || null;

  // grupo_vulneravel: the column is named "(Nenhum nome de coluna)" in 2023+ CSV exports
  // (the source system exports an unnamed column at that position); after normalization
  // it becomes "nenhum nome de coluna". In earlier years the column is "Grupo_vulnerável".
  const grupo_vulneravel = getField(row,
    'grupo vulneravel',
    'nenhum nome de coluna',
    'grupo', 'publico alvo'
  ).trim().slice(0, 120) || null;

  const tp_sexo_vitima = getField(row,
    'sexo da vitima', 'genero da vitima', 'sexo vitima', 'genero vitima', 'sexo'
  ).trim().slice(0, 20) || null;

  const faixa_etaria_vitima = getField(row,
    'faixa etaria da vitima', 'faixa etaria vitima', 'faixa etaria'
  ).trim().slice(0, 40) || null;

  return { embeddedIbge, munName, uf, canal, tp_violacao, grupo_vulneravel, tp_sexo_vitima, faixa_etaria_vitima };
}

// ── HTTP Range request (fetches exactly [start, end] bytes) ───────────────────
function fetchRange(url, start, end) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ONDH-Import/1.0)',
        'Range': `bytes=${start}-${end}`,
      },
      timeout: 60000,
    }, (res) => {
      if (res.statusCode === 416) { resolve(null); return; }
      if (res.statusCode !== 206 && res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url} range ${start}-${end}`));
        res.destroy(); return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Range request timeout')); });
  });
}

// Get the total file size via a Range request for the first byte.
// Using a Range request is more reliable than HEAD on load-balanced origins.
function getFileSize(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-0' },
      timeout: 15000,
    }, (res) => {
      // 206: Content-Range header contains total size as "bytes 0-0/TOTAL"
      const cr = res.headers['content-range'] || '';
      const m = cr.match(/\/(\d+)$/);
      const len = m ? parseInt(m[1], 10) : 0;
      res.destroy();
      if (res.statusCode >= 400 && res.statusCode !== 416) {
        return reject(new Error(`Range probe ${res.statusCode} for ${url}`));
      }
      resolve(len);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Range probe timeout')); });
  });
}

// ── Batch upsert (accumulates within a fresh semestre — idempotent because ────
// we DELETE existing rows before starting the import for each semestre/canal) ──
async function upsertBatch(client, rows) {
  if (!rows.length) return 0;
  const ph = [], vals = [];
  let idx = 1;
  for (const r of rows) {
    ph.push(`($${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++})`);
    vals.push(r.co_ibge, r.sg_uf, r.no_municipio, r.semestre, r.canal, r.tp_violacao,
      r.ds_especie_violacao, r.grupo_vulneravel, r.tp_sexo_vitima, r.faixa_etaria_vitima, r.quantidade);
  }
  // Accumulate quantity across chunks of the same file (safe because table was
  // cleared before this semestre's import began).
  const res = await client.query(`
    INSERT INTO ondh_denuncias
      (co_ibge, sg_uf, no_municipio, semestre, canal, tp_violacao, ds_especie_violacao,
       grupo_vulneravel, tp_sexo_vitima, faixa_etaria_vitima, quantidade)
    VALUES ${ph.join(',')}
    ON CONFLICT (co_ibge, semestre, canal, tp_violacao, ds_especie_violacao,
                 grupo_vulneravel, tp_sexo_vitima, faixa_etaria_vitima)
    DO UPDATE SET quantidade = ondh_denuncias.quantidade + EXCLUDED.quantidade
  `, vals);
  return res.rowCount || 0;
}

// ── Process one source file by downloading complete content in Range chunks ────
async function processSource(source, ibgeLookup, client) {
  const label = path.basename(source.url, '.csv');
  console.log(`\n[prepare-ondh] === Processing: ${label} (semestre=${source.semestre}) ===`);

  let totalSize;
  try {
    totalSize = await getFileSize(source.url);
  } catch (e) {
    console.error(`[prepare-ondh] Cannot get file size for ${label}: ${e.message}`);
    return 0;
  }
  // If content-range not available, use a 2 GB sentinel and let fetchRange's 416 response stop the loop.
  if (!totalSize) {
    console.warn(`[prepare-ondh] No content-range for ${label}. Will loop until EOF (416).`);
    totalSize = 2 * 1024 * 1024 * 1024;
  }
  console.log(`[prepare-ondh] File size: ${(totalSize / 1e6).toFixed(1)} MB — downloading in ${Math.ceil(totalSize / CHUNK_BYTES)} chunks of 10 MB.`);

  // Idempotency: delete all existing rows for this semestre/canal before importing
  await deleteForSemestre(client, source.semestre, source.canal);

  let headers = null;
  let sep = ';';
  let partial = '';
  let totalLines = 0;
  let skipped = 0;
  let totalInserted = 0;

  for (let start = 0; start < totalSize; start += CHUNK_BYTES) {
    const end = Math.min(start + CHUNK_BYTES - 1, totalSize - 1);
    const chunkIndex = Math.floor(start / CHUNK_BYTES) + 1;
    const totalChunks = Math.ceil(totalSize / CHUNK_BYTES);

    let buf;
    try {
      buf = await fetchRange(source.url, start, end);
    } catch (e) {
      console.error(`[prepare-ondh] ERROR fetching chunk ${chunkIndex}/${totalChunks} of ${label}: ${e.message}`);
      throw e;
    }
    if (!buf) { console.log(`[prepare-ondh] ${label}: EOF at chunk ${chunkIndex}. Done.`); break; }

    const text = (partial + buf.toString('latin1'));
    const lines = text.split('\n');
    partial = lines.pop();

    const agg = new Map();

    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, '');
      if (!line.trim()) continue;

      if (!headers) {
        sep = line.includes(';') ? ';' : ',';
        headers = csvParseField(line, sep).map(normalizeHeader);
        continue;
      }

      totalLines++;
      const vals = csvParseField(line, sep);
      const row = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });

      const extracted = extractRow(row, source);
      if (!extracted) { skipped++; continue; }

      const { embeddedIbge, munName, uf, canal, tp_violacao, grupo_vulneravel, tp_sexo_vitima, faixa_etaria_vitima } = extracted;

      const co_ibge = embeddedIbge || resolveIbge(ibgeLookup, uf, munName);
      if (!co_ibge && !munName) { skipped++; continue; }

      const dim = {
        co_ibge: co_ibge || null,
        sg_uf: uf || null,
        no_municipio: (munName || '').slice(0, 120) || null,
        semestre: source.semestre,
        canal: canal || null,
        tp_violacao,
        ds_especie_violacao: null,
        grupo_vulneravel,
        tp_sexo_vitima,
        faixa_etaria_vitima,
      };

      const key = [co_ibge || '', source.semestre, canal || '', tp_violacao || '', '',
        grupo_vulneravel || '', tp_sexo_vitima || '', faixa_etaria_vitima || ''].join('||');

      const existing = agg.get(key);
      if (existing) existing.quantidade++;
      else agg.set(key, { dim, quantidade: 1 });
    }

    if (agg.size > 0) {
      const entries = [...agg.values()];
      const BATCH = 500;
      for (let i = 0; i < entries.length; i += BATCH) {
        const batch = entries.slice(i, i + BATCH).map(({ dim, quantidade }) => ({ ...dim, quantidade }));
        const n = await upsertBatch(client, batch);
        totalInserted += n;
      }
    }

    if (chunkIndex % 5 === 0 || chunkIndex === totalChunks) {
      const pct = ((end + 1) / totalSize * 100).toFixed(1);
      console.log(`[prepare-ondh] ${label}: chunk ${chunkIndex}/${totalChunks} (${pct}%) — ${totalLines} rows, ${totalInserted} DB entries`);
    }
  }

  // Process any remaining partial line
  if (partial.trim() && headers) {
    const vals = csvParseField(partial.replace(/\r$/, ''), sep);
    const row = {}; headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
    const extracted = extractRow(row, source);
    if (extracted) {
      const { embeddedIbge, munName, uf, canal, tp_violacao, grupo_vulneravel, tp_sexo_vitima, faixa_etaria_vitima } = extracted;
      const co_ibge = embeddedIbge || resolveIbge(ibgeLookup, uf, munName);
      if (co_ibge || munName) {
        const row2 = {
          co_ibge: co_ibge || null, sg_uf: uf || null,
          no_municipio: (munName || '').slice(0, 120) || null,
          semestre: source.semestre, canal: canal || null, tp_violacao,
          ds_especie_violacao: null, grupo_vulneravel, tp_sexo_vitima, faixa_etaria_vitima,
          quantidade: 1,
        };
        await upsertBatch(client, [row2]);
      }
    }
  }

  const ibgeCount = await client.query(
    'SELECT COUNT(*) FROM ondh_denuncias WHERE semestre=$1 AND co_ibge IS NOT NULL', [source.semestre]
  );
  console.log(`[prepare-ondh] ${label}: DONE. Total rows=${totalLines}, skipped=${skipped}, DB entries=${totalInserted}, IBGE-coded=${ibgeCount.rows[0].count}`);
  return totalInserted;
}

// ── Source list: all available ONDH CSV files (verified 200 OK) ────────────────
// Note: Ligue 180 files return 404 from dadosabertos.mdh.gov.br (as of 2026-04).
const ALL_SOURCES = [
  { url: 'https://dadosabertos.mdh.gov.br/disque100-primeiro-semestre-2020.csv', semestre: '2020-S1', canal: 'DISQUE 100' },
  { url: 'https://dadosabertos.mdh.gov.br/disque100-segundo-semestre-2020.csv',  semestre: '2020-S2', canal: 'DISQUE 100' },
  { url: 'https://dadosabertos.mdh.gov.br/disque100-primeiro-semestre-2021.csv', semestre: '2021-S1', canal: 'DISQUE 100' },
  { url: 'https://dadosabertos.mdh.gov.br/disque100-segundo-semestre-2021.csv',  semestre: '2021-S2', canal: 'DISQUE 100' },
  { url: 'https://dadosabertos.mdh.gov.br/disque100-primeiro-semestre-2022.csv', semestre: '2022-S1', canal: 'DISQUE 100' },
  { url: 'https://dadosabertos.mdh.gov.br/disque100-segundo-semestre-2022.csv',  semestre: '2022-S2', canal: 'DISQUE 100' },
  { url: 'https://dadosabertos.mdh.gov.br/disque100-primeiro-semestre-2023.csv', semestre: '2023-S1', canal: 'DISQUE 100' },
  { url: 'https://dadosabertos.mdh.gov.br/disque100-segundo-semestre-2023.csv',  semestre: '2023-S2', canal: 'DISQUE 100' },
];

async function main() {
  const semestroFilter = process.argv[2] || null;
  const sources = semestroFilter
    ? ALL_SOURCES.filter(s => s.semestre === semestroFilter)
    : ALL_SOURCES;

  if (!sources.length) {
    console.error(`[prepare-ondh] No sources found for filter: ${semestroFilter}`);
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await ensureTable(client);
    const ibgeLookup = await buildIbgeLookup(client);

    let grandTotal = 0;
    for (const source of sources) {
      const n = await processSource(source, ibgeLookup, client);
      grandTotal += n;
    }

    const [cntRes, ibgeRes, semRes] = await Promise.all([
      client.query('SELECT COUNT(*) FROM ondh_denuncias'),
      client.query('SELECT COUNT(DISTINCT co_ibge) FROM ondh_denuncias WHERE co_ibge IS NOT NULL'),
      client.query('SELECT semestre, SUM(quantidade)::bigint AS total FROM ondh_denuncias GROUP BY semestre ORDER BY semestre'),
    ]);

    console.log('\n[prepare-ondh] ============ Import Complete ============');
    console.log(`[prepare-ondh] Total DB rows: ${cntRes.rows[0].count}`);
    console.log(`[prepare-ondh] Distinct municipalities with IBGE: ${ibgeRes.rows[0].count}`);
    console.log('[prepare-ondh] Denúncias by semester:');
    for (const r of semRes.rows) console.log(`  ${r.semestre}: ${r.total}`);
    console.log('[prepare-ondh] ========================================');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => {
  console.error('[prepare-ondh] Fatal error:', e.message);
  process.exit(1);
});
