#!/usr/bin/env node
/**
 * sync-arboviroses-sinan.mjs
 *
 * Coleta microdados SINAN de Zika diretamente da API oficial do MS:
 *   GET https://apidadosabertos.saude.gov.br/arboviroses/zikavirus?nu_ano=YYYY&limit=20&offset=N
 *
 * Por que: a Fiocruz/InfoDengue (e a sucessora Mosqlimate) descontinuaram a
 * publicação da série semanal de Zika a partir de fev/2024. A API MS continua
 * publicando notificações individuais (com município de residência, semana
 * epidemiológica e classificação final). Este script pagina todos os
 * registros, agrega por (município, semana) e grava na tabela
 * arboviroses_sinan_municipio para consumo pelo dashboard.
 *
 * Volume aproximado (medido em 2026-04):
 *   - Zika 2025: ~50–55 mil registros (~36 min)
 *   - Zika 2026: ~3–6 mil registros (~3 min)
 *
 * Uso:
 *   node scripts/sync-arboviroses-sinan.mjs                # zika 2025+2026
 *   ARBO_DOENCAS=zika ARBO_ANOS=2026 node scripts/sync-arboviroses-sinan.mjs
 *   ARBO_CONCURRENCY=4 node scripts/sync-arboviroses-sinan.mjs
 *
 * É idempotente: pode interromper e re-executar. Cada lote de páginas é
 * comitado via UPSERT, e o offset corrente é checkpointado em
 * importacao_status (chave: "arbo_sinan_<doenca>_<ano>").
 */

import pg from "pg";

const DOENCAS_PADRAO = ["zika"];
const ANOS_PADRAO = [new Date().getFullYear() - 1, new Date().getFullYear()];

const DOENCAS = (process.env.ARBO_DOENCAS || DOENCAS_PADRAO.join(","))
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const ANOS = (process.env.ARBO_ANOS || ANOS_PADRAO.join(","))
  .split(",")
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => Number.isFinite(n));

const CONCURRENCY = Math.max(1, parseInt(process.env.ARBO_CONCURRENCY || "6", 10));
const PAGE_SIZE = 20; // hard-coded pelo MS (limit > 20 ainda devolve 20)
const COMMIT_EVERY = 250; // páginas por commit (~5k registros)
const RETRY_MAX = 4;
const RETRY_BASE_MS = 1500;

const ENDPOINT_DOENCA = {
  zika: "zikavirus",
  dengue: "dengue",
  chikungunya: "chikungunya",
  chik: "chikungunya",
};

const UA = "chegou-a-conta-diretora sync-arboviroses-sinan/1.0";

// ── Conexão PG ─────────────────────────────────────────────────────────────
const DB_URL = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("ERRO: RAILWAY_DATABASE_URL/DATABASE_URL não definida.");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: DB_URL });

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS arboviroses_sinan_municipio (
      co_municipio_6  varchar(6) NOT NULL,
      doenca          varchar(16) NOT NULL,
      ano             smallint NOT NULL,
      semana          integer NOT NULL,           -- formato YYYYWW (ex: 202614)
      notif_total     integer NOT NULL DEFAULT 0,
      confirmados     integer NOT NULL DEFAULT 0, -- classi_fin in ('5','10','11','12')
      descartados     integer NOT NULL DEFAULT 0, -- classi_fin = '5'(zika descartado) ou '8'
      data_atualizacao timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (co_municipio_6, doenca, semana)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS arbo_sinan_doenca_ano_idx
      ON arboviroses_sinan_municipio (doenca, ano);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS arbo_sinan_checkpoint (
      chave varchar(128) PRIMARY KEY,
      valor text NOT NULL,
      atualizado_em timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function getCheckpoint(chave) {
  const r = await pool.query("SELECT valor FROM arbo_sinan_checkpoint WHERE chave=$1", [chave]);
  return r.rows[0] ? parseInt(r.rows[0].valor, 10) : 0;
}
async function setCheckpoint(chave, valor) {
  await pool.query(
    `INSERT INTO arbo_sinan_checkpoint(chave,valor,atualizado_em) VALUES($1,$2,now())
     ON CONFLICT (chave) DO UPDATE SET valor=excluded.valor, atualizado_em=now()`,
    [chave, String(valor)]
  );
}

// ── HTTP helpers ───────────────────────────────────────────────────────────
async function fetchPage(endpoint, ano, offset, attempt = 1) {
  const url = `https://apidadosabertos.saude.gov.br/arboviroses/${endpoint}?nu_ano=${ano}&limit=${PAGE_SIZE}&offset=${offset}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      if (res.status >= 500 && attempt < RETRY_MAX) {
        await sleep(RETRY_BASE_MS * attempt);
        return fetchPage(endpoint, ano, offset, attempt + 1);
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    return Array.isArray(json.parametros) ? json.parametros : [];
  } catch (err) {
    if (attempt < RETRY_MAX) {
      const wait = RETRY_BASE_MS * attempt;
      console.warn(`    retry ${attempt}/${RETRY_MAX} offset=${offset} em ${wait}ms (${err.message})`);
      await sleep(wait);
      return fetchPage(endpoint, ano, offset, attempt + 1);
    }
    throw err;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Agregação ──────────────────────────────────────────────────────────────
function isCodMun6(s) {
  return typeof s === "string" && /^\d{6}$/.test(s);
}
function classifica(doenca, classiFin) {
  // classi_fin códigos SINAN para zika:
  //   2 = confirmado por critério clínico-epidemiológico
  //  10 = confirmado laboratório
  //  11 = confirmado descart inconclusivo (raro)
  //   5 = descartado
  //   8 = inconclusivo
  const cf = String(classiFin || "").trim();
  const confirmados = new Set(["2", "10", "11", "12"]);
  const descartados = new Set(["5"]);
  return {
    confirmado: confirmados.has(cf) ? 1 : 0,
    descartado: descartados.has(cf) ? 1 : 0,
  };
}

function agrega(mapa, doenca, ano, items) {
  for (const r of items) {
    const co = r.id_mn_resi || r.id_municip;
    if (!isCodMun6(String(co))) continue;
    const sem = parseInt(String(r.sem_not || ""), 10);
    if (!Number.isFinite(sem) || sem < 1900_00) continue;
    const cls = classifica(doenca, r.classi_fin);
    const k = `${co}|${doenca}|${sem}`;
    let acc = mapa.get(k);
    if (!acc) {
      acc = { co_municipio_6: String(co), doenca, ano, semana: sem, notif_total: 0, confirmados: 0, descartados: 0 };
      mapa.set(k, acc);
    }
    acc.notif_total++;
    acc.confirmados += cls.confirmado;
    acc.descartados += cls.descartado;
  }
}

async function flushBatch(mapa) {
  if (!mapa.size) return 0;
  const rows = [...mapa.values()];
  // Bulk UPSERT em chunks de 1000
  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const values = [];
    const params = [];
    let p = 1;
    for (const r of chunk) {
      values.push(`($${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},now())`);
      params.push(
        r.co_municipio_6,
        r.doenca,
        r.ano,
        r.semana,
        r.notif_total,
        r.confirmados,
        r.descartados
      );
    }
    const sql = `
      INSERT INTO arboviroses_sinan_municipio
        (co_municipio_6, doenca, ano, semana, notif_total, confirmados, descartados, data_atualizacao)
      VALUES ${values.join(",")}
      ON CONFLICT (co_municipio_6, doenca, semana) DO UPDATE SET
        notif_total = arboviroses_sinan_municipio.notif_total + EXCLUDED.notif_total,
        confirmados = arboviroses_sinan_municipio.confirmados + EXCLUDED.confirmados,
        descartados = arboviroses_sinan_municipio.descartados + EXCLUDED.descartados,
        ano         = EXCLUDED.ano,
        data_atualizacao = now();
    `;
    await pool.query(sql, params);
  }
  const n = mapa.size;
  mapa.clear();
  return n;
}

// ── Worker pool concorrente ────────────────────────────────────────────────
async function processaDoencaAno(doenca, ano) {
  const endpoint = ENDPOINT_DOENCA[doenca];
  if (!endpoint) {
    console.warn(`  doença desconhecida: ${doenca}`);
    return;
  }
  const ckKey = `arbo_sinan_${doenca}_${ano}`;
  let offset = await getCheckpoint(ckKey);

  console.log(`\n[${doenca} ${ano}] iniciando offset=${offset} concurrency=${CONCURRENCY}`);

  // Primeiro: zera contadores existentes para este (doenca, ano) se for início absoluto
  if (offset === 0) {
    const r = await pool.query(
      "DELETE FROM arboviroses_sinan_municipio WHERE doenca=$1 AND ano=$2",
      [doenca, ano]
    );
    if (r.rowCount > 0) console.log(`  limpeza inicial: ${r.rowCount} linhas`);
  }

  const mapa = new Map();
  let pagesSinceCommit = 0;
  let totalRegistros = 0;
  let exhausted = false;

  while (!exhausted) {
    // Lança CONCURRENCY páginas em paralelo
    const offsets = [];
    for (let i = 0; i < CONCURRENCY; i++) offsets.push(offset + i * PAGE_SIZE);
    const batches = await Promise.all(offsets.map((o) => fetchPage(endpoint, ano, o)));
    let anyEmpty = false;
    for (let i = 0; i < batches.length; i++) {
      const items = batches[i];
      if (items.length === 0) {
        // Marca exausto se a primeira página vazia for menor offset desta rodada
        anyEmpty = true;
      } else {
        agrega(mapa, doenca, ano, items);
        totalRegistros += items.length;
      }
    }
    offset += CONCURRENCY * PAGE_SIZE;
    pagesSinceCommit += CONCURRENCY;

    if (pagesSinceCommit >= COMMIT_EVERY) {
      const flushed = await flushBatch(mapa);
      await setCheckpoint(ckKey, offset);
      console.log(`  ${doenca} ${ano} | offset=${offset} | reg=${totalRegistros} | linhas commit=${flushed}`);
      pagesSinceCommit = 0;
    }

    if (anyEmpty) {
      // Confirma fim com 1 prova adicional (o batch paralelo pode ter "buracos")
      const probe = await fetchPage(endpoint, ano, offset);
      if (probe.length === 0) {
        exhausted = true;
      } else {
        agrega(mapa, doenca, ano, probe);
        totalRegistros += probe.length;
        offset += PAGE_SIZE;
      }
    }
  }

  await flushBatch(mapa);
  await setCheckpoint(ckKey, 0); // reseta checkpoint após sucesso
  console.log(`[${doenca} ${ano}] CONCLUÍDO: ${totalRegistros} registros agregados`);
}

// ── Main ───────────────────────────────────────────────────────────────────
(async () => {
  const t0 = Date.now();
  try {
    await ensureSchema();
    console.log("doenças:", DOENCAS.join(","), "| anos:", ANOS.join(","));
    for (const doenca of DOENCAS) {
      for (const ano of ANOS) {
        await processaDoencaAno(doenca, ano);
      }
    }
    const r = await pool.query(
      "SELECT doenca, ano, COUNT(*) AS linhas, SUM(notif_total) AS notif, SUM(confirmados) AS conf FROM arboviroses_sinan_municipio GROUP BY doenca, ano ORDER BY doenca, ano"
    );
    console.log("\n=== Resumo final por doença/ano ===");
    for (const row of r.rows) {
      console.log(`  ${row.doenca} ${row.ano}: ${row.linhas} (mun×sem) | ${row.notif} notif | ${row.conf} confirmados`);
    }
    console.log(`\nTempo total: ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  } catch (err) {
    console.error("ERRO:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
