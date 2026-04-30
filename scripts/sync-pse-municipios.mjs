#!/usr/bin/env node
/**
 * sync-pse-municipios.mjs
 *
 * Coleta dados de adesão ao Programa Saúde na Escola (PSE) de TODOS os ciclos
 * publicados pelo MS e agrega por município (IBGE6) e por escola
 * (coSeqPseEstabelecimento).
 *
 * Fonte primária: API pública do Relatórios APS
 *   https://relatorioaps-prd.saude.gov.br/adesao/pse/ciclos
 *   https://relatorioaps-prd.saude.gov.br/adesao/pse/historico?coCiclo=<n>
 *
 * Esta API alimenta o relatório oficial em
 *   https://relatorioaps.saude.gov.br/adesao/pse
 * e expõe 1 linha por estabelecimento pactuado em cada ciclo.
 *
 * O agregador abaixo:
 *   - Itera por todos os ciclos (do mais novo para o mais antigo)
 *   - Para cada escola (chave estável = coSeqPseEstabelecimento), guarda a
 *     série histórica `historico` com {ciclo, codigo_ciclo, aderiu, educandos}
 *     em todos os ciclos coletados (entradas faltantes viram aderiu=false).
 *   - Os campos top-level da escola (nome, esfera, aderiu, educandos, flags)
 *     refletem o **ciclo vigente** quando a escola está nele; do contrário
 *     usam o ciclo mais recente em que a escola apareceu (apenas para
 *     identificação) com aderiu=false.
 *   - Os agregados do município (escolasPactuadas, educandosPactuados,
 *     escolasPrioritarias, etc.) continuam refletindo apenas o ciclo vigente
 *     para manter compatibilidade com o frontend atual.
 *
 * Saída: pse-municipios.json (cache local commitado)
 *
 * Uso:
 *   node scripts/sync-pse-municipios.mjs
 *   PSE_CICLOS_LIMIT=2 node scripts/sync-pse-municipios.mjs   # apenas N ciclos mais recentes (debug)
 *
 * Re-rodar quando o MS publicar nova adesão (mensal ou quando ciclo mudar).
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const OUTPUT_FILE = process.env.PSE_OUTPUT_JSON || resolve(ROOT, "pse-municipios.json");

const API_BASE = process.env.PSE_API_BASE_URL || "https://relatorioaps-prd.saude.gov.br";
const UA = "Mozilla/5.0 (chegou-a-conta-diretora sync-pse)";

const _rawLimit = Number(process.env.PSE_CICLOS_LIMIT);
const CICLOS_LIMIT = Number.isFinite(_rawLimit) && _rawLimit >= 1 ? Math.floor(_rawLimit) : 0;

async function fetchJson(url, attempt = 1, timeoutMs = 300_000) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt >= 3) throw err;
    const wait = attempt * 5000;
    console.warn(`  retry ${attempt}/3 em ${wait / 1000}s (${err.message})`);
    await new Promise((r) => setTimeout(r, wait));
    return fetchJson(url, attempt + 1, timeoutMs);
  }
}

async function getCiclos() {
  const ciclos = await fetchJson(`${API_BASE}/adesao/pse/ciclos`);
  if (!Array.isArray(ciclos) || !ciclos.length) {
    throw new Error("API /adesao/pse/ciclos retornou vazio");
  }
  ciclos.sort((a, b) => Number(b.coPseCiclo) - Number(a.coPseCiclo));
  return ciclos;
}

function ibge6(coIbge) {
  const s = String(coIbge ?? "").replace(/\D/g, "");
  return s.length >= 6 ? s.slice(0, 6) : null;
}

function emptyMunicipio(nome, uf) {
  return {
    nome: nome ?? null,
    uf: uf ?? null,
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
  };
}

(async () => {
  console.log("PSE: descobrindo ciclos publicados...");
  const ciclosTodos = await getCiclos();
  const ciclosUsados = CICLOS_LIMIT > 0 ? ciclosTodos.slice(0, CICLOS_LIMIT) : ciclosTodos;
  const cicloVigente = ciclosUsados[0];
  console.log(
    `  ciclos a coletar (mais recente \u2192 mais antigo): ${ciclosUsados
      .map((c) => `${c.nuCiclo}#${c.coPseCiclo}`)
      .join(", ")}`,
  );
  console.log(`  ciclo vigente: ${cicloVigente.nuCiclo} (coPseCiclo=${cicloVigente.coPseCiclo})`);

  // escolasMap: sid (string) -> { historyMap: Map<coPseCiclo, perCycleRecord> }
  const escolasMap = new Map();
  let totalRows = 0;
  let dataApi = null;

  for (const c of ciclosUsados) {
    const url = `${API_BASE}/adesao/pse/historico?coCiclo=${c.coPseCiclo}`;
    process.stdout.write(`Ciclo ${c.nuCiclo} (coPseCiclo=${c.coPseCiclo})... `);
    const t0 = Date.now();
    const data = await fetchJson(url);
    const rows = Array.isArray(data?.adesoes) ? data.adesoes : [];
    if (data?.data && c.coPseCiclo === cicloVigente.coPseCiclo) dataApi = data.data;
    totalRows += rows.length;

    for (const r of rows) {
      const sid = String(r.coSeqPseEstabelecimento ?? "");
      if (!sid) continue;
      let s = escolasMap.get(sid);
      if (!s) {
        s = { historyMap: new Map() };
        escolasMap.set(sid, s);
      }
      // dedup: se já houver registro para este ciclo (API às vezes duplica), ignora
      if (s.historyMap.has(c.coPseCiclo)) continue;
      s.historyMap.set(c.coPseCiclo, {
        coCiclo: c.coPseCiclo,
        ciclo: c.nuCiclo,
        aderiu: r.stAdesao === "S",
        educandos: Number(r.qtdEducandos ?? 0) || 0,
        prioritaria: r.stPrioritario === "S",
        maioriaPbf: r.stMaioriaPbf === "S",
        nutrisus: r.stAdesaoNutrisus === "S",
        obesidade: r.stObesidade === "S",
        sinase: r.stSinase === "S",
        esfera: String(r.dsEsferaAdministrativa ?? "").toUpperCase() || null,
        localizacao: r.dsPseLocalizacao || null,
        co6: ibge6(r.coMunicipioIbge),
        muniNome: r.noMunicipioAcentuado ?? null,
        uf: r.sgUf ?? null,
        nome: r.noEstabelecimento ?? null,
      });
    }
    console.log(`${rows.length} linhas (${Date.now() - t0}ms)`);
    // ser educado com a API
    await new Promise((r) => setTimeout(r, 800));
  }

  // Monta municípios a partir das escolas, escolhendo a aparição mais recente
  // de cada escola para definir município e metadados de identificação.
  const acc = new Map();
  for (const [sid, s] of escolasMap) {
    let latestRec = null;
    for (const c of ciclosUsados) {
      const h = s.historyMap.get(c.coPseCiclo);
      if (h) { latestRec = h; break; }
    }
    if (!latestRec || !latestRec.co6) continue;

    const cur = s.historyMap.get(cicloVigente.coPseCiclo) || null;
    const co6 = latestRec.co6;
    let m = acc.get(co6);
    if (!m) {
      m = emptyMunicipio(latestRec.muniNome, latestRec.uf);
      acc.set(co6, m);
    }

    // Histórico por ciclo (mais recente -> mais antigo). Ciclos sem registro
    // viram aderiu=false / educandos=0 para sinalizar ausência explícita.
    const historico = ciclosUsados.map((c) => {
      const h = s.historyMap.get(c.coPseCiclo);
      return {
        ciclo: c.nuCiclo,
        codigo_ciclo: c.coPseCiclo,
        aderiu: !!(h && h.aderiu),
        educandos: h ? h.educandos : 0,
      };
    });

    const escola = {
      id: Number(sid) || null,
      // chave estável do estabelecimento na API do MS (mesmo valor de `id`,
      // exposto também sob o nome canônico para consumidores externos).
      coSeqPseEstabelecimento: Number(sid) || null,
      nome: latestRec.nome,
      esfera: latestRec.esfera,
      aderiu: !!(cur && cur.aderiu),
      educandos: cur ? cur.educandos : 0,
      prioritaria: !!(cur && cur.prioritaria),
      maioriaPbf: !!(cur && cur.maioriaPbf),
      nutrisus: !!(cur && cur.nutrisus),
      obesidade: !!(cur && cur.obesidade),
      historico,
    };
    m.escolas.push(escola);

    // Agregados do município refletem APENAS o ciclo vigente
    if (cur && cur.aderiu) {
      m.escolasPactuadas += 1;
      m.educandosPactuados += cur.educandos;
      if (cur.prioritaria) m.escolasPrioritarias += 1;
      if (cur.maioriaPbf) m.escolasMaioriaPbf += 1;
      if (cur.nutrisus) m.escolasNutrisus += 1;
      if (cur.obesidade) m.escolasObesidade += 1;
      if (cur.sinase) m.escolasSinase += 1;
      if (cur.localizacao === "URBANA") m.escolasUrbanas += 1;
      else if (cur.localizacao === "RURAL") m.escolasRurais += 1;
      if (cur.esfera === "MUNICIPAL") m.escolasMunicipais += 1;
      else if (cur.esfera === "ESTADUAL") m.escolasEstaduais += 1;
      else if (cur.esfera === "FEDERAL") m.escolasFederais += 1;
      else if (cur.esfera === "PRIVADA") m.escolasPrivadas += 1;
    }
  }

  const municipios = {};
  let muniComAdesao = 0;
  let totalEscolas = 0;
  let totalEducandos = 0;
  for (const [co, m] of acc) {
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
      ciclo: cicloVigente.nuCiclo,
      coPseCiclo: cicloVigente.coPseCiclo,
      nuAnoCenso: cicloVigente.nuAnoCenso,
      nuAnoExercicio: cicloVigente.nuAnoExercicio,
      dataApi: dataApi,
      sincronizadoEm: new Date().toISOString(),
      ciclos: ciclosUsados.map((c) => ({
        codigo: c.coPseCiclo,
        nome: c.nuCiclo,
        ano_censo: c.nuAnoCenso,
        ano_exercicio: c.nuAnoExercicio,
      })),
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
  console.log(
    `  ciclo vigente ${cicloVigente.nuCiclo} — ${muniComAdesao} municípios com adesão, ${totalEscolas} escolas, ${totalEducandos} educandos`,
  );
  console.log(`  ciclos coletados: ${ciclosUsados.length} (linhas processadas: ${totalRows})`);

  // Enriquecimento INEP: adiciona escola.inep (= co_entidade do Censo) a cada
  // escola pactuada via casamento (município + nome normalizado + esfera) na
  // tabela censo_escolas. Roda automaticamente se DB estiver disponível;
  // caso contrário, o script enrich-pse-with-inep.mjs pode ser invocado depois.
  if (process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL) {
    console.log("");
    console.log("Enriquecendo escolas com INEP (censo_escolas)...");
    try {
      const { spawnSync } = await import("node:child_process");
      const r = spawnSync(
        process.execPath,
        [resolve(ROOT, "scripts/enrich-pse-with-inep.mjs")],
        { stdio: "inherit", env: { ...process.env, PSE_INPUT: OUTPUT_FILE, PSE_OUTPUT: OUTPUT_FILE } },
      );
      if (r.status !== 0) console.warn(`[enrich-pse] saiu com código ${r.status} (não-fatal)`);
    } catch (e) {
      console.warn("[enrich-pse] falhou (não-fatal):", e?.message || e);
    }
  } else {
    console.log("");
    console.log("[sync-pse] RAILWAY_DATABASE_URL ausente — pulando enriquecimento INEP.");
  }
})().catch((err) => {
  console.error("ERRO:", err);
  process.exit(1);
});
