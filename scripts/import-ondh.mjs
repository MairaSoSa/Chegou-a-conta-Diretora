/**
 * import-ondh.mjs
 * Downloads ONDH (Ouvidoria Nacional de Direitos Humanos) CSV data from dados.gov.br
 * and imports into PostgreSQL table ondh_denuncias.
 *
 * Usage:
 *   node scripts/import-ondh.mjs
 *
 * Requires: RAILWAY_DATABASE_URL or DATABASE_URL environment variable.
 * Idempotent: safe to re-run (uses INSERT ... ON CONFLICT DO NOTHING).
 */

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import https from 'https';
import http from 'http';
import zlib from 'zlib';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env ──────────────────────────────────────────────────────────────────
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
if (!DB_URL) {
  console.error('[import-ondh] ERROR: RAILWAY_DATABASE_URL or DATABASE_URL not set.');
  process.exit(1);
}

// ── PostgreSQL client ──────────────────────────────────────────────────────────
let pg;
try {
  pg = require('pg');
} catch (e) {
  console.error('[import-ondh] pg package not found. Install with: npm install pg');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

// ── CSV parser ─────────────────────────────────────────────────────────────────
// Simple RFC-4180 CSV parser (handles quoted fields)
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];
  const parseRow = (line) => {
    const fields = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuote) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQuote = false;
        else cur += ch;
      } else {
        if (ch === '"') inQuote = true;
        else if (ch === ';' || ch === ',') { fields.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
    }
    fields.push(cur.trim());
    return fields;
  };

  const headers = parseRow(lines[0]).map(h => h.replace(/^\uFEFF/, '').trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseRow(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ''; });
    rows.push(obj);
  }
  return rows;
}

// ── HTTP fetch helper ──────────────────────────────────────────────────────────
function fetchUrl(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects === 0) return reject(new Error('Too many redirects'));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: { 'User-Agent': 'ChegoAContaDiretora/ONDH-Import/1.0', 'Accept': 'text/csv,application/csv,application/octet-stream,*/*' },
      timeout: 120000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        const next = loc.startsWith('http') ? loc : new URL(loc, url).href;
        res.destroy();
        return resolve(fetchUrl(next, redirects - 1));
      }
      if (res.statusCode !== 200) {
        res.destroy();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      const encoding = res.headers['content-encoding'];
      let stream = res;
      if (encoding === 'gzip') stream = res.pipe(zlib.createGunzip());
      else if (encoding === 'deflate') stream = res.pipe(zlib.createInflate());
      stream.on('data', c => chunks.push(c));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

// ── Create table ───────────────────────────────────────────────────────────────
async function createTable(client) {
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
      UNIQUE (co_ibge, semestre, canal, tp_violacao, ds_especie_violacao, grupo_vulneravel, tp_sexo_vitima, faixa_etaria_vitima)
    );
    CREATE INDEX IF NOT EXISTS idx_ondh_co_ibge ON ondh_denuncias(co_ibge);
    CREATE INDEX IF NOT EXISTS idx_ondh_semestre ON ondh_denuncias(semestre);
  `);
  console.log('[import-ondh] Table ondh_denuncias ensured.');
}

// ── Known ONDH CSV datasets on dados.gov.br ────────────────────────────────────
// These are the known package IDs / resource links for ONDH data.
// The API at dados.gov.br returns resource download URLs.
const ONDH_DATASET_IDS = [
  'disque-100',
  'ouvidoria-nacional-de-direitos-humanos-ondh',
  'disque-direitos-humanos-disque-100',
];

const ONDH_FALLBACK_URLS = [
  // Disque 100 consolidated datasets (publicly known URLs from dados.gov.br)
  'https://dados.gov.br/api/3/action/package_show?id=disque-direitos-humanos-disque-100',
  'https://dados.gov.br/api/3/action/package_show?id=ouvidoria-nacional-de-direitos-humanos-ondh',
  'https://dados.gov.br/api/3/action/package_show?id=disque-100',
];

// ── Discover CSV download URLs from dados.gov.br CKAN API ─────────────────────
async function discoverCsvUrls() {
  const csvUrls = [];

  for (const apiUrl of ONDH_FALLBACK_URLS) {
    try {
      console.log(`[import-ondh] Trying: ${apiUrl}`);
      const buf = await fetchUrl(apiUrl);
      const data = JSON.parse(buf.toString('utf8'));
      const resources = data?.result?.resources || [];
      for (const r of resources) {
        const url = r.url || r.download_url || '';
        const fmt = (r.format || '').toLowerCase();
        if (url && (fmt === 'csv' || url.toLowerCase().endsWith('.csv') || url.toLowerCase().includes('.csv'))) {
          const name = (r.name || r.description || url).toLowerCase();
          // Only include resources from 2020 onwards (task requirement)
          if (!name.match(/201[0-9]/) && !name.match(/2019/)) {
            csvUrls.push({ url, name: r.name || r.description || 'ondh' });
          }
        }
      }
      if (csvUrls.length > 0) {
        console.log(`[import-ondh] Found ${csvUrls.length} CSV resource(s) from ${apiUrl}`);
        break;
      }
    } catch (e) {
      console.warn(`[import-ondh] Failed to fetch ${apiUrl}: ${e.message}`);
    }
  }

  return csvUrls;
}

// ── Map CSV row to DB columns ──────────────────────────────────────────────────
function mapRow(row) {
  // Try to find the IBGE code from common column name variants
  const co_ibge = (
    row['co_ibge'] || row['codigo_ibge'] || row['co_municipio'] || row['cd_municipio'] ||
    row['ibge'] || row['municipio_ibge'] || ''
  ).replace(/\D/g, '').slice(0, 7) || null;

  const sg_uf = (row['sg_uf'] || row['uf'] || row['estado'] || '').trim().toUpperCase().slice(0, 2) || null;
  const no_municipio = (row['no_municipio'] || row['municipio'] || row['nm_municipio'] || '').trim().slice(0, 120) || null;

  // Semestre: try to derive from column if present, otherwise from ano/semestre combo
  let semestre = (row['semestre'] || row['ds_semestre'] || row['periodo'] || '').trim().slice(0, 10);
  if (!semestre) {
    const ano = (row['ano'] || row['nu_ano'] || '').trim();
    const sem = (row['nu_semestre'] || row['no_semestre'] || '').trim();
    if (ano && sem) semestre = `${ano}-S${sem}`;
    else if (ano) semestre = ano;
  }

  const canal = (row['canal'] || row['ds_canal'] || row['no_canal'] || row['tipo_canal'] || '').trim().slice(0, 60) || null;

  const tp_violacao = (
    row['tp_violacao'] || row['tipo_violacao'] || row['no_tipo_violacao'] ||
    row['ds_tipo_violacao'] || row['violacao'] || ''
  ).trim().slice(0, 120) || null;

  const ds_especie_violacao = (
    row['ds_especie_violacao'] || row['especie_violacao'] || row['no_especie'] ||
    row['ds_violacao'] || row['especie'] || ''
  ).trim().slice(0, 200) || null;

  const grupo_vulneravel = (
    row['grupo_vulneravel'] || row['ds_grupo_vulneravel'] || row['no_grupo_vulneravel'] ||
    row['grupo'] || row['publico'] || ''
  ).trim().slice(0, 120) || null;

  const tp_sexo_vitima = (
    row['tp_sexo_vitima'] || row['sexo_vitima'] || row['sexo'] || row['ds_sexo'] || ''
  ).trim().slice(0, 20) || null;

  const faixa_etaria_vitima = (
    row['faixa_etaria_vitima'] || row['faixa_etaria'] || row['ds_faixa_etaria'] ||
    row['faixa_idade'] || ''
  ).trim().slice(0, 40) || null;

  // Some datasets aggregate: look for a quantidade / count column
  const qtdRaw = row['quantidade'] || row['qt_denuncias'] || row['total'] || row['count'] || '1';
  const quantidade = parseInt(String(qtdRaw).replace(/\D/g, ''), 10) || 1;

  return { co_ibge, sg_uf, no_municipio, semestre, canal, tp_violacao, ds_especie_violacao, grupo_vulneravel, tp_sexo_vitima, faixa_etaria_vitima, quantidade };
}

// ── Import a single CSV buffer ─────────────────────────────────────────────────
async function importCsvBuffer(client, buf, label) {
  let text;
  try {
    text = buf.toString('utf-8');
    if (text.includes('\uFFFD')) text = buf.toString('latin1');
  } catch {
    text = buf.toString('latin1');
  }

  const rows = parseCSV(text);
  if (rows.length === 0) {
    console.warn(`[import-ondh] No rows parsed from ${label}`);
    return 0;
  }

  let inserted = 0;
  let skipped = 0;
  const BATCH = 500;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const values = [];
    const placeholders = [];
    let paramIdx = 1;

    for (const row of batch) {
      const r = mapRow(row);
      // Skip rows with no useful data
      if (!r.co_ibge && !r.no_municipio) { skipped++; continue; }
      placeholders.push(
        `($${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++})`
      );
      values.push(
        r.co_ibge, r.sg_uf, r.no_municipio, r.semestre,
        r.canal, r.tp_violacao, r.ds_especie_violacao,
        r.grupo_vulneravel, r.tp_sexo_vitima, r.faixa_etaria_vitima,
        r.quantidade
      );
    }

    if (placeholders.length === 0) continue;

    const sql = `
      INSERT INTO ondh_denuncias
        (co_ibge, sg_uf, no_municipio, semestre, canal, tp_violacao, ds_especie_violacao, grupo_vulneravel, tp_sexo_vitima, faixa_etaria_vitima, quantidade)
      VALUES ${placeholders.join(',')}
      ON CONFLICT (co_ibge, semestre, canal, tp_violacao, ds_especie_violacao, grupo_vulneravel, tp_sexo_vitima, faixa_etaria_vitima)
      DO UPDATE SET quantidade = EXCLUDED.quantidade
    `;

    try {
      const res = await client.query(sql, values);
      inserted += res.rowCount || 0;
    } catch (e) {
      console.warn(`[import-ondh] Batch insert error: ${e.message}`);
    }
  }

  console.log(`[import-ondh] ${label}: ${inserted} inserted/updated, ${skipped} skipped (no geo info).`);
  return inserted;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();
  try {
    await createTable(client);

    const csvUrls = await discoverCsvUrls();

    if (csvUrls.length === 0) {
      console.warn('[import-ondh] No CSV URLs discovered from dados.gov.br. Check dataset availability.');
      console.warn('[import-ondh] You can manually specify CSV paths as arguments: node import-ondh.mjs /path/to/file.csv');

      // Try command-line arguments for local files
      const args = process.argv.slice(2);
      if (args.length === 0) {
        console.log('[import-ondh] No local files specified. Exiting.');
        return;
      }
      for (const filePath of args) {
        if (!fs.existsSync(filePath)) { console.warn(`[import-ondh] File not found: ${filePath}`); continue; }
        const buf = fs.readFileSync(filePath);
        await importCsvBuffer(client, buf, path.basename(filePath));
      }
      return;
    }

    let totalInserted = 0;
    for (const { url, name } of csvUrls) {
      console.log(`[import-ondh] Downloading: ${name} — ${url}`);
      try {
        const buf = await fetchUrl(url);
        const count = await importCsvBuffer(client, buf, name);
        totalInserted += count;
      } catch (e) {
        console.warn(`[import-ondh] Failed to download/import ${name}: ${e.message}`);
      }
    }

    console.log(`[import-ondh] Done. Total records inserted/updated: ${totalInserted}`);

    // Also check local CSV files passed as arguments
    const args = process.argv.slice(2);
    for (const filePath of args) {
      if (!fs.existsSync(filePath)) { console.warn(`[import-ondh] File not found: ${filePath}`); continue; }
      const buf = fs.readFileSync(filePath);
      const count = await importCsvBuffer(client, buf, path.basename(filePath));
      totalInserted += count;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => {
  console.error('[import-ondh] Fatal error:', e.message);
  process.exit(1);
});
