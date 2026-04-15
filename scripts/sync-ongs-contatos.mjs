#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

function loadEnvFile() {
  const envCandidates = [resolve(ROOT, ".env"), resolve(ROOT, ".env.example")];
  for (const envPath of envCandidates) {
    let raw;
    try {
      raw = readFileSync(envPath, "utf8");
    } catch {
      continue;
    }
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx <= 0) return;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (typeof process.env[key] === "undefined") {
        process.env[key] = val;
      }
    });
    return;
  }
}

function normalizePhone(value) {
  if (!value) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeEmail(value) {
  if (!value) return null;
  const text = String(value).trim().toLowerCase();
  return text.includes("@") ? text : null;
}

function normalizeMunicipioCode(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 7) return digits.slice(0, 6);
  return digits;
}

function normalizeArea(rawArea) {
  if (!rawArea) return null;
  const a = String(rawArea).trim();
  const lower = a.toLowerCase();
  if (lower.includes("assist")) return "Assistência Social";
  if (lower.includes("saúde") || lower.includes("saude")) return "Saúde";
  if (lower.includes("educa")) return "Educação";
  return a || null;
}

async function getCneasResourceId() {
  const url =
    "https://dados.gov.br/api/3/action/package_show?id=cneas--cadastro-nacional-de-entidades-de-assistencia-social";
  console.log("[sync-ongs] Buscando resource_id do CNEAS em dados.gov.br...");
  const res = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: { Accept: "application/json", "User-Agent": "ChegoAContaDiretora/1.0" },
  });
  if (!res.ok) throw new Error(`CNEAS package_show falhou: HTTP ${res.status}`);
  const data = await res.json();
  const resources = data?.result?.resources || [];
  const active = resources.find((r) => r.datastore_active === true);
  if (active) return active.id;
  if (resources.length > 0) return resources[0].id;
  throw new Error("Nenhum recurso encontrado no pacote CNEAS");
}

async function getCebasResourceId() {
  const url =
    "https://dados.gov.br/api/3/action/package_show?id=cebas--certificacao-de-entidades-beneficentes-de-assistencia-social";
  console.log("[sync-ongs] Buscando resource_id do CEBAS em dados.gov.br...");
  const res = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: { Accept: "application/json", "User-Agent": "ChegoAContaDiretora/1.0" },
  });
  if (!res.ok) {
    console.warn(`[sync-ongs] CEBAS package_show falhou: HTTP ${res.status} (não fatal)`);
    return null;
  }
  const data = await res.json();
  const resources = data?.result?.resources || [];
  const active = resources.find((r) => r.datastore_active === true);
  if (active) return active.id;
  if (resources.length > 0) return resources[0].id;
  return null;
}

async function fetchCneasPage(resourceId, coMunicipio, offset, limit) {
  const filters = JSON.stringify({ CO_MUNICIPIO: coMunicipio });
  const url =
    `https://dados.gov.br/api/3/action/datastore_search` +
    `?resource_id=${encodeURIComponent(resourceId)}` +
    `&filters=${encodeURIComponent(filters)}` +
    `&limit=${limit}&offset=${offset}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(60000),
    headers: { Accept: "application/json", "User-Agent": "ChegoAContaDiretora/1.0" },
  });
  if (!res.ok) throw new Error(`CNEAS datastore_search HTTP ${res.status}`);
  const data = await res.json();
  return data?.result?.records || [];
}

async function fetchCebasCnpjs(cebasResourceId) {
  try {
    const url =
      `https://dados.gov.br/api/3/action/datastore_search` +
      `?resource_id=${encodeURIComponent(cebasResourceId)}&limit=32000`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(60000),
      headers: { Accept: "application/json", "User-Agent": "ChegoAContaDiretora/1.0" },
    });
    if (!res.ok) {
      console.warn(`[sync-ongs] CEBAS datastore_search HTTP ${res.status} (não fatal)`);
      return new Set();
    }
    const data = await res.json();
    const records = data?.result?.records || [];
    const cnpjs = new Set();
    for (const r of records) {
      const cnpj = String(r.NU_CNPJ || r.CD_CNPJ || r.cnpj || "").replace(/\D/g, "");
      if (cnpj.length >= 14) cnpjs.add(cnpj);
    }
    console.log(`[sync-ongs] CEBAS: ${cnpjs.size} CNPJs certificados carregados`);
    return cnpjs;
  } catch (err) {
    console.warn(`[sync-ongs] Erro ao buscar CEBAS (não fatal): ${err.message}`);
    return new Set();
  }
}

function mapRecord(record, cebasCnpjs) {
  const nome =
    record.NO_ENTIDADE ||
    record.NM_ENTIDADE ||
    record.DS_RAZAO_SOCIAL ||
    record.nome ||
    null;

  const area = normalizeArea(
    record.DS_AREA_ATUACAO ||
    record.NO_AREA_ATUACAO ||
    record.NM_AREA_ATUACAO ||
    record.area_atuacao ||
    null
  );

  const telefone = normalizePhone(
    record.NU_TELEFONE ||
    record.DS_TELEFONE ||
    record.NO_TELEFONE ||
    record.telefone ||
    null
  );

  const email = normalizeEmail(
    record.DS_EMAIL ||
    record.NO_EMAIL ||
    record.email ||
    null
  );

  const cnpjRaw = String(
    record.NU_CNPJ || record.CD_CNPJ || record.cnpj || ""
  ).replace(/\D/g, "");
  const cnpj = cnpjRaw.length >= 14 ? cnpjRaw : null;

  const tem_cebas = cnpj ? cebasCnpjs.has(cnpj) : false;
  const possui_contato = Boolean(telefone || email);

  return {
    nome,
    area,
    telefone,
    email,
    cnpj,
    tem_cebas,
    possui_contato,
  };
}

function sortEntidades(items) {
  return [...items].sort((a, b) => {
    if (a.tem_cebas !== b.tem_cebas) return a.tem_cebas ? -1 : 1;
    if (a.possui_contato !== b.possui_contato) return a.possui_contato ? -1 : 1;
    const aN = (a.nome || "").toLowerCase();
    const bN = (b.nome || "").toLowerCase();
    return aN.localeCompare(bN, "pt-BR");
  });
}

async function main() {
  loadEnvFile();

  const codigoMunicipioRaw =
    process.env.ONG_CODIGO_MUNICIPIO ||
    process.env.SAUDE_API_CODIGO_MUNICIPIO ||
    "";
  if (!codigoMunicipioRaw) {
    throw new Error(
      "Variável ONG_CODIGO_MUNICIPIO não configurada. " +
        "Defina no .env (ex: ONG_CODIGO_MUNICIPIO=3550308)"
    );
  }

  const codigoMunicipio = normalizeMunicipioCode(codigoMunicipioRaw);
  if (!codigoMunicipio || codigoMunicipio.length < 6) {
    throw new Error(
      `Código de município inválido: "${codigoMunicipioRaw}". Esperado 6 ou 7 dígitos numéricos.`
    );
  }

  const topN = Math.max(Number(process.env.ONG_TOP_N || 15), 1);
  const outputPath = resolve(
    ROOT,
    process.env.ONG_CONTATOS_OUTPUT_JSON || "ongs-contatos.json"
  );

  console.log(`[sync-ongs] Município: ${codigoMunicipio}`);
  console.log(`[sync-ongs] Top N: ${topN}`);

  const cneasResourceId = await getCneasResourceId();
  console.log(`[sync-ongs] CNEAS resource_id: ${cneasResourceId}`);

  let cebasCnpjs = new Set();
  const cebasResourceId = await getCebasResourceId().catch(() => null);
  if (cebasResourceId) {
    cebasCnpjs = await fetchCebasCnpjs(cebasResourceId);
  } else {
    console.warn("[sync-ongs] CEBAS resource_id não encontrado, pulando cruzamento");
  }

  const limit = 100;
  let offset = 0;
  const allRecords = [];

  console.log(`[sync-ongs] Buscando entidades para município ${codigoMunicipio}...`);
  for (let page = 0; page < 10; page++) {
    let records;
    try {
      records = await fetchCneasPage(cneasResourceId, codigoMunicipio, offset, limit);
    } catch (err) {
      console.warn(`[sync-ongs] Página ${page} falhou: ${err.message}`);
      break;
    }
    if (!records.length) break;
    allRecords.push(...records);
    console.log(`[sync-ongs] Página ${page}: ${records.length} registros`);
    if (records.length < limit) break;
    offset += limit;
  }

  console.log(`[sync-ongs] Total de registros brutos: ${allRecords.length}`);

  const mapped = allRecords
    .map((r) => mapRecord(r, cebasCnpjs))
    .filter((e) => e.nome);

  const seen = new Set();
  const deduped = mapped.filter((e) => {
    const key = (e.nome || "").toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const sorted = sortEntidades(deduped);
  const entidades = sorted.slice(0, topN);

  const payload = {
    generated_at: new Date().toISOString(),
    filtros: {
      codigo_municipio: codigoMunicipioRaw,
      top_n: topN,
    },
    resumo: {
      total_entidades: deduped.length,
      total_com_contato: deduped.filter((e) => e.possui_contato).length,
      total_com_cebas: deduped.filter((e) => e.tem_cebas).length,
    },
    entidades,
  };

  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`[sync-ongs] Entidades únicas: ${deduped.length}`);
  console.log(`[sync-ongs] Com contato: ${payload.resumo.total_com_contato}`);
  console.log(`[sync-ongs] Com CEBAS: ${payload.resumo.total_com_cebas}`);
  console.log(`[sync-ongs] Arquivo gerado: ${outputPath}`);
}

main().catch((err) => {
  console.error(`[sync-ongs] Erro: ${err.message}`);
  process.exit(1);
});
