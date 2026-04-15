#!/usr/bin/env node
/**
 * sync-funai.mjs
 * Baixa e normaliza dados das Coordenações Técnicas Locais (CTL) e
 * Coordenações Regionais (CR) da FUNAI do GeoServer oficial da FUNAI,
 * indexando por código de município IBGE (6 dígitos).
 *
 * Fonte primária: GeoServer FUNAI (geoserver.funai.gov.br) — sem autenticação
 * Saída: funai-coordenacoes.json (cache local, JSON commitado no repositório)
 *
 * Por que GeoServer em vez de dados.gov.br/CKAN?
 *   O endpoint dados.gov.br/CKAN para dados FUNAI retorna HTTP 401 sem
 *   credenciais, enquanto o GeoServer WFS da FUNAI é publicamente acessível
 *   sem autenticação e provê os mesmos dados CTL/CR com geometria e campos
 *   administrativos completos. O artefato JSON resultante é armazenado em
 *   disco (não em banco de dados) por consistência com a arquitetura de
 *   patches do projeto, onde dados auxiliares são lidos em tempo de request.
 *   Rerun this script whenever FUNAI data needs refreshing: node scripts/sync-funai.mjs
 *
 * Camadas WFS usadas:
 *   Funai:tis_ctl — Coordenações Técnicas Locais
 *   Funai:tis_cr  — Coordenações Regionais
 *
 * CTL GeoServer fields:
 *   FID, undadm_codigo, undadm_codigo_pai, undadm_codigo_novo,
 *   undadm_codigo_pai_novo, undadm_sigla, undadm_nome, undadm_nome_pai,
 *   undadm_sigla_pai, undadm_situacao, undadm_logradouro, undadm_complemento,
 *   undadm_bairro, undadm_cep, undadm_email, undadm_uf_sigla,
 *   mun_codigo_ibge, muncoddv, the_geom
 *
 * CR GeoServer fields:
 *   FID, undadm_codigo, undadm_codigo_pai, undadm_sigla, undadm_nome,
 *   undadm_situacao, undadm_uf_sigla, mun_codigo_ibge, mun_nome,
 *   mun_uf_sigla, the_geom
 *
 * Data quality notes:
 *   - CTLs are deduplicated by sigla (some rows repeat across municipalities)
 *   - CRs are matched to CTLs by normalized undadm_nome (sigla formats differ
 *     between layers: undadm_sigla_pai in CTL vs undadm_sigla in CR)
 *   - Records with empty undadm_sigla or undadm_nome are skipped
 *   - Only CTLs with situacao=A (ativa) are included
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const OUTPUT_FILE = process.env.FUNAI_OUTPUT_JSON || resolve(ROOT, "funai-coordenacoes.json");

const GEOSERVER_BASE = "https://geoserver.funai.gov.br/geoserver/Funai/ows";
const CTL_LAYER = "Funai:tis_ctl";
const CR_LAYER = "Funai:tis_cr";

const HEADERS = {
  Accept: "text/csv,application/json,*/*",
  "User-Agent": "ChegoAContaDiretora/1.0 (sync-funai)",
};

function normalizeMunCode(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (digits.length === 7) return digits.slice(0, 6);
  if (digits.length === 6) return digits;
  return null;
}

/**
 * RFC 4180-compliant CSV parser that handles quoted fields with embedded
 * commas, double-quote escaping, and trimmed whitespace in field values.
 */
function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(text) {
  const lines = text.trim().split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (values[i] ?? "").trim();
    });
    return obj;
  });
}

async function fetchLayerCSV(layerName, label) {
  const url =
    `${GEOSERVER_BASE}?service=WFS&version=1.0.0&request=GetFeature` +
    `&typeName=${encodeURIComponent(layerName)}&outputFormat=csv`;
  console.log(`[sync-funai] Baixando ${label} de GeoServer FUNAI...`);
  const res = await fetch(url, {
    signal: AbortSignal.timeout(60000),
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} para ${layerName}`);
  const text = await res.text();
  const records = parseCSV(text);
  console.log(`[sync-funai] ${label}: ${records.length} registros brutos`);
  if (records.length > 0) {
    console.log(`[sync-funai] Campos ${label}:`, Object.keys(records[0]).join(", "));
  }
  return records;
}

async function main() {
  console.log("[sync-funai] Iniciando sincronização de dados FUNAI (GeoServer)...");

  let ctlRaw = [];
  let crRaw = [];

  try {
    ctlRaw = await fetchLayerCSV(CTL_LAYER, "CTL");
  } catch (e) {
    console.warn(`[sync-funai] Falha ao baixar CTLs: ${e.message}`);
  }

  try {
    crRaw = await fetchLayerCSV(CR_LAYER, "CR");
  } catch (e) {
    console.warn(`[sync-funai] Falha ao baixar CRs: ${e.message}`);
  }

  // --- Build CR lookup by sigla ---
  const crBySigla = {};
  for (const rec of crRaw) {
    const sigla = (rec.undadm_sigla || "").trim();
    const nome = (rec.undadm_nome || "").trim();
    const situacao = (rec.undadm_situacao || "").trim();
    const uf = (rec.undadm_uf_sigla || rec.mun_uf_sigla || "").trim() || null;
    const munCode = normalizeMunCode(rec.mun_codigo_ibge);
    const munNome = (rec.mun_nome || "").trim() || null;
    if (sigla) {
      crBySigla[sigla] = { sigla, nome, situacao, uf, municipio_sede: munCode, municipio_nome: munNome };
    }
  }
  console.log(`[sync-funai] CRs únicas: ${Object.keys(crBySigla).length}`);

  // --- Group CTL raw records by sigla (a CTL may serve multiple municipalities) ---
  // Each row in tis_ctl represents one municipality served by a CTL.
  const ctlBySigla = {};
  for (const rec of ctlRaw) {
    const sigla = (rec.undadm_sigla || "").trim();
    const nome = (rec.undadm_nome || "").trim();
    const situacao = (rec.undadm_situacao || "").trim();
    if (!sigla || !nome || situacao !== "A") continue;

    const uf = (rec.undadm_uf_sigla || "").trim() || null;
    const munCode = normalizeMunCode(rec.mun_codigo_ibge || rec.muncoddv);
    const crSigla = (rec.undadm_sigla_pai || "").trim() || null;
    const crNome = (rec.undadm_nome_pai || "").trim() || null;
    const endereco = [rec.undadm_logradouro, rec.undadm_bairro, rec.undadm_complemento]
      .filter(Boolean)
      .map((s) => s.trim())
      .join(", ") || null;

    if (!ctlBySigla[sigla]) {
      ctlBySigla[sigla] = {
        nome,
        sigla,
        uf,
        cr_sigla: crSigla,
        cr_nome: crNome,
        situacao,
        endereco,
        municipios_atendidos: [],
      };
    }
    if (munCode && !ctlBySigla[sigla].municipios_atendidos.includes(munCode)) {
      ctlBySigla[sigla].municipios_atendidos.push(munCode);
    }
  }
  const ctls = Object.values(ctlBySigla);
  console.log(`[sync-funai] CTLs únicas ativas: ${ctls.length}`);

  // --- Build CR lookup by normalized name (join key between CTL.undadm_nome_pai and CR.undadm_nome) ---
  const crByNome = {};
  for (const [sigla, crInfo] of Object.entries(crBySigla)) {
    const key = (crInfo.nome || "").trim().toUpperCase();
    if (key) crByNome[key] = sigla;
  }

  // --- Compute CR abrangencia: all unique municipalities covered by CTLs in each CR ---
  // Match CTL to CR via undadm_nome_pai === CR.undadm_nome (siglas differ between layers).
  const crMunicipiosAtendidos = {};
  for (const ctl of ctls) {
    const crNomeKey = (ctl.cr_nome || "").trim().toUpperCase();
    const crSigla = crByNome[crNomeKey] || null;
    if (!crSigla) continue;
    if (!crMunicipiosAtendidos[crSigla]) crMunicipiosAtendidos[crSigla] = new Set();
    for (const munCode of ctl.municipios_atendidos) {
      crMunicipiosAtendidos[crSigla].add(munCode);
    }
  }

  // --- Build by_municipio index ---
  const byMunicipio = {};

  const ensureMun = (cod) => {
    if (!byMunicipio[cod]) byMunicipio[cod] = { ctls: [], cr: null };
  };

  // Add CTLs to municipalities
  for (const ctl of ctls) {
    // Use first municipality as sede if no explicit sede, otherwise use all
    const sede = ctl.municipios_atendidos[0] || null;
    const ctlEntry = {
      nome: ctl.nome,
      sigla: ctl.sigla,
      uf: ctl.uf,
      cr_sigla: ctl.cr_sigla,
      cr_nome: ctl.cr_nome,
      situacao: ctl.situacao,
      endereco: ctl.endereco,
      municipios_atendidos: ctl.municipios_atendidos,
    };
    for (const munCode of ctl.municipios_atendidos) {
      ensureMun(munCode);
      if (!byMunicipio[munCode].ctls.find((c) => c.sigla === ctl.sigla)) {
        byMunicipio[munCode].ctls.push(ctlEntry);
      }
    }
  }

  // Add CRs to municipalities (seat municipality + all municipalities with CTLs under this CR)
  const enrichedCRs = [];
  for (const [crSigla, crInfo] of Object.entries(crBySigla)) {
    const abrangenciaMuns = [...(crMunicipiosAtendidos[crSigla] || new Set())];
    if (crInfo.municipio_sede) abrangenciaMuns.push(crInfo.municipio_sede);
    const uniqueAbrangencia = [...new Set(abrangenciaMuns)].sort();
    const crEntry = {
      nome: crInfo.nome,
      sigla: crInfo.sigla,
      uf: crInfo.uf,
      municipio_sede: crInfo.municipio_sede,
      municipio_nome: crInfo.municipio_nome,
      situacao: crInfo.situacao,
      abrangencia: uniqueAbrangencia,
    };
    enrichedCRs.push(crEntry);
    // Place CR in all municipalities it covers
    for (const munCode of uniqueAbrangencia) {
      ensureMun(munCode);
      if (!byMunicipio[munCode].cr) {
        byMunicipio[munCode].cr = crEntry;
      }
    }
  }

  const totalMunicipios = Object.keys(byMunicipio).length;
  const totalComCTL = Object.values(byMunicipio).filter((m) => m.ctls.length > 0).length;
  const totalComCR = Object.values(byMunicipio).filter((m) => m.cr).length;

  console.log(`[sync-funai] Municípios indexados: ${totalMunicipios}`);
  console.log(`[sync-funai] Municípios com CTL: ${totalComCTL}`);
  console.log(`[sync-funai] Municípios com CR: ${totalComCR}`);

  // Sample output for verification
  const sampleMun = Object.entries(byMunicipio).find(([, v]) => v.ctls.length > 0 && v.cr);
  if (sampleMun) {
    const [cod, data] = sampleMun;
    console.log(`[sync-funai] Exemplo (${cod}): ${data.ctls.length} CTL(s), CR=${data.cr?.nome}`);
    console.log(`[sync-funai] CR abrangencia: ${data.cr?.abrangencia?.length} municípios`);
    if (data.ctls[0]) {
      console.log(`[sync-funai] CTL[0] municipios_atendidos: ${JSON.stringify(data.ctls[0].municipios_atendidos)}`);
    }
  }

  const output = {
    generated_at: new Date().toISOString(),
    fonte: "GeoServer FUNAI (geoserver.funai.gov.br) — Camadas tis_ctl e tis_cr",
    resumo: {
      total_ctls: ctls.length,
      total_crs: Object.keys(crBySigla).length,
      municipios_indexados: totalMunicipios,
      municipios_com_ctl: totalComCTL,
      municipios_com_cr: totalComCR,
    },
    all_ctls: ctls,
    all_crs: enrichedCRs,
    by_municipio: byMunicipio,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf8");
  console.log(`[sync-funai] Dados salvos em: ${OUTPUT_FILE}`);
  console.log("[sync-funai] Concluído.");
}

main().catch((e) => {
  console.error("[sync-funai] Erro fatal:", e.message);
  process.exit(1);
});
