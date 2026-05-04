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
 * Estratégia de matching (aplicada em ordem, na primeira que resolver):
 *   1. Nome exato normalizado dentro da mesma esfera (tp_dependencia).
 *   2. Nome exato normalizado em qualquer esfera.
 *   3. "Core name" (nome com prefixos do tipo da escola e títulos
 *      removidos) dentro da mesma esfera.
 *   4. "Core name" em qualquer esfera.
 *
 * Em todos os passos só atribuímos INEP quando o casamento é único
 * (apenas 1 candidato no município). Casos ambíguos ficam com inep=null
 * e o frontend cai no fallback por nome.
 *
 * IMPORTANTE: o índice cobre TODOS os anos do censo (2020+). Como os
 * nomes mudam ao longo dos anos (renomeações, padronização EMEFM↔EMEF,
 * etc.) e a base do PSE costuma carregar grafias antigas, indexar por
 * (co_entidade, ano) garante que a grafia usada pelo PSE — mesmo que
 * descontinuada no censo recente — ainda mapeie para o INEP correto.
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

// Tokens que nomeiam o TIPO da escola (não fazem parte da identidade).
// Quando aparecem no início do nome (consecutivos) são removidos para extrair
// o "core name". Inclui letras isoladas (E M E I F) que aparecem em grafias
// como "E M E I E F PROFª EVA" — equivalentes a "EMEIEF".
const SCHOOL_TYPE_TOKENS = new Set([
  // letras isoladas usadas em siglas espacejadas (E M E I E F → EMEIEF)
  "e", "m", "i", "f",
  // siglas curtas / genéricas
  "em", "ee", "ef", "ei", "ec", "eb", "ne", "nei", "nef", "nem",
  "esc", "escola", "escolar",
  // siglas municipais/estaduais (EMEF/EMEI/EEEFM/etc.)
  "emef", "emei", "emeif", "emeief", "emefm", "emefi", "emefti",
  "emeifm", "emeti", "emeitm", "emeie", "emeefm",
  "eeef", "eeefm", "eeem", "eeemti", "eeefti", "eeefe", "eeemei", "eeb",
  "ceefm", "ceeftm", "ceefti", "ceemti", "cetep", "cefet", "ceti",
  "colegio", "col",
  // creches / pré-escola
  "cmei", "cei", "cem", "cmef", "cmeief", "ceim",
  "cr", "creche", "centro",
  // unidades escolares
  "unidade", "u", "ui", "ue", "ueb", "umef", "umei", "umeief",
  "ued", "uee", "ueef", "ueefm", "ueief",
  // institutos federais
  "instituto", "if", "ifrn", "ifro", "ifsp", "ifce", "ifba", "ifma",
  "ifrj", "ifg", "ifmt", "ifms", "ifpr", "ifsc", "ifrs", "iftm",
  "ifap", "ifam", "ifac", "ifpa", "ifpb", "ifpe", "ifpi", "ifto",
  "ifgo", "ifes", "ifmg",
  // técnico / profissionalizante
  "etec", "fatec", "esef", "ginasio", "ginasial",
  // descritivos genéricos
  "ed", "edu", "educacao", "infantil", "fundamental", "medio", "ensino",
  "municipal", "estadual", "federal", "particular",
  // títulos honoríficos / religiosos
  "professor", "professora", "prof", "profa",
  "padre", "pe", "pr",
  "doutor", "doutora", "dr", "dra",
  "santo", "santa", "sao", "sta", "sto",
  "irma", "irmao", "monsenhor", "msr",
]);

// Preposições/conectivos ignorados na comparação por core name.
const STOPWORDS = new Set([
  "de", "do", "da", "dos", "das", "e", "em", "no", "na", "nos", "nas",
  "a", "o", "as", "os", "ao", "aos",
]);

// Extrai a "essência" do nome para casamento fuzzy:
//   1. Normaliza (lowercase, sem acentos, sem pontuação).
//   2. Remove tokens consecutivos do início que são tipo de escola.
//   3. Remove stopwords e títulos do restante.
// Retorna `null` se o resultado tiver menos de 2 tokens identificadores
// (proteção contra falsos positivos do tipo "EMEF JOAO" → "joao").
function coreName(name) {
  const n = norm(name);
  if (!n) return null;
  const tokens = n.split(" ").filter(Boolean);
  let i = 0;
  while (i < tokens.length && SCHOOL_TYPE_TOKENS.has(tokens[i])) i++;
  const body = tokens
    .slice(i)
    .filter((t) => !STOPWORDS.has(t) && !SCHOOL_TYPE_TOKENS.has(t));
  if (body.length < 2) return null;
  // Ordem importa pouco — usamos set ordenado para resistir a inversões
  // de sobrenome ("EVA DOS SANTOS DE OLIVEIRA" vs "EVA OLIVEIRA SANTOS").
  return Array.from(new Set(body)).sort().join(" ");
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
  const stats = { exatoMesmaDep: 0, exatoQualquerDep: 0, coreMesmaDep: 0, coreQualquerDep: 0 };

  // Helper: deduplica candidatos por co_entidade (mesmo INEP em vários anos
  // é o MESMO match, não ambíguo).
  const uniqInep = (arr) => Array.from(new Set(arr.map(Number).filter(Boolean)));

  // Para evitar 5500 queries individuais, batch por chunks de N municípios
  const CHUNK = 200;
  for (let off = 0; off < ibge6List.length; off += CHUNK) {
    const chunk = ibge6List.slice(off, off + CHUNK);
    const ibge6Nums = chunk.map(Number);
    // Pega TODOS os registros (todos os anos) para esses municípios.
    // NÃO usamos DISTINCT ON: queremos o conjunto de TODAS as grafias que
    // cada escola já teve no censo, porque o PSE pode usar o nome antigo.
    // Indexamos por (ibge6, dep, normname) -> Set<co_entidade>.
    const sql = `
      SELECT
        co_entidade,
        no_entidade,
        tp_dependencia,
        (co_municipio / 10)::int AS ibge6
      FROM censo_escolas
      WHERE (co_municipio / 10)::int = ANY($1::int[])
        AND no_entidade IS NOT NULL
    `;
    const r = await pool.query(sql, [ibge6Nums]);
    // map: ibge6 -> Map<dep, Map<normname, [inep,...]>> — todos os anos.
    // Também construímos um índice paralelo por core name para o fallback fuzzy.
    const byMun = new Map();
    const byMunCore = new Map();
    for (const row of r.rows) {
      const ibge6 = row.ibge6;
      const dep = String(row.tp_dependencia ?? "");
      const inep = Number(row.co_entidade);

      // exato
      let m = byMun.get(ibge6);
      if (!m) { m = new Map(); byMun.set(ibge6, m); }
      let depMap = m.get(dep);
      if (!depMap) { depMap = new Map(); m.set(dep, depMap); }
      const nm = norm(row.no_entidade);
      const arr = depMap.get(nm) || [];
      arr.push(inep);
      depMap.set(nm, arr);

      // core
      const cn = coreName(row.no_entidade);
      if (cn) {
        let mc = byMunCore.get(ibge6);
        if (!mc) { mc = new Map(); byMunCore.set(ibge6, mc); }
        let depMapC = mc.get(dep);
        if (!depMapC) { depMapC = new Map(); mc.set(dep, depMapC); }
        const arrC = depMapC.get(cn) || [];
        arrC.push(inep);
        depMapC.set(cn, arrC);
      }
    }

    for (const ibge6 of chunk) {
      const mun = municipios[ibge6];
      if (!mun || !Array.isArray(mun.escolas)) continue;
      const mapDep = byMun.get(Number(ibge6));
      const mapDepCore = byMunCore.get(Number(ibge6));
      for (const escola of mun.escolas) {
        totalEscolas += 1;
        const dep = ESFERA_TO_DEP[String(escola.esfera || "").toUpperCase()] || null;
        const nm = norm(escola.nome);
        const cn = coreName(escola.nome);
        let inep = null;
        let ambigua = false;
        let matchedVia = null;

        // Política: só atribui INEP quando o casamento for ÚNICO. Em casos
        // ambíguos (>1 co_entidade distinto candidato), mantemos inep=null —
        // o frontend cai no fallback por nome normalizado e o município ainda
        // pode ser identificado, sem risco de atribuir badges PSE à escola
        // errada (a etiqueta "Escola aderiu" é per-escola e seria errada se
        // o INEP apontasse para outro estabelecimento homônimo).

        // Passo 1: nome exato + mesma dep
        if (mapDep && dep) {
          const depMap = mapDep.get(dep);
          if (depMap) {
            const cand = uniqInep(depMap.get(nm) || []);
            if (cand.length === 1) { inep = cand[0]; matchedVia = "exato_mesma_dep"; }
            else if (cand.length > 1) ambigua = true;
          }
        }
        // Passo 2: nome exato + qualquer dep
        if (!inep && !ambigua && mapDep) {
          const todos = [];
          for (const depMap of mapDep.values()) {
            const cand = depMap.get(nm);
            if (cand) todos.push(...cand);
          }
          const u = uniqInep(todos);
          if (u.length === 1) { inep = u[0]; matchedVia = "exato_qualquer_dep"; }
          else if (u.length > 1) ambigua = true;
        }
        // Passo 3: core name + mesma dep
        if (!inep && !ambigua && cn && mapDepCore && dep) {
          const depMapC = mapDepCore.get(dep);
          if (depMapC) {
            const cand = uniqInep(depMapC.get(cn) || []);
            if (cand.length === 1) { inep = cand[0]; matchedVia = "core_mesma_dep"; }
            else if (cand.length > 1) ambigua = true;
          }
        }
        // Passo 4: core name + qualquer dep
        if (!inep && !ambigua && cn && mapDepCore) {
          const todos = [];
          for (const depMapC of mapDepCore.values()) {
            const cand = depMapC.get(cn);
            if (cand) todos.push(...cand);
          }
          const u = uniqInep(todos);
          if (u.length === 1) { inep = u[0]; matchedVia = "core_qualquer_dep"; }
          else if (u.length > 1) ambigua = true;
        }

        escola.inep = inep;
        if (inep) {
          totalCasadas += 1;
          if (matchedVia === "exato_mesma_dep") stats.exatoMesmaDep += 1;
          else if (matchedVia === "exato_qualquer_dep") stats.exatoQualquerDep += 1;
          else if (matchedVia === "core_mesma_dep") stats.coreMesmaDep += 1;
          else if (matchedVia === "core_qualquer_dep") stats.coreQualquerDep += 1;
        } else {
          totalSemMatch += 1;
        }
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
    porEstrategia: stats,
  };

  writeFileSync(OUTPUT, JSON.stringify(data));
  console.log(
    `[enrich-pse] gravado ${OUTPUT}: ${totalCasadas}/${totalEscolas} casadas (${data.meta.inepStats.pctCasadas}%), ${totalSemMatch} sem match, ${totalAmbiguas} ambíguas`,
  );
  console.log(
    `[enrich-pse] estratégias: exato/mesma-dep=${stats.exatoMesmaDep}, exato/qualquer-dep=${stats.exatoQualquerDep}, core/mesma-dep=${stats.coreMesmaDep}, core/qualquer-dep=${stats.coreQualquerDep}`,
  );
})().catch((err) => {
  console.error("[enrich-pse] ERRO:", err);
  process.exit(1);
});
