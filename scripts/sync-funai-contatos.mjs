#!/usr/bin/env node
/**
 * sync-funai-contatos.mjs
 *
 * Re-builds funai-contatos.json a partir de respostas de busca web já coletadas.
 *
 * USO TÍPICO (workflow assistido por LLM/agente):
 *   1. Listar siglas que precisam de refresh:
 *        node scripts/sync-funai-contatos.mjs --list
 *   2. Para cada CR sem dados completos, salvar a resposta de uma busca web
 *      (texto bruto com telefones/e-mails/endereço/CEP) em:
 *        .local/funai-search/<SIGLA>.txt
 *      (uma sigla por arquivo; o agente que coleta pode encher a pasta toda
 *       de uma vez via webSearch).
 *   3. Rodar a re-construção:
 *        node scripts/sync-funai-contatos.mjs --build
 *      Isso lê todos os .txt da pasta, extrai contatos via regex (mesmas
 *      regras usadas na coleta original) e regenera funai-contatos.json
 *      preservando entradas existentes quando o txt da sigla não existir.
 *
 * O arquivo gerado tem o campo `generated_at`, que é exposto na API
 * (`funai.contatos_atualizado_em`) e renderizado no card da CR como
 * "🕒 Atualizado em DD/MM/YYYY".
 *
 * IMPORTANTE: este script NÃO faz a busca web sozinho — a base oficial
 * GeoServer FUNAI tem campos de contato em branco (304/304 CTLs) e o portal
 * gov.br bloqueia scraping. A coleta tem que ser feita por um humano ou
 * agente com acesso a um motor de busca; este script só padroniza e valida
 * a etapa de extração+merge.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const COORD_FILE = path.join(ROOT, 'funai-coordenacoes.json');
const OUT_FILE = path.join(ROOT, 'funai-contatos.json');
const SEARCH_DIR = path.join(ROOT, '.local/funai-search');

function uniq(arr) { return [...new Set(arr)]; }

function extractPhones(t) {
  const re = /\((\d{2})\)\s?9?\s?\d{4,5}[-.\s]?\d{4}/g;
  return uniq((t.match(re) || []).map(s => s.replace(/\s+/g, ' ').trim()))
    .filter(p => { const dd = p.match(/\((\d{2})\)/)?.[1]; return dd && +dd >= 11 && +dd <= 99; })
    .slice(0, 5);
}

function extractEmails(t) {
  const re = /[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}/g;
  return uniq((t.match(re) || []).map(e => e.toLowerCase()))
    .filter(e => /funai\.gov\.br$/.test(e) || /\.gov\.br$/.test(e))
    .filter(e => !/^(noreply|no-reply|webmaster|postmaster|atendimento\.web)@/.test(e))
    .slice(0, 3);
}

function extractCEPs(t) {
  const re = /\b(\d{5}|\d{2}\.\d{3})[-.\s]?(\d{3})\b/g;
  const out = []; let m;
  while ((m = re.exec(t)) !== null) {
    const n = `${m[1].replace('.', '')}-${m[2]}`;
    if (/^\d{5}-\d{3}$/.test(n)) out.push(n);
  }
  return uniq(out).slice(0, 3);
}

function cleanAddr(s) {
  return s.replace(/\*+/g, '')
    .replace(/[`_]/g, '')
    .replace(/\s*\|\s*/g, ' — ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s:|*•\-–—]+|[\s|*•\-–—]+$/g, '')
    .trim();
}

function isValidAddr(s) {
  if (typeof s !== 'string') return false;
  if (s.length < 12 || s.length > 250) return false;
  if (/https?:|www\.|\[|\]|🔗|^>|^\/\//i.test(s)) return false;
  return /[A-Za-zÀ-ÿ]{4,}/.test(s);
}

function extractAddress(t) {
  const c = [];
  for (const m of t.matchAll(/\*?\*?Endere[çc]o[^\n]*?\*?\*?\s*[:\|]\s*([^\n*|]{15,250})/gi)) c.push(m[1]);
  for (const m of t.matchAll(/(?:^|[\n*•\-–—])\s*((?:Av\.?|Avenida|Rua|R\.|Rod\.|Rodovia|Tv\.?|Travessa|Pra[çc]a|Estrada|Quadra|Q\.|SQS|SHIN|SHIS|SBS|SCS|SQN|Alameda|Al\.?)\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç][^\n*|]{8,200})/gm)) c.push(m[1]);
  for (const m of t.matchAll(/\|\s*((?:Av\.?|Avenida|Rua|R\.|Rod\.|Rodovia|Tv\.?|Travessa|Pra[çc]a|Estrada|Quadra)\s+[^\n|]{8,200})\s*\|/gi)) c.push(m[1]);
  if (!c.length) return null;
  const cl = c.map(cleanAddr).filter(isValidAddr);
  if (!cl.length) return null;
  cl.sort((a, b) => b.length - a.length);
  return cl[0].slice(0, 250);
}

function loadCRs() {
  if (!fs.existsSync(COORD_FILE)) {
    throw new Error(`Arquivo ${COORD_FILE} não encontrado. Rode antes: node scripts/sync-funai.mjs`);
  }
  const data = JSON.parse(fs.readFileSync(COORD_FILE, 'utf8'));
  const crs = new Map();
  for (const m of Object.values(data.by_municipio || {})) {
    if (m.cr && m.cr.sigla && !crs.has(m.cr.sigla)) {
      crs.set(m.cr.sigla, {
        sigla: m.cr.sigla,
        nome: m.cr.nome || '',
        uf: m.cr.uf || null,
        municipio_sede: m.cr.municipio_sede || null,
      });
    }
  }
  return [...crs.values()];
}

function loadExisting() {
  if (!fs.existsSync(OUT_FILE)) return { by_sigla: {} };
  try { return JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')); }
  catch { return { by_sigla: {} }; }
}

function cmd_list() {
  const existing = loadExisting();
  const crs = loadCRs();
  console.log(`Total de CRs: ${crs.length}`);
  console.log(`\nCRs sem dados completos (precisam de coleta):\n`);
  let need = 0;
  for (const cr of crs) {
    const e = existing.by_sigla?.[cr.sigla] || {};
    const miss = [];
    if (!e.endereco) miss.push('endereço');
    if (!e.cep) miss.push('CEP');
    if (!e.telefones?.length) miss.push('telefone');
    if (!e.emails?.length) miss.push('e-mail');
    if (miss.length) { need++; console.log(`  ${cr.sigla.padEnd(10)} (${cr.uf || '??'})  faltam: ${miss.join(', ')}`); }
  }
  console.log(`\n${need}/${crs.length} CRs com dados incompletos.`);
  console.log(`\nPara coletar: salve buscas web em ${SEARCH_DIR}/<SIGLA>.txt e rode --build.`);
}

function cmd_build() {
  const crs = loadCRs();
  const existing = loadExisting();
  const out = { by_sigla: {} };
  if (!fs.existsSync(SEARCH_DIR)) fs.mkdirSync(SEARCH_DIR, { recursive: true });
  let updated = 0;

  for (const cr of crs) {
    const txtPath = path.join(SEARCH_DIR, `${cr.sigla}.txt`);
    const prev = existing.by_sigla?.[cr.sigla] || {};
    let entry = {
      nome: cr.nome,
      uf: cr.uf,
      municipio_nome: prev.municipio_nome || null,
      endereco: prev.endereco || null,
      cep: prev.cep || null,
      telefones: prev.telefones || [],
      emails: prev.emails || [],
    };
    if (fs.existsSync(txtPath)) {
      const ans = fs.readFileSync(txtPath, 'utf8');
      const phones = extractPhones(ans);
      const emails = extractEmails(ans);
      const addr = extractAddress(ans);
      const cep = extractCEPs(ans)[0] || null;
      // só sobrescreve se a busca trouxe algo melhor
      if (phones.length) entry.telefones = phones;
      if (emails.length) entry.emails = emails;
      if (addr) entry.endereco = addr;
      if (cep) entry.cep = cep;
      updated++;
    }
    out.by_sigla[cr.sigla] = entry;
  }

  const final = {
    generated_at: new Date().toISOString(),
    fonte: existing.fonte || 'Pesquisa web em fontes públicas (gov.br/funai e portais governamentais) — coleta curada manual',
    observacao: existing.observacao || 'Contatos das Coordenações Regionais (CR) da FUNAI. As CTLs não publicam contato direto — usar a CR articuladora ou a Ouvidoria FUNAI.',
    ouvidoria_nacional: existing.ouvidoria_nacional || {
      telefone: '0800-208-0399',
      email: 'ouvidoria@funai.gov.br',
      site: 'https://www.gov.br/funai/pt-br/canais_atendimento',
    },
    resumo: {
      total_crs: Object.keys(out.by_sigla).length,
      com_telefone: Object.values(out.by_sigla).filter(v => v.telefones.length).length,
      com_email: Object.values(out.by_sigla).filter(v => v.emails.length).length,
      com_endereco: Object.values(out.by_sigla).filter(v => v.endereco).length,
      com_cep: Object.values(out.by_sigla).filter(v => v.cep).length,
    },
    by_sigla: out.by_sigla,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(final, null, 2), 'utf8');
  console.log(`Gravado ${OUT_FILE}`);
  console.log(`  buscas processadas: ${updated}/${crs.length}`);
  console.log(`  resumo:`, final.resumo);
}

const arg = process.argv[2] || '--help';
if (arg === '--list') cmd_list();
else if (arg === '--build') cmd_build();
else {
  console.log(`uso:
  node scripts/sync-funai-contatos.mjs --list    # mostra CRs com dados incompletos
  node scripts/sync-funai-contatos.mjs --build   # rebuilda funai-contatos.json a partir de .local/funai-search/<SIGLA>.txt`);
}
