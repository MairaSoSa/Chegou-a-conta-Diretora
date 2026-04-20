#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const API_BASE = process.env.PSE_API_BASE_URL || "https://relatorioaps-prd.saude.gov.br";
const OUTPUT_PATH = resolve(ROOT, process.env.PSE_ADESAO_OUTPUT_JSON || "pse-adesao.json");

async function fetchJson(url, timeoutMs = 120000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.json();
}

function normCode6(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 7) return digits.slice(0, 6);
  if (digits.length === 6) return digits;
  return digits.padStart(6, "0").slice(0, 6);
}

async function main() {
  console.log(`[sync-pse-adesao] Buscando ciclos em ${API_BASE}/adesao/pse/ciclos`);
  const ciclos = await fetchJson(`${API_BASE}/adesao/pse/ciclos`);
  if (!Array.isArray(ciclos) || ciclos.length === 0) {
    throw new Error("Lista de ciclos vazia.");
  }
  ciclos.sort((a, b) => Number(b.coPseCiclo || 0) - Number(a.coPseCiclo || 0));
  const cicloVigente = ciclos[0];
  const coCiclo = cicloVigente.coPseCiclo;
  const nuCiclo = cicloVigente.nuCiclo;
  console.log(`[sync-pse-adesao] Ciclo vigente: ${nuCiclo} (codigo ${coCiclo})`);

  console.log(`[sync-pse-adesao] Baixando histórico de adesões (pode levar alguns minutos)...`);
  const historico = await fetchJson(
    `${API_BASE}/adesao/pse/historico?coCiclo=${coCiclo}`,
    300000,
  );
  const adesoes = Array.isArray(historico?.adesoes) ? historico.adesoes : [];
  console.log(`[sync-pse-adesao] Registros de estabelecimentos: ${adesoes.length}`);

  const porMunicipio = new Map();
  for (const item of adesoes) {
    const co6 = normCode6(item.coMunicipioIbge);
    if (!co6 || co6.length !== 6) continue;
    let entry = porMunicipio.get(co6);
    if (!entry) {
      entry = {
        codigo_municipio: co6,
        municipio: item.noMunicipioAcentuado || null,
        uf: item.sgUf || null,
        aderiu: false,
        ciclo: nuCiclo,
        codigo_ciclo: coCiclo,
        escolas_pactuadas: 0,
        educandos_pactuados: 0,
      };
      porMunicipio.set(co6, entry);
    }
    if (String(item.stAdesao || "").toUpperCase() === "S") {
      entry.aderiu = true;
      entry.escolas_pactuadas += 1;
      const ed = Number(item.qtdEducandos);
      if (Number.isFinite(ed)) entry.educandos_pactuados += ed;
    }
  }

  const municipios = {};
  for (const [co6, entry] of porMunicipio) {
    municipios[co6] = entry;
  }

  const totais = {
    municipios_com_adesao: Object.values(municipios).filter((m) => m.aderiu).length,
    escolas_pactuadas: Object.values(municipios).reduce((s, m) => s + m.escolas_pactuadas, 0),
    educandos_pactuados: Object.values(municipios).reduce((s, m) => s + m.educandos_pactuados, 0),
  };

  const payload = {
    gerado_em: new Date().toISOString(),
    fonte: "Relatórios Públicos da APS — Adesão ao PSE (relatorioaps.saude.gov.br)",
    endpoint: `${API_BASE}/adesao/pse/historico?coCiclo=${coCiclo}`,
    ciclo_vigente: { codigo: coCiclo, nome: nuCiclo, ano_censo: cicloVigente.nuAnoCenso, ano_exercicio: cicloVigente.nuAnoExercicio },
    totais,
    municipios,
  };

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload)}\n`, "utf8");
  console.log(`[sync-pse-adesao] Municípios com adesão: ${totais.municipios_com_adesao}`);
  console.log(`[sync-pse-adesao] Escolas pactuadas: ${totais.escolas_pactuadas}`);
  console.log(`[sync-pse-adesao] Educandos pactuados: ${totais.educandos_pactuados}`);
  console.log(`[sync-pse-adesao] Arquivo gerado: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(`[sync-pse-adesao] Erro: ${err.message}`);
  process.exit(1);
});
