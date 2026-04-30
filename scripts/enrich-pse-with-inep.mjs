#!/usr/bin/env node
/**
 * enrich-pse-with-inep.mjs
 *
 * Enriquece pse-municipios.json adicionando o campo `inep` em cada escola
 * pactuada (=`co_entidade` do Censo Escolar), permitindo que o frontend
 * case a escola atual (que já conhece seu INEP) com a entrada do PSE
 * sem depender de matching por nome.
 *
 * A API do PSE expõe apenas `coSeqPseEstabelecimento` (chave própria do MS)
 * e `noEstabelecimento`. Não há INEP. Resolvemos o INEP localmente via
 * censo_escolas (PostgreSQL) por (município + nome normalizado + esfera).
 *
 * Mapeamento esfera ↔ tp_dependencia (Censo INEP):
 *   FEDERAL=1, ESTADUAL=2, MUNICIPAL=3, PRIVADA=4
 *
 * Município: PSE expõe IBGE6 (110001), Censo guarda IBGE7 bigint (1100015).
 * Casamento: (co_municipio / 10) = ibge6.
 *
 * Uso:
 *   node scripts/enrich-pse-with-inep.mjs
 *   PSE_INPUT=pse-municipios.json PSE_OUTPUT=pse-municipios.json node scripts/enrich-pse-with-inep.mjs
 *
 * Requer RAILWAY_DATABASE_URL. Se não houver, sai com warning sem alterar nada.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const ROOT = process.cwd();
const INPUT = resolve(ROOT, process.env.PSE_INPUT || "pse-municipios.json");
const OUTPUT = resolve(ROOT, process.env.PSE_OUTPUT || INPUT);
const DB_URL = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  console.warn("[enrich-pse] RAILWAY_DATABASE_URL ausente — pulando enriquecimento.");
  process.exit(0);
}

const ESFERA_TO_DEP = { FEDERAL: "1", ESTADUAL: "2", MUNICIPAL: "3", PRIVADA: "4" };

function norm(x) {
  return String(x ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

(async () => {
  console.log(`[enrich-pse] lendo ${INPUT}`);
  const data = JSON.parse(readFileSync(INPUT, "utf8"));
  const municipios = data.municipios || {};
  const ibge6List = Object.keys(municipios).filter((k) => /^\d{6}$/.test(k));
  console.log(`[enrich-pse] municípios: ${ibge6List.length}`);

  const pool = new pg.Pool({ connectionString: DB_URL });

  let totalEscolas = 0;
  let totalCasadas = 0;
  let totalSemMatch = 0;
  let totalAmbiguas = 0;

  // Para evitar 5500 queries individuais, batch por chunks de N municípios
  const CHUNK = 200;
  for (let off = 0; off < ibge6List.length; off += CHUNK) {
    const chunk = ibge6List.slice(off, off + CHUNK);
    const ibge6Nums = chunk.map(Number);
    // Pega TODAS as escolas (todos os anos) para esses municípios e
    // dedupa por co_entidade pegando o ano mais recente.
    const sql = `
      SELECT DISTINCT ON (co_entidade)
        co_entidade,
        no_entidade,
        tp_dependencia,
        (co_municipio / 10)::int AS ibge6
      FROM censo_escolas
      WHERE (co_municipio / 10)::int = ANY($1::int[])
      ORDER BY co_entidade, ano DESC
    `;
    const r = await pool.query(sql, [ibge6Nums]);
    // map: ibge6 -> Map<dep, Map<normname, [inep,...]>>
    const byMun = new Map();
    for (const row of r.rows) {
      const m = byMun.get(row.ibge6) || new Map();
      const dep = String(row.tp_dependencia ?? "");
      const depMap = m.get(dep) || new Map();
      const nm = norm(row.no_entidade);
      const arr = depMap.get(nm) || [];
      arr.push(Number(row.co_entidade));
      depMap.set(nm, arr);
      m.set(dep, depMap);
      byMun.set(row.ibge6, m);
    }

    for (const ibge6 of chunk) {
      const mun = municipios[ibge6];
      if (!mun || !Array.isArray(mun.escolas)) continue;
      const mapDep = byMun.get(Number(ibge6));
      for (const escola of mun.escolas) {
        totalEscolas += 1;
        const dep = ESFERA_TO_DEP[String(escola.esfera || "").toUpperCase()] || null;
        const nm = norm(escola.nome);
        let inep = null;
        let ambigua = false;
        // Política: só atribui INEP quando o casamento for ÚNICO. Em casos ambíguos
        // (>1 candidato pelo mesmo nome+dep, ou >1 entre dependências no fallback),
        // mantemos inep=null — o frontend cai no fallback por nome normalizado e o
        // município ainda pode ser identificado, sem risco de atribuir badges PSE
        // à escola errada (a etiqueta "Escola aderiu" é per-escola e seria errada
        // se o INEP apontasse para outro estabelecimento homônimo).
        if (mapDep && dep) {
          const depMap = mapDep.get(dep);
          if (depMap) {
            const candidatos = depMap.get(nm);
            if (candidatos && candidatos.length === 1) inep = candidatos[0];
            else if (candidatos && candidatos.length > 1) ambigua = true;
          }
        }
        // Fallback: nenhum match na dep esperada — tenta nome em qualquer dependência
        if (!inep && !ambigua && mapDep) {
          const todos = [];
          for (const depMap of mapDep.values()) {
            const cand = depMap.get(nm);
            if (cand) todos.push(...cand);
          }
          if (todos.length === 1) inep = todos[0];
          else if (todos.length > 1) ambigua = true;
        }
        escola.inep = inep;
        if (inep) totalCasadas += 1;
        else totalSemMatch += 1;
        if (ambigua) totalAmbiguas += 1;
      }
    }
    process.stdout.write(`  ${Math.min(off + CHUNK, ibge6List.length)}/${ibge6List.length}\r`);
  }
  process.stdout.write("\n");

  await pool.end();

  // Atualiza meta
  data.meta = data.meta || {};
  data.meta.inepEnriquecidoEm = new Date().toISOString();
  data.meta.inepStats = {
    escolas: totalEscolas,
    casadas: totalCasadas,
    semMatch: totalSemMatch,
    ambiguas: totalAmbiguas,
    pctCasadas: totalEscolas ? Math.round((totalCasadas / totalEscolas) * 1000) / 10 : 0,
  };

  writeFileSync(OUTPUT, JSON.stringify(data));
  console.log(
    `[enrich-pse] gravado ${OUTPUT}: ${totalCasadas}/${totalEscolas} casadas (${data.meta.inepStats.pctCasadas}%), ${totalSemMatch} sem match, ${totalAmbiguas} ambíguas`,
  );
})().catch((err) => {
  console.error("[enrich-pse] ERRO:", err);
  process.exit(1);
});
