#!/usr/bin/env node
/**
 * sync-pse-municipios.mjs
 *
 * Coleta dados de adesão ao Programa Saúde na Escola (PSE) do ciclo vigente
 * (2025/2026, coPseCiclo=5) e agrega por município (IBGE6).
 *
 * Fonte primária: API pública do Relatórios APS
 *   https://relatorioaps-prd.saude.gov.br/adesao/pse/historico?coCiclo=5&coUf=<UF>
 *
 * Esta API alimenta o relatório oficial em
 *   https://relatorioaps.saude.gov.br/adesao/pse
 * e expõe 1 linha por estabelecimento pactuado. O agregador abaixo soma por
 * município de IBGE6 para produzir os indicadores que entram no dashboard:
 *   - aderiu: bool (município tem ao menos 1 estabelecimento pactuado)
 *   - escolasPactuadas: contagem de coSeqPseEstabelecimento únicos
 *   - educandosPactuados: soma de qtdEducandos
 *   - escolasPrioritarias / escolasMaioriaPbf / escolasNutrisus: subcontagens
 *   - dsTipoAdesaoTopo: descrição predominante (urbana/rural)
 *
 * Saída: pse-municipios.json (cache local commitado)
 *
 * Uso:
 *   node scripts/sync-pse-municipios.mjs
 *
 * Re-rodar quando o MS publicar nova adesão (mensal ou quando ciclo mudar).
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const OUTPUT_FILE = process.env.PSE_OUTPUT_JSON || resolve(ROOT, "pse-municipios.json");

const API_BASE = "https://relatorioaps-prd.saude.gov.br";
const UA = "Mozilla/5.0 (chegou-a-conta-diretora sync-pse)";

// 27 UFs (códigos IBGE)
const UFS = [
  { co: 11, sg: "RO" }, { co: 12, sg: "AC" }, { co: 13, sg: "AM" },
  { co: 14, sg: "RR" }, { co: 15, sg: "PA" }, { co: 16, sg: "AP" },
  { co: 17, sg: "TO" }, { co: 21, sg: "MA" }, { co: 22, sg: "PI" },
  { co: 23, sg: "CE" }, { co: 24, sg: "RN" }, { co: 25, sg: "PB" },
  { co: 26, sg: "PE" }, { co: 27, sg: "AL" }, { co: 28, sg: "SE" },
  { co: 29, sg: "BA" }, { co: 31, sg: "MG" }, { co: 32, sg: "ES" },
  { co: 33, sg: "RJ" }, { co: 35, sg: "SP" }, { co: 41, sg: "PR" },
  { co: 42, sg: "SC" }, { co: 43, sg: "RS" }, { co: 50, sg: "MS" },
  { co: 51, sg: "MT" }, { co: 52, sg: "GO" }, { co: 53, sg: "DF" },
];

async function fetchJson(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt >= 3) throw err;
    const wait = attempt * 5000;
    console.warn(`  retry ${attempt}/3 em ${wait / 1000}s (${err.message})`);
    await new Promise((r) => setTimeout(r, wait));
    return fetchJson(url, attempt + 1);
  }
}

async function getCicloVigente() {
  const ciclos = await fetchJson(`${API_BASE}/adesao/pse/ciclos`);
  if (!Array.isArray(ciclos) || !ciclos.length) {
    throw new Error("API /adesao/pse/ciclos retornou vazio");
  }
  ciclos.sort((a, b) => Number(b.coPseCiclo) - Number(a.coPseCiclo));
  return ciclos[0];
}

function ibge6(coIbge) {
  const s = String(coIbge ?? "").replace(/\D/g, "");
  return s.length >= 6 ? s.slice(0, 6) : null;
}

function aggregate(rows, acc) {
  for (const r of rows) {
    const co = ibge6(r.coMunicipioIbge);
    if (!co) continue;
    let m = acc.get(co);
    if (!m) {
      m = {
        nome: r.noMunicipioAcentuado ?? null,
        uf: r.sgUf ?? null,
        escolasPactuadas: 0,
        educandosPactuados: 0,
        escolasPrioritarias: 0,
        escolasMaioriaPbf: 0,
        escolasNutrisus: 0,
        escolasObesidade: 0,
        escolasSinase: 0,
        escolasUrbanas: 0,
        escolasRurais: 0,
        escolasMunicipais: 0,
        escolasEstaduais: 0,
        escolasFederais: 0,
        escolasPrivadas: 0,
        escolas: [],
        _seen: new Set(),
      };
      acc.set(co, m);
    }
    // dedup escolas (a API às vezes repete linha)
    const key = String(r.coSeqPseEstabelecimento ?? "");
    if (!key || m._seen.has(key)) continue;
    m._seen.add(key);

    const aderiu = r.stAdesao === "S";
    const esfera = String(r.dsEsferaAdministrativa ?? "").toUpperCase();
    const prioritaria = r.stPrioritario === "S";
    const maioriaPbf = r.stMaioriaPbf === "S";
    const nutrisus = r.stAdesaoNutrisus === "S";
    const obesidade = r.stObesidade === "S";
    const sinase = r.stSinase === "S";
    const educandos = Number(r.qtdEducandos ?? 0) || 0;

    // lista de escolas do município (independente de adesão)
    m.escolas.push({
      id: Number(r.coSeqPseEstabelecimento) || null,
      nome: r.noEstabelecimento ?? null,
      esfera: esfera || null,
      aderiu,
      educandos,
      prioritaria,
      maioriaPbf,
      nutrisus,
      obesidade,
    });

    if (!aderiu) continue;

    // contagens agregadas só para escolas que aderiram
    m.escolasPactuadas += 1;
    m.educandosPactuados += educandos;
    if (prioritaria) m.escolasPrioritarias += 1;
    if (maioriaPbf) m.escolasMaioriaPbf += 1;
    if (nutrisus) m.escolasNutrisus += 1;
    if (obesidade) m.escolasObesidade += 1;
    if (sinase) m.escolasSinase += 1;
    if (r.dsPseLocalizacao === "URBANA") m.escolasUrbanas += 1;
    else if (r.dsPseLocalizacao === "RURAL") m.escolasRurais += 1;
    if (esfera === "MUNICIPAL") m.escolasMunicipais += 1;
    else if (esfera === "ESTADUAL") m.escolasEstaduais += 1;
    else if (esfera === "FEDERAL") m.escolasFederais += 1;
    else if (esfera === "PRIVADA") m.escolasPrivadas += 1;
  }
}

(async () => {
  console.log("PSE: descobrindo ciclo vigente...");
  const ciclo = await getCicloVigente();
  console.log(`  ciclo vigente: ${ciclo.nuCiclo} (coPseCiclo=${ciclo.coPseCiclo})`);

  const acc = new Map();
  let totalRows = 0;
  let dataApi = null;

  for (const uf of UFS) {
    const url = `${API_BASE}/adesao/pse/historico?coCiclo=${ciclo.coPseCiclo}&coUf=${uf.co}`;
    process.stdout.write(`UF ${uf.sg} (${uf.co})... `);
    const t0 = Date.now();
    const data = await fetchJson(url);
    const rows = Array.isArray(data?.adesoes) ? data.adesoes : [];
    if (data?.data && !dataApi) dataApi = data.data;
    aggregate(rows, acc);
    totalRows += rows.length;
    console.log(`${rows.length} linhas (${Date.now() - t0}ms)`);
    // ser educado com a API
    await new Promise((r) => setTimeout(r, 800));
  }

  // remove _seen antes de serializar
  const municipios = {};
  let muniComAdesao = 0;
  let totalEscolas = 0;
  let totalEducandos = 0;
  for (const [co, m] of acc) {
    delete m._seen;
    if (m.escolasPactuadas > 0) {
      muniComAdesao += 1;
      totalEscolas += m.escolasPactuadas;
      totalEducandos += m.educandosPactuados;
    }
    municipios[co] = m;
  }

  const out = {
    meta: {
      fonte: "Relatórios APS / Ministério da Saúde — adesão ao PSE",
      url: "https://relatorioaps.saude.gov.br/adesao/pse",
      apiUrl: `${API_BASE}/adesao/pse/historico`,
      ciclo: ciclo.nuCiclo,
      coPseCiclo: ciclo.coPseCiclo,
      nuAnoCenso: ciclo.nuAnoCenso,
      nuAnoExercicio: ciclo.nuAnoExercicio,
      dataApi: dataApi,
      sincronizadoEm: new Date().toISOString(),
      totaisBrasil: {
        municipiosComAdesao: muniComAdesao,
        escolasPactuadas: totalEscolas,
        educandosPactuados: totalEducandos,
        linhasApiProcessadas: totalRows,
      },
    },
    municipios,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(out));
  const sizeMb = (Buffer.byteLength(JSON.stringify(out)) / 1024 / 1024).toFixed(2);
  console.log("");
  console.log(`✓ ${OUTPUT_FILE} (${sizeMb} MB)`);
  console.log(`  ciclo ${ciclo.nuCiclo} — ${muniComAdesao} municípios com adesão, ${totalEscolas} escolas, ${totalEducandos} educandos`);
})().catch((err) => {
  console.error("ERRO:", err);
  process.exit(1);
});
