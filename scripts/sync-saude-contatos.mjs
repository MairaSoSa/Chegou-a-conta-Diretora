#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const CENTROIDES_PATH = resolve(ROOT, "municipio-centroides.json");

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

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizePhone(value) {
  if (!value) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeEmail(value) {
  if (!value) return null;
  const text = String(value).trim().toLowerCase();
  return text.length > 0 ? text : null;
}

function parseCsvCodes(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((n) => Number.isInteger(n));
}

function uniqBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function withQuery(url, query) {
  const u = new URL(url);
  Object.entries(query).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") return;
    u.searchParams.set(k, String(v));
  });
  return u.toString();
}

function normalizeMunicipioCodeForCnes(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 7) return digits.slice(0, 6);
  return digits;
}

function parseReferencePoint() {
  const lat = toNumber(process.env.SAUDE_ESCOLA_LATITUDE);
  const lon = toNumber(process.env.SAUDE_ESCOLA_LONGITUDE);

  if (lat !== null && lon !== null) {
    return {
      latitude: lat,
      longitude: lon,
      source: "escola",
    };
  }

  const codigoMunicipio = (process.env.SAUDE_API_CODIGO_MUNICIPIO || "").trim();
  if (!codigoMunicipio) {
    return null;
  }

  const centroidesRaw = readFileSync(CENTROIDES_PATH, "utf8");
  const centroides = JSON.parse(centroidesRaw);
  const coords = centroides[codigoMunicipio];
  if (!Array.isArray(coords) || coords.length < 2) {
    return null;
  }

  return {
    latitude: Number(coords[0]),
    longitude: Number(coords[1]),
    source: "centroide_municipio",
  };
}

async function fetchPage(baseUrl, path, query) {
  const url = withQuery(`${baseUrl.replace(/\/$/, "")}${path}`, query);
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) {
    throw new Error(`Falha na API de saude (HTTP ${res.status}) em ${url}`);
  }
  return res.json();
}

function parseEstabelecimentos(payload) {
  if (Array.isArray(payload?.estabelecimentos)) return payload.estabelecimentos;
  if (Array.isArray(payload)) return payload;
  return [];
}

function buildTipoConfig() {
  const ubsCodes = parseCsvCodes(process.env.SAUDE_API_CODIGOS_TIPO_UBS || process.env.SAUDE_API_CODIGO_TIPO_UBS || "1,2");
  const upaCodes = parseCsvCodes(process.env.SAUDE_API_CODIGOS_TIPO_UPA || process.env.SAUDE_API_CODIGO_TIPO_UPA || "73");
  const psCodes = parseCsvCodes(process.env.SAUDE_API_CODIGOS_TIPO_PRONTO_SOCORRO || process.env.SAUDE_API_CODIGO_TIPO_PRONTO_SOCORRO || "20,21");

  return [
    { tipo: "UBS", codes: ubsCodes },
    { tipo: "UPA", codes: upaCodes },
    { tipo: "PRONTO_SOCORRO", codes: psCodes },
  ];
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function resolveTipoByName(defaultTipo, item) {
  if (defaultTipo !== "UPA") return defaultTipo;

  const nome = normalizeText(item.nome_fantasia || item.nome_razao_social || "");
  const isUpaByName = /\bUPA\b/.test(nome) || nome.includes("UNIDADE DE PRONTO ATENDIMENTO");
  const isProntoSocorroByName = /\bPRONTO\s*SOCORRO\b/.test(nome) || /\bPS\b/.test(nome);

  // codigo 73 inclui pronto atendimento em geral; separar UPA, pronto atendimento e pronto socorro por nome.
  if (isUpaByName) return "UPA";
  if (isProntoSocorroByName) return "PRONTO_SOCORRO";
  return "PRONTO_ATENDIMENTO";
}

function mapEstabelecimento(item, tipo, referencePoint) {
  const resolvedTipo = resolveTipoByName(tipo, item);
  const latitude = toNumber(item.latitude_estabelecimento_decimo_grau);
  const longitude = toNumber(item.longitude_estabelecimento_decimo_grau);
  const hasCoords = latitude !== null && longitude !== null;

  const telefone = normalizePhone(item.numero_telefone_estabelecimento);
  const email = normalizeEmail(item.endereco_email_estabelecimento);

  let distanciaKm = null;
  if (referencePoint && hasCoords) {
    distanciaKm = haversineKm(referencePoint.latitude, referencePoint.longitude, latitude, longitude);
  }

  return {
    tipo: resolvedTipo,
    codigo_cnes: item.codigo_cnes,
    nome: item.nome_fantasia || item.nome_razao_social || null,
    codigo_tipo_unidade: item.codigo_tipo_unidade,
    codigo_municipio: item.codigo_municipio,
    codigo_uf: item.codigo_uf,
    endereco: item.endereco_estabelecimento || null,
    numero: item.numero_estabelecimento || null,
    bairro: item.bairro_estabelecimento || null,
    cep: item.codigo_cep_estabelecimento || null,
    telefone,
    email,
    latitude,
    longitude,
    possui_contato: Boolean(telefone || email),
    distancia_km: distanciaKm !== null ? Number(distanciaKm.toFixed(3)) : null,
    status: item.status ?? null,
    data_atualizacao: item.data_atualizacao || null,
  };
}

function sortByPriority(items) {
  return [...items].sort((a, b) => {
    const aHasDist = a.distancia_km !== null;
    const bHasDist = b.distancia_km !== null;
    if (aHasDist && bHasDist) {
      if (a.distancia_km !== b.distancia_km) return a.distancia_km - b.distancia_km;
    } else if (aHasDist !== bHasDist) {
      return aHasDist ? -1 : 1;
    }

    if (a.possui_contato !== b.possui_contato) {
      return a.possui_contato ? -1 : 1;
    }

    const aName = (a.nome || "").toLowerCase();
    const bName = (b.nome || "").toLowerCase();
    return aName.localeCompare(bName, "pt-BR");
  });
}

async function fetchAllByCodes(config) {
  const baseUrl = process.env.SAUDE_API_BASE_URL || "https://apidadosabertos.saude.gov.br";
  const path = process.env.SAUDE_API_CNES_ESTABELECIMENTOS_PATH || "/cnes/estabelecimentos";

  const status = process.env.SAUDE_API_STATUS || "1";
  const codigoUf = process.env.SAUDE_API_CODIGO_UF || "";
  const codigoMunicipioRaw = process.env.SAUDE_API_CODIGO_MUNICIPIO || "";
  const codigoMunicipio = normalizeMunicipioCodeForCnes(codigoMunicipioRaw);
  const dataAtualizacao = process.env.SAUDE_API_DATA_ATUALIZACAO_MIN || "";
  const possuiCentroCirurgico = process.env.SAUDE_API_ESTABELECIMENTO_POSSUI_CENTRO_CIRURGICO || "";
  const possuiCentroObstetrico = process.env.SAUDE_API_ESTABELECIMENTO_POSSUI_CENTRO_OBSTETRICO || "";

  const limit = Math.min(Math.max(Number(process.env.SAUDE_API_LIMIT || 20), 1), 20);
  const maxPaginas = Math.max(Number(process.env.SAUDE_API_MAX_PAGINAS || 5), 1);

  const collected = [];

  for (const { tipo, codes } of config) {
    for (const code of codes) {
      for (let page = 0; page < maxPaginas; page += 1) {
        let payload;
        try {
          payload = await fetchPage(baseUrl, path, {
            codigo_tipo_unidade: code,
            status,
            codigo_uf: codigoUf,
            codigo_municipio: codigoMunicipio,
            data_atualizacao: dataAtualizacao,
            estabelecimento_possui_centro_cirurgico: possuiCentroCirurgico,
            estabelecimento_possui_centro_obstetrico: possuiCentroObstetrico,
            limit,
            offset: page,
          });
        } catch (error) {
          console.warn(`[sync-saude-contatos] Aviso: falha na pagina ${page} do tipo ${tipo} (codigo ${code}): ${error.message}`);
          break;
        }

        const rows = parseEstabelecimentos(payload);
        if (rows.length === 0) break;

        rows.forEach((row) => {
          collected.push({ ...row, _tipo_categoria: tipo });
        });

        if (rows.length < limit) break;
      }
    }
  }

  return collected;
}

async function main() {
  loadEnvFile();

  const tipoConfig = buildTipoConfig();
  const activeTipoConfig = tipoConfig.filter((item) => item.codes.length > 0);

  if (activeTipoConfig.length === 0) {
    throw new Error("Sem codigos de tipo configurados para UBS/UPA/PRONTO_SOCORRO.");
  }

  const referencePoint = parseReferencePoint();
  const allRaw = await fetchAllByCodes(activeTipoConfig);

  const deduped = uniqBy(allRaw, (item) => String(item.codigo_cnes));
  const mapped = deduped.map((item) => mapEstabelecimento(item, item._tipo_categoria, referencePoint));

  const prioritizedAll = sortByPriority(mapped);

  const topN = Math.max(Number(process.env.SAUDE_PRIORIZACAO_TOP_N || 15), 1);

  const tipoOrder = ["UBS", "UPA", "PRONTO_ATENDIMENTO", "PRONTO_SOCORRO"];
  const foundTipos = [...new Set(prioritizedAll.map((item) => item.tipo).filter(Boolean))];
  const orderedTipos = [
    ...tipoOrder.filter((tipo) => foundTipos.includes(tipo)),
    ...foundTipos.filter((tipo) => !tipoOrder.includes(tipo)),
  ];

  const byTipo = orderedTipos.reduce((acc, tipo) => {
    const group = prioritizedAll.filter((item) => item.tipo === tipo);
    acc[tipo] = {
      total: group.length,
      priorizados: group.slice(0, topN),
      itens: group,
    };
    return acc;
  }, {});

  const prontoSocorroMaisProximo =
    byTipo.PRONTO_SOCORRO?.itens?.find((item) => item.distancia_km !== null) ||
    byTipo.PRONTO_SOCORRO?.itens?.[0] ||
    null;

  const outputPath = resolve(ROOT, process.env.SAUDE_CONTATOS_OUTPUT_JSON || "saude-contatos-priorizados.json");

  const payload = {
    generated_at: new Date().toISOString(),
    filtros: {
      codigo_uf: process.env.SAUDE_API_CODIGO_UF || null,
      codigo_municipio: process.env.SAUDE_API_CODIGO_MUNICIPIO || null,
      status: process.env.SAUDE_API_STATUS || null,
      data_atualizacao_min: process.env.SAUDE_API_DATA_ATUALIZACAO_MIN || null,
    },
    referencia_proximidade: referencePoint,
    resumo: {
      total_unidades: prioritizedAll.length,
      total_com_contato: prioritizedAll.filter((item) => item.possui_contato).length,
      top_n: topN,
    },
    pronto_socorro_mais_proximo: prontoSocorroMaisProximo,
    priorizados_geral: prioritizedAll.slice(0, topN),
    por_tipo: byTipo,
  };

  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`[sync-saude-contatos] Unidades unicas: ${prioritizedAll.length}`);
  console.log(`[sync-saude-contatos] Unidades com contato: ${payload.resumo.total_com_contato}`);
  console.log(`[sync-saude-contatos] Referencia de proximidade: ${referencePoint ? referencePoint.source : "nao configurada"}`);
  console.log(`[sync-saude-contatos] Arquivo gerado: ${outputPath}`);
}

main().catch((error) => {
  console.error(`[sync-saude-contatos] Erro: ${error.message}`);
  process.exit(1);
});
