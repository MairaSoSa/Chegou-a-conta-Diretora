#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_BASE_URL = "https://apidadosabertos.saude.gov.br";
const DEFAULT_TIPOS_PATH = "/cnes/tipounidades";
const DEFAULT_OUTPUT_FILE = existsSync(resolve(process.cwd(), ".env"))
  ? resolve(process.cwd(), ".env")
  : resolve(process.cwd(), ".env.example");

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function includesAny(text, tokens) {
  return tokens.some((token) => text.includes(token));
}

function uniqueCodes(items) {
  const codes = items
    .map((item) => Number(item.codigo_tipo_unidade))
    .filter((code) => Number.isInteger(code));
  return [...new Set(codes)];
}

function parseArgs(argv) {
  const args = {
    writeEnv: false,
    file: DEFAULT_OUTPUT_FILE,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--write-env") {
      args.writeEnv = true;
      continue;
    }

    if (token === "--file") {
      args.file = resolve(process.cwd(), argv[i + 1] || "");
      i += 1;
      continue;
    }
  }

  return args;
}

function parseTiposUnidade(payload) {
  if (payload && Array.isArray(payload.tipos_unidade)) return payload.tipos_unidade;
  if (Array.isArray(payload)) return payload;
  return [];
}

function pickPrimary(candidates, preferredCodes = []) {
  const codes = uniqueCodes(candidates);
  for (const preferred of preferredCodes) {
    if (codes.includes(preferred)) return preferred;
  }
  return codes[0] || "";
}

function replaceEnvVar(content, key, value) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${escapedKey}=.*$`, "m");

  if (regex.test(content)) {
    return content.replace(regex, line);
  }

  return `${content.trimEnd()}\n${line}\n`;
}

function formatMatches(label, matches) {
  if (matches.length === 0) {
    return `- ${label}: nenhum tipo encontrado`;
  }

  const summary = matches
    .map((item) => `${item.codigo_tipo_unidade} (${item.descricao_tipo_unidade})`)
    .join("; ");

  return `- ${label}: ${summary}`;
}

async function fetchTipos(baseUrl, tiposPath) {
  const url = `${baseUrl.replace(/\/$/, "")}${tiposPath}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao consultar ${url} (HTTP ${res.status})`);
  }
  return res.json();
}

function classifyTipos(tipos) {
  const normalized = tipos.map((item) => ({
    ...item,
    _descricaoNormalizada: normalizeText(item.descricao_tipo_unidade),
  }));

  const ubs = normalized.filter((item) =>
    includesAny(item._descricaoNormalizada, [
      "UNIDADE BASICA",
      "POSTO DE SAUDE",
    ])
  );

  const upa = normalized.filter((item) =>
    includesAny(item._descricaoNormalizada, [
      "UPA",
      "UNIDADE DE PRONTO ATENDIMENTO",
    ])
  );

  const prontoSocorro = normalized.filter((item) =>
    includesAny(item._descricaoNormalizada, ["PRONTO SOCORRO", "PRONTO ATENDIMENTO"])
  );

  return { ubs, upa, prontoSocorro };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = process.env.SAUDE_API_BASE_URL || DEFAULT_BASE_URL;
  const tiposPath = process.env.SAUDE_API_CNES_TIPOUNIDADES_PATH || DEFAULT_TIPOS_PATH;

  const payload = await fetchTipos(baseUrl, tiposPath);
  const tipos = parseTiposUnidade(payload);

  if (tipos.length === 0) {
    throw new Error("Resposta sem tipos_unidade para classificar.");
  }

  const { ubs, upa, prontoSocorro } = classifyTipos(tipos);

  const codigoUbs = pickPrimary(ubs, [2, 1]);
  const codigoUpa = pickPrimary(upa, [73]);
  const codigoProntoSocorro = pickPrimary(prontoSocorro, [20, 21]);

  const codigosUbs = uniqueCodes(ubs).join(",");
  const codigosUpa = uniqueCodes(upa).join(",");
  const codigosProntoSocorro = uniqueCodes(prontoSocorro).join(",");

  console.log("[sync-saude] Tipos encontrados:");
  console.log(formatMatches("UBS", ubs));
  console.log(formatMatches("UPA", upa));
  console.log(formatMatches("Pronto Socorro", prontoSocorro));
  console.log("[sync-saude] Sugestoes de codigo principal:");
  console.log(`- SAUDE_API_CODIGO_TIPO_UBS=${codigoUbs}`);
  console.log(`- SAUDE_API_CODIGO_TIPO_UPA=${codigoUpa}`);
  console.log(`- SAUDE_API_CODIGO_TIPO_PRONTO_SOCORRO=${codigoProntoSocorro}`);

  if (!args.writeEnv) {
    console.log("[sync-saude] Dica: use --write-env para atualizar o arquivo .env/.env.example automaticamente.");
    return;
  }

  if (!existsSync(args.file)) {
    throw new Error(`Arquivo nao encontrado para atualizar: ${args.file}`);
  }

  let envContent = readFileSync(args.file, "utf8");
  envContent = replaceEnvVar(envContent, "SAUDE_API_CODIGO_TIPO_UBS", codigoUbs);
  envContent = replaceEnvVar(envContent, "SAUDE_API_CODIGO_TIPO_UPA", codigoUpa);
  envContent = replaceEnvVar(envContent, "SAUDE_API_CODIGO_TIPO_PRONTO_SOCORRO", codigoProntoSocorro);
  envContent = replaceEnvVar(envContent, "SAUDE_API_CODIGOS_TIPO_UBS", codigosUbs);
  envContent = replaceEnvVar(envContent, "SAUDE_API_CODIGOS_TIPO_UPA", codigosUpa);
  envContent = replaceEnvVar(envContent, "SAUDE_API_CODIGOS_TIPO_PRONTO_SOCORRO", codigosProntoSocorro);

  writeFileSync(args.file, envContent, "utf8");
  console.log(`[sync-saude] Arquivo atualizado: ${args.file}`);
}

main().catch((error) => {
  console.error(`[sync-saude] Erro: ${error.message}`);
  process.exit(1);
});
