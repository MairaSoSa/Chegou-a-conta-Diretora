#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const MEC_URL = "https://www.gov.br/mec/pt-br/composicao";
const DASHBOARD_PATH = "dist/public/assets/Dashboard-v30.js";
const INDEX_HTML_PATH = "dist/public/index.html";
const INDEX_BUNDLE_PATH = "dist/public/assets/index-v21.js";

function todayVersionTag() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}${m}${day}${h}${min}`;
}

function formatPtBrDate(d) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeSpace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function stripHtmlToText(html) {
  const noScript = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  const plain = noScript
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
  return normalizeSpace(plain);
}

function unique(items) {
  return [...new Set(items.map((v) => normalizeSpace(v)))].filter(Boolean);
}

function extractMecSections(pageText) {
  const chunk = pageText;

  const gabineteMatch = chunk.match(/Composi[cç][aã]o\s+Gabinete do Ministro\s+Gabinete\s+([\s\S]*?)\s+Secretaria[\s\-‑–]?Executiva\s*\(SE\)/i)
    || chunk.match(/Gabinete do Ministro\s+Gabinete\s+([\s\S]*?)\s+Secretaria[\s\-‑–]?Executiva\s*\(SE\)/i);
  if (!gabineteMatch) {
    throw new Error("Nao foi possivel extrair o bloco 'Gabinete do Ministro'.");
  }

  const executivaMatch = chunk.match(/Secretaria[\s\-‑–]?Executiva\s*\(SE\)\s+Secretaria[\s\-‑–]?Executiva\s+([\s\S]*?)\s+Secretaria de Educa[^()]+\(SEB\)/i);
  if (!executivaMatch) {
    throw new Error("Nao foi possivel extrair o bloco 'Secretaria-Executiva (SE)'.");
  }

  const secStart = chunk.indexOf("Secretaria de Educação Básica (SEB)");
  const secEnd = chunk.indexOf("GOV.BR Serviços");
  const secChunk = secStart !== -1 && secEnd !== -1 && secEnd > secStart
    ? chunk.slice(secStart, secEnd)
    : chunk;

  const secretariasMatches = secChunk.match(/Secretaria de[^()]+\([A-Za-z]+\)/g) || [];
  const secretarias = unique(
    secretariasMatches.filter((s) => !/Secretaria-Executiva/i.test(s))
  );

  if (secretarias.length === 0) {
    throw new Error("Nao foi possivel extrair a lista de secretarias especializadas.");
  }

  const gabineteItems = unique(
    gabineteMatch[1]
      .split(/\s{2,}|\s+(?=Assessoria|Ouvidoria|Corregedoria|Consultoria)/)
      .map((s) => s.trim())
      .filter((s) => /Assessoria|Ouvidoria|Corregedoria|Consultoria/i.test(s))
  );

  const executivaItems = unique(
    executivaMatch[1]
      .split(/\s+(?=Subsecretaria)/)
      .map((s) => s.trim())
      .filter((s) => /Subsecretaria/i.test(s))
  );

  if (gabineteItems.length === 0 || executivaItems.length === 0) {
    throw new Error("Falha ao montar as listas do MEC a partir da composicao oficial.");
  }

  return {
    gabinete: gabineteItems.join("; "),
    executiva: executivaItems.join("; "),
    especializadas: secretarias.join("; "),
  };
}

function replaceSectionValue(source, cargo, value) {
  const escapedCargo = cargo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(\\{ cargo: \"${escapedCargo}\", nome: \")([^\"]*)(\", tel: \"Composição institucional oficial do MEC\", email: \"https://www\\.gov\\.br/mec/pt-br/composicao\" \\})`);
  if (!re.test(source)) {
    throw new Error(`Nao encontrei o card do MEC para cargo '${cargo}' no dashboard.`);
  }
  return source.replace(re, `$1${value}$3`);
}

async function fetchMecComposition() {
  const html = execFileSync(
    "curl",
    [
      "-sL",
      "-A",
      "Mozilla/5.0",
      MEC_URL,
    ],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
  );

  if (!html || html.length < 1000) {
    throw new Error("Resposta vazia ou muito pequena ao consultar o MEC.");
  }

  const pageText = stripHtmlToText(html);
  return extractMecSections(pageText);
}

function updateDashboardContent(mecData, dateLabel) {
  const original = readFileSync(DASHBOARD_PATH, "utf8");

  let updated = original;
  updated = replaceSectionValue(updated, "Gabinete do Ministro", mecData.gabinete);
  updated = replaceSectionValue(updated, "Secretaria-Executiva (SE)", mecData.executiva);
  updated = replaceSectionValue(updated, "Secretarias Especializadas", mecData.especializadas);

  updated = updated.replace(
    /Fonte: https:\/\/www\.gov\.br\/mec\/pt-br\/composicao \([^)]*\)\./g,
    `Fonte: https://www.gov.br/mec/pt-br/composicao (consulta automatica em ${dateLabel}).`
  );

  if (updated !== original) {
    writeFileSync(DASHBOARD_PATH, updated, "utf8");
  }

  return updated !== original;
}

function bumpDashboardVersion(versionTag) {
  const files = [INDEX_HTML_PATH, INDEX_BUNDLE_PATH];
  let changedFiles = 0;

  for (const path of files) {
    const original = readFileSync(path, "utf8");
    const updated = original.replace(/(Dashboard-v30\.js\?v=)[A-Za-z0-9._-]+/g, `$1${versionTag}`);
    if (updated !== original) {
      writeFileSync(path, updated, "utf8");
      changedFiles += 1;
    }
  }

  return changedFiles;
}

async function main() {
  try {
    const mec = await fetchMecComposition();
    const now = new Date();
    const dateLabel = formatPtBrDate(now);
    const versionTag = todayVersionTag();

    const dashboardChanged = updateDashboardContent(mec, dateLabel);
    const versionFilesChanged = bumpDashboardVersion(versionTag);

    console.log("[sync-mec] Bloco MEC sincronizado com sucesso.");
    console.log(`[sync-mec] Gabinete: ${mec.gabinete.split(";").length} itens`);
    console.log(`[sync-mec] Secretaria-Executiva: ${mec.executiva.split(";").length} itens`);
    console.log(`[sync-mec] Secretarias especializadas: ${mec.especializadas.split(";").length} itens`);
    console.log(`[sync-mec] Dashboard alterado: ${dashboardChanged ? "sim" : "nao"}`);
    console.log(`[sync-mec] Arquivos com version bump: ${versionFilesChanged}`);
  } catch (error) {
    console.error(`[sync-mec] Erro: ${error.message}`);
    process.exit(1);
  }
}

await main();
