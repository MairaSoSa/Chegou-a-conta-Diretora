import { db, sqlite } from "./db";
import { censoEscolar, indicadoresEducacionais, importacaoStatus } from "@shared/schema";
import { eq, and, like, sql } from "drizzle-orm";

const EXTERNAL_API = process.env.EXTERNAL_API_URL || "https://api-escolas.replit.app";

interface ImportProgress {
  running: boolean;
  currentTask: string | null;
  progress: { tipo: string; imported: number; total: number; pagesCompleted: number; totalPages: number }[];
  errors: string[];
  startedAt: number | null;
}

let importProgress: ImportProgress = {
  running: false,
  currentTask: null,
  progress: [],
  errors: [],
  startedAt: null,
};

export function getImportStatus() {
  return importProgress;
}

async function fetchJson(url: string, timeout = 15000): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

const INDICATOR_CONFIG: Record<string, { apiPath: string; anos: number[] }> = {
  censo_escolar: { apiPath: "censo-escolar", anos: [2024, 2023, 2022, 2021, 2020] },
  ideb: { apiPath: "ideb", anos: [2023, 2021, 2019] },
  icg: { apiPath: "icg", anos: [2024, 2023, 2022, 2021, 2020] },
  inse: { apiPath: "inse", anos: [2023, 2021] },
  tdi: { apiPath: "tdi", anos: [2024, 2023, 2022, 2021, 2020] },
  ird: { apiPath: "ird", anos: [2024, 2023, 2022, 2021, 2020] },
  taxas_rendimento: { apiPath: "taxa-rendimento", anos: [2024, 2023, 2022, 2021, 2020] },
  taxa_nao_resposta: { apiPath: "taxa-nao-resposta", anos: [2024, 2023, 2022, 2021, 2020] },
  saeb: { apiPath: "saeb", anos: [2023, 2021, 2019] },
  atu: { apiPath: "atu", anos: [2024, 2023, 2022, 2021, 2020] },
  had: { apiPath: "had", anos: [2024, 2023, 2022, 2021, 2020] },
  dsu: { apiPath: "dsu", anos: [2024, 2023, 2022, 2021, 2020] },
  afd: { apiPath: "afd", anos: [2024, 2023, 2022, 2021, 2020] },
};

export async function importFromExternalApi(tipos?: string[], anos?: number[]) {
  if (importProgress.running) return { error: "Importação já em andamento" };

  importProgress = { running: true, currentTask: null, progress: [], errors: [], startedAt: Date.now() };

  try {
    const tiposToImport = tipos || Object.keys(INDICATOR_CONFIG);

    for (const tipo of tiposToImport) {
      const config = INDICATOR_CONFIG[tipo];
      if (!config) {
        importProgress.errors.push(`Tipo desconhecido: ${tipo}`);
        continue;
      }

      const anosToImport = anos || config.anos;
      for (const ano of anosToImport) {
        importProgress.currentTask = `${tipo} ${ano}`;
        try {
          if (tipo === "censo_escolar") {
            await importCensoFromApi(ano);
          } else {
            await importIndicadorFromApi(tipo, config.apiPath, ano);
          }
        } catch (err: any) {
          importProgress.errors.push(`${tipo} ${ano}: ${err.message}`);
          console.error(`[Import] Error importing ${tipo} ${ano}:`, err.message);
        }
      }
    }
  } finally {
    importProgress.running = false;
    importProgress.currentTask = null;
  }

  return { success: true, progress: importProgress.progress, errors: importProgress.errors };
}

async function importCensoFromApi(ano: number) {
  let page = 1;
  let totalImported = 0;
  let totalRecords = 0;

  const updateStatus = (tipo: string, ano: number, status: string, imported: number, total: number) => {
    const existing = db.select().from(importacaoStatus)
      .where(and(eq(importacaoStatus.tipo, tipo), eq(importacaoStatus.ano, ano)))
      .get();
    const record = {
      tipo, ano, status,
      registrosImportados: imported,
      totalRegistros: total,
      erro: null,
      iniciadoEm: existing?.iniciadoEm || Date.now(),
      finalizadoEm: status === "completo" ? Date.now() : null,
    };
    if (existing) {
      db.update(importacaoStatus).set(record).where(eq(importacaoStatus.id, existing.id)).run();
    } else {
      db.insert(importacaoStatus).values(record).run();
    }
  };

  try {
    const firstPage = await fetchJson(
      `${EXTERNAL_API}/api/censo-escolar/${ano}/escolas?per_page=100&pagina=1`
    );
    totalRecords = firstPage.total || 0;
    if (totalRecords === 0) {
      updateStatus("censo_escolar", ano, "vazio", 0, 0);
      return;
    }

    const totalPages = firstPage.total_paginas || 1;
    updateStatus("censo_escolar", ano, "importando", 0, totalRecords);

    const processPage = (dados: any[]) => {
      for (const d of dados) {
        const inep = String(d.co_entidade);
        const existing = db.select().from(censoEscolar)
          .where(and(eq(censoEscolar.inep, inep), eq(censoEscolar.ano, ano)))
          .get();

        const record = {
          inep,
          ano,
          nome: d.no_entidade || null,
          municipio: d.no_municipio || null,
          uf: d.sg_uf || null,
          dependencia: d.ds_dependencia || null,
          localizacao: d.ds_localizacao || null,
          situacao: d.ds_situacao || null,
          matriculas: d.qt_matriculas || 0,
          docentes: d.qt_docentes || 0,
          turmas: d.qt_turmas || 0,
          dados: JSON.stringify(d),
          updatedAt: Date.now(),
        };

        if (existing) {
          db.update(censoEscolar).set(record).where(eq(censoEscolar.id, existing.id)).run();
        } else {
          db.insert(censoEscolar).values(record).run();
        }
        totalImported++;
      }
    };

    processPage(firstPage.dados || []);

    importProgress.progress = importProgress.progress.filter(p => p.tipo !== `censo_escolar_${ano}`);
    importProgress.progress.push({
      tipo: `censo_escolar_${ano}`,
      imported: totalImported,
      total: totalRecords,
      pagesCompleted: 1,
      totalPages,
    });

    for (page = 2; page <= Math.min(totalPages, 500); page++) {
      try {
        const data = await fetchJson(
          `${EXTERNAL_API}/api/censo-escolar/${ano}/escolas?per_page=100&pagina=${page}`
        );
        processPage(data.dados || []);

        importProgress.progress = importProgress.progress.filter(p => p.tipo !== `censo_escolar_${ano}`);
        importProgress.progress.push({
          tipo: `censo_escolar_${ano}`,
          imported: totalImported,
          total: totalRecords,
          pagesCompleted: page,
          totalPages,
        });

        if (page % 10 === 0) {
          console.log(`[Import] Censo ${ano}: ${totalImported}/${totalRecords} (page ${page}/${totalPages})`);
          updateStatus("censo_escolar", ano, "importando", totalImported, totalRecords);
        }
      } catch (err: any) {
        console.error(`[Import] Censo ${ano} page ${page} error:`, err.message);
        updateStatus("censo_escolar", ano, "erro", totalImported, totalRecords);
        break;
      }
    }

    updateStatus("censo_escolar", ano, "completo", totalImported, totalRecords);
    console.log(`[Import] Censo ${ano}: Completed ${totalImported} records`);
  } catch (err: any) {
    console.error(`[Import] Censo ${ano} failed:`, err.message);
    updateStatus("censo_escolar", ano, "erro", totalImported, totalRecords);
  }
}

async function importIndicadorFromApi(tipo: string, apiPath: string, ano: number) {
  let page = 1;
  let totalImported = 0;

  try {
    const firstPage = await fetchJson(
      `${EXTERNAL_API}/api/${apiPath}/${ano}/escolas?per_page=100&pagina=1`
    );
    const totalRecords = firstPage.total || 0;
    if (totalRecords === 0) return;

    const totalPages = firstPage.total_paginas || 1;

    const processPage = (dados: any[]) => {
      for (const d of dados) {
        const inep = String(d.co_entidade);
        const existing = db.select().from(indicadoresEducacionais)
          .where(and(
            eq(indicadoresEducacionais.inep, inep),
            eq(indicadoresEducacionais.ano, ano),
            eq(indicadoresEducacionais.tipo, tipo)
          ))
          .get();

        const record = {
          inep, ano, tipo,
          dados: JSON.stringify(d),
          updatedAt: Date.now(),
        };

        if (existing) {
          db.update(indicadoresEducacionais).set(record).where(eq(indicadoresEducacionais.id, existing.id)).run();
        } else {
          db.insert(indicadoresEducacionais).values(record).run();
        }
        totalImported++;
      }
    };

    processPage(firstPage.dados || []);

    importProgress.progress = importProgress.progress.filter(p => p.tipo !== `${tipo}_${ano}`);
    importProgress.progress.push({
      tipo: `${tipo}_${ano}`,
      imported: totalImported,
      total: totalRecords,
      pagesCompleted: 1,
      totalPages,
    });

    for (page = 2; page <= Math.min(totalPages, 500); page++) {
      try {
        const data = await fetchJson(
          `${EXTERNAL_API}/api/${apiPath}/${ano}/escolas?per_page=100&pagina=${page}`
        );
        processPage(data.dados || []);

        importProgress.progress = importProgress.progress.filter(p => p.tipo !== `${tipo}_${ano}`);
        importProgress.progress.push({
          tipo: `${tipo}_${ano}`,
          imported: totalImported,
          total: totalRecords,
          pagesCompleted: page,
          totalPages,
        });
      } catch {
        break;
      }
    }

    console.log(`[Import] ${tipo} ${ano}: Completed ${totalImported} records`);
  } catch (err: any) {
    console.error(`[Import] ${tipo} ${ano} failed:`, err.message);
  }
}

export function searchSchoolsLocal(query: string, limit = 20) {
  const isInep = /^\d{7,8}$/.test(query.trim());
  const rawDb = db.$client as any;

  if (isInep) {
    const results = rawDb.prepare(
      `SELECT * FROM censo_escolar WHERE inep = ? ORDER BY ano DESC LIMIT 1`
    ).all(query.trim());
    return results.map(mapCensoToSchool);
  }

  // Tenta FTS5 primeiro (muito mais rápido que LIKE)
  try {
    const ftsReady = (rawDb.prepare("SELECT COUNT(*) as n FROM escola_fts").get() as any)?.n > 0;
    if (ftsReady) {
      const words = query.trim().split(/\s+/).filter(Boolean);
      const matchExpr = words.map(w => w.replace(/['"*]/g, "") + "*").join(" ");
      const results = rawDb.prepare(
        `SELECT inep, nome, municipio, uf, dependencia, localizacao, matriculas
         FROM escola_fts WHERE escola_fts MATCH ? ORDER BY rank LIMIT ?`
      ).all(matchExpr, limit);
      return results.map((r: any) => ({
        id: parseInt(r.inep) || 0,
        inep: r.inep,
        name: r.nome || "Sem nome",
        city: r.municipio || "",
        state: r.uf || "",
        network: r.dependencia || "",
        location: r.localizacao || "",
        enrollmentCount: r.matriculas || 0,
        dataStatus: "Local",
      }));
    }
  } catch {}

  // Fallback LIKE (lento, usado apenas se FTS não estiver pronto)
  const upperQuery = query.toUpperCase();
  const latestAno = rawDb.prepare(`SELECT MAX(ano) as max_ano FROM censo_escolar`).get() as any;
  const ano = latestAno?.max_ano || 2024;
  const results = rawDb.prepare(
    `SELECT * FROM censo_escolar WHERE ano = ? AND upper(nome) LIKE ? LIMIT ?`
  ).all(ano, '%' + upperQuery + '%', limit);
  return results.map(mapCensoToSchool);
}

function mapCensoToSchool(c: any) {
  return {
    id: parseInt(c.inep) || 0,
    inep: c.inep,
    name: c.nome || "Sem nome",
    city: c.municipio || "",
    state: c.uf || "",
    network: c.dependencia || "",
    location: c.localizacao || "",
    enrollmentCount: c.matriculas || 0,
    dataStatus: "Local",
  };
}

export function getEscolaCompletaLocal(inep: string, ano: number) {
  let censo = db.select().from(censoEscolar)
    .where(and(eq(censoEscolar.inep, inep), eq(censoEscolar.ano, ano)))
    .get();

  if (!censo) {
    const anyCenso = db.select().from(censoEscolar)
      .where(eq(censoEscolar.inep, inep))
      .limit(1)
      .all();
    if (anyCenso.length > 0) {
      censo = anyCenso[0];
    }
  }

  const allCensoYears = db.select({ ano: censoEscolar.ano }).from(censoEscolar)
    .where(eq(censoEscolar.inep, inep))
    .all()
    .map(r => String(r.ano));

  const allIndicatorYears = db.select({ ano: indicadoresEducacionais.ano }).from(indicadoresEducacionais)
    .where(eq(indicadoresEducacionais.inep, inep))
    .all()
    .map(r => String(r.ano));

  const anosDisponiveis = [...new Set([...allCensoYears, ...allIndicatorYears])].sort();

  const indicadores = db.select().from(indicadoresEducacionais)
    .where(and(eq(indicadoresEducacionais.inep, inep), eq(indicadoresEducacionais.ano, ano)))
    .all();

  const result: any = {
    co_entidade: parseInt(inep),
    anos_disponiveis: anosDisponiveis,
    ano_selecionado: ano,
  };

  if (censo) {
    const censoFull = censo.dados ? JSON.parse(censo.dados) : {};
    // Suporte aos dois formatos: antigo (campos aninhados) e novo 2025 (campos planos)
    result.censo_escolar = {
      ...censoFull,
      no_entidade: censo.nome || censoFull.no_entidade,
      qt_mat_bas: censo.matriculas || censoFull.qt_mat_bas || censoFull.quantidades?.qt_matriculas || censoFull.qt_matriculas,
      qt_mat_inf: censoFull.qt_mat_inf ?? censoFull.matriculas_por_etapa?.infantil,
      qt_mat_inf_cre: censoFull.qt_mat_inf_cre,
      qt_mat_inf_pre: censoFull.qt_mat_inf_pre,
      qt_mat_fund: censoFull.qt_mat_fund,
      qt_mat_fund_ai: censoFull.qt_mat_fund_ai ?? censoFull.matriculas_por_etapa?.fundamental_ai,
      qt_mat_fund_af: censoFull.qt_mat_fund_af ?? censoFull.matriculas_por_etapa?.fundamental_af,
      qt_mat_med: censoFull.qt_mat_med ?? censoFull.matriculas_por_etapa?.medio,
      qt_mat_eja: censoFull.qt_mat_eja ?? censoFull.matriculas_por_etapa?.eja,
      qt_mat_esp: censoFull.qt_mat_esp ?? censoFull.matriculas_por_etapa?.especial,
      qt_mat_bas_fem: censoFull.qt_mat_bas_fem,
      qt_mat_bas_masc: censoFull.qt_mat_bas_masc,
      qt_doc_bas: censo.docentes || censoFull.qt_doc_bas,
      qt_docentes: censo.docentes || censoFull.qt_doc_bas || censoFull.quantidades?.qt_docentes,
      qt_tur_bas: censo.turmas || censoFull.qt_tur_bas,
      qt_turmas: censo.turmas || censoFull.qt_tur_bas || censoFull.quantidades?.qt_turmas,
      qt_salas_utilizadas: censoFull.qt_salas_utilizadas ?? censoFull.quantidades?.qt_salas_utilizadas,
      qt_salas_utiliza_climatizadas: censoFull.qt_salas_utiliza_climatizadas,
      qt_salas_utilizadas_acessiveis: censoFull.qt_salas_utilizadas_acessiveis,
      tp_dependencia_texto: censo.dependencia || censoFull.caracteristicas?.ds_dependencia,
      tp_localizacao_texto: censo.localizacao || censoFull.caracteristicas?.ds_localizacao,
      tp_situacao_texto: censo.situacao || censoFull.caracteristicas?.ds_situacao,
      // Internet — formato plano (2025) ou aninhado (legado)
      in_internet: censoFull.in_internet ?? censoFull.infraestrutura?.in_internet,
      in_internet_alunos: censoFull.in_internet_alunos,
      in_banda_larga: censoFull.in_banda_larga,
      // Infraestrutura — formato plano (2025) sobrescreve infraestrutura aninhada
      infraestrutura: censoFull.infraestrutura || null,
      no_municipio: censo.municipio || censoFull.localizacao?.no_municipio,
      sg_uf: censo.uf || censoFull.localizacao?.sg_uf,
      ds_endereco: censoFull.ds_endereco,
      co_cep: censoFull.co_cep,
      telefone: censoFull.telefone,
      tempo_integral: censoFull.tempo_integral,
    };
  }

  for (const ind of indicadores) {
    const dados = ind.dados ? JSON.parse(ind.dados) : {};
    result[ind.tipo] = dados;
  }

  return Object.keys(result).length > 3 ? result : null;
}

export function getEscolaEvolucaoLocal(inep: string) {
  const censoRecords = db.select().from(censoEscolar)
    .where(eq(censoEscolar.inep, inep))
    .all();

  if (censoRecords.length === 0) return null;

  const indicadorRecords = db.select().from(indicadoresEducacionais)
    .where(eq(indicadoresEducacionais.inep, inep))
    .all();

  const anosSet = new Set<number>();
  censoRecords.forEach(r => anosSet.add(r.ano));
  indicadorRecords.forEach(r => anosSet.add(r.ano));
  const anos = [...anosSet].sort();

  const censoByYear: Record<number, any> = {};
  for (const c of censoRecords) {
    const dados = c.dados ? JSON.parse(c.dados) : {};
    censoByYear[c.ano] = {
      ...dados,
      no_entidade: c.nome || dados.no_entidade,
      // Totais — colunas diretas têm prioridade (mais confiáveis que o JSON)
      qt_mat_bas: c.matriculas || dados.qt_mat_bas,
      qt_doc_bas: c.docentes || dados.qt_doc_bas,
      qt_docentes: c.docentes || dados.qt_doc_bas || dados.qt_docentes,
      qt_tur_bas: c.turmas || dados.qt_tur_bas,
      qt_turmas: c.turmas || dados.qt_tur_bas || dados.qt_turmas,
      qt_salas_utilizadas: dados.qt_salas_utilizadas,
      qt_salas_utiliza_climatizadas: dados.qt_salas_utiliza_climatizadas,
      qt_salas_utilizadas_acessiveis: dados.qt_salas_utilizadas_acessiveis,
      // Internet — plano (2025) ou aninhado (legado)
      in_internet: dados.in_internet ?? dados.infraestrutura?.in_internet,
      tp_dependencia_texto: c.dependencia,
      tp_localizacao_texto: c.localizacao,
      tp_situacao_texto: c.situacao,
      no_municipio: c.municipio,
      sg_uf: c.uf,
      ds_endereco: dados.ds_endereco,
      telefone: dados.telefone,
    };
  }

  const indicadoresByYear: Record<number, Record<string, any>> = {};
  for (const ind of indicadorRecords) {
    if (!indicadoresByYear[ind.ano]) indicadoresByYear[ind.ano] = {};
    indicadoresByYear[ind.ano][ind.tipo] = ind.dados ? JSON.parse(ind.dados) : {};
  }

  const latestAno = anos[anos.length - 1];
  const latestCenso = censoByYear[latestAno] || censoByYear[anos[0]];

  return {
    co_entidade: parseInt(inep),
    anos_disponiveis: anos,
    escola: {
      no_entidade: latestCenso?.no_entidade,
      no_municipio: latestCenso?.no_municipio,
      sg_uf: latestCenso?.sg_uf,
      ds_dependencia: latestCenso?.ds_dependencia || latestCenso?.tp_dependencia_texto,
      ds_localizacao: latestCenso?.ds_localizacao || latestCenso?.tp_localizacao_texto,
      ds_situacao: latestCenso?.ds_situacao || latestCenso?.tp_situacao_texto,
    },
    censo_por_ano: censoByYear,
    indicadores_por_ano: indicadoresByYear,
  };
}

async function fetchJsonSafe(url: string, timeout = 8000): Promise<any | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getEscolaEvolucaoCompleta(inep: string) {
  const localData = getEscolaEvolucaoLocal(inep);

  const censoByYear: Record<number, any> = localData?.censo_por_ano || {};
  const indicadoresByYear: Record<number, Record<string, any>> = localData?.indicadores_por_ano || {};
  let escolaInfo = localData?.escola || null;

  const indicatorEndpoints: { tipo: string; apiPath: string; anos: number[] }[] = [
    { tipo: "censo_escolar", apiPath: "censo-escolar", anos: [2020, 2021, 2022, 2023, 2024] },
    { tipo: "icg", apiPath: "icg", anos: [2020, 2021, 2022, 2023, 2024] },
    { tipo: "tdi", apiPath: "tdi", anos: [2020, 2021, 2022, 2023, 2024] },
    { tipo: "taxas_rendimento", apiPath: "taxa-rendimento", anos: [2020, 2021, 2022, 2023, 2024] },
    { tipo: "ird", apiPath: "ird", anos: [2020, 2021, 2022, 2023, 2024] },
    { tipo: "ideb", apiPath: "ideb", anos: [2019, 2021, 2023] },
    { tipo: "inse", apiPath: "inse", anos: [2021, 2023] },
    { tipo: "atu", apiPath: "atu", anos: [2020, 2021, 2022, 2023, 2024] },
    { tipo: "had", apiPath: "had", anos: [2020, 2021, 2022, 2023, 2024] },
    { tipo: "dsu", apiPath: "dsu", anos: [2020, 2021, 2022, 2023, 2024] },
    { tipo: "afd", apiPath: "afd", anos: [2020, 2021, 2022, 2023, 2024] },
    { tipo: "ied", apiPath: "ied", anos: [2020, 2021, 2022, 2023, 2024] },
    { tipo: "taxa_nao_resposta", apiPath: "taxa-nao-resposta", anos: [2020, 2021, 2022, 2023, 2024] },
    { tipo: "saeb", apiPath: "saeb", anos: [2019, 2021, 2023] },
  ];

  const fetchTasks: Promise<void>[] = [];
  for (const ep of indicatorEndpoints) {
    for (const ano of ep.anos) {
      if (ep.tipo === "censo_escolar" && censoByYear[ano]) continue;
      if (ep.tipo !== "censo_escolar" && indicadoresByYear[ano]?.[ep.tipo]) continue;

      fetchTasks.push(
        fetchJsonSafe(`${EXTERNAL_API}/api/${ep.apiPath}/${ano}/escolas/${inep}`).then(data => {
          if (!data) return;
          if (ep.tipo === "censo_escolar") {
            censoByYear[ano] = {
              ...data,
              no_entidade: data.no_entidade,
              qt_mat_bas: data.quantidades?.qt_matriculas || data.qt_matriculas || data.qt_mat_bas,
              qt_doc_bas: data.quantidades?.qt_docentes || data.qt_docentes || data.qt_doc_bas,
              qt_tur_bas: data.quantidades?.qt_turmas || data.qt_turmas || data.qt_tur_bas,
              qt_docentes: data.quantidades?.qt_docentes || data.qt_docentes,
              qt_turmas: data.quantidades?.qt_turmas || data.qt_turmas,
              qt_salas_utilizadas: data.quantidades?.qt_salas_utilizadas || data.qt_salas_utilizadas,
              no_municipio: data.localizacao?.no_municipio || data.no_municipio,
              sg_uf: data.localizacao?.sg_uf || data.sg_uf,
              ds_dependencia: data.caracteristicas?.ds_dependencia || data.ds_dependencia,
              ds_localizacao: data.caracteristicas?.ds_localizacao || data.ds_localizacao,
              ds_situacao: data.caracteristicas?.ds_situacao || data.ds_situacao,
            };
            if (!escolaInfo) {
              escolaInfo = {
                no_entidade: censoByYear[ano].no_entidade,
                no_municipio: censoByYear[ano].no_municipio,
                sg_uf: censoByYear[ano].sg_uf,
                ds_dependencia: censoByYear[ano].ds_dependencia,
                ds_localizacao: censoByYear[ano].ds_localizacao,
                ds_situacao: censoByYear[ano].ds_situacao,
              };
            }
          } else {
            if (!indicadoresByYear[ano]) indicadoresByYear[ano] = {};
            indicadoresByYear[ano][ep.tipo] = data;
          }
        })
      );
    }
  }

  await Promise.all(fetchTasks);

  const anosSet = new Set<number>();
  Object.keys(censoByYear).forEach(a => anosSet.add(parseInt(a)));
  Object.keys(indicadoresByYear).forEach(a => anosSet.add(parseInt(a)));
  const anos = [...anosSet].sort();

  if (anos.length === 0 && !escolaInfo) return null;

  if (!escolaInfo && Object.keys(censoByYear).length > 0) {
    const latestAno = anos[anos.length - 1];
    const c = censoByYear[latestAno];
    escolaInfo = {
      no_entidade: c?.no_entidade,
      no_municipio: c?.no_municipio,
      sg_uf: c?.sg_uf,
      ds_dependencia: c?.ds_dependencia || c?.tp_dependencia_texto,
      ds_localizacao: c?.ds_localizacao || c?.tp_localizacao_texto,
      ds_situacao: c?.ds_situacao || c?.tp_situacao_texto,
    };
  }

  return {
    co_entidade: parseInt(inep),
    anos_disponiveis: anos,
    escola: escolaInfo,
    censo_por_ano: censoByYear,
    indicadores_por_ano: indicadoresByYear,
  };
}

export function getLocalSchoolCount() {
  const result = db.select({ count: sql<number>`count(*)` }).from(censoEscolar).get();
  return result?.count || 0;
}

export function getLocalStats() {
  const cached = getStatsCache('local_stats');
  if (cached) return cached;

  const censoCount = db.select({ count: sql<number>`count(*)` }).from(censoEscolar).get()?.count || 0;

  const indicadorCounts: Record<string, number> = {};
  for (const tipo of Object.keys(INDICATOR_CONFIG)) {
    if (tipo === "censo_escolar") continue;
    const result = db.select({ count: sql<number>`count(*)` }).from(indicadoresEducacionais)
      .where(eq(indicadoresEducacionais.tipo, tipo))
      .get();
    indicadorCounts[tipo] = result?.count || 0;
  }

  const importHistory = db.select().from(importacaoStatus).all();

  const result = {
    censo_escolar: censoCount,
    indicadores: indicadorCounts,
    importHistory,
    disponivel: INDICATOR_CONFIG,
  };
  setStatsCache('local_stats', result);
  return result;
}

export function invalidateStatsCache() {
  try {
    sqlite.prepare(`DELETE FROM stats_cache`).run();
  } catch {}
}

export async function importSingleSchoolFromApi(inep: string) {
  try {
    const data = await fetchJson(`${EXTERNAL_API}/api/escola/${inep}?ano=2024`, 10000);
    if (data.erro) return null;

    const anos = data.anos_disponiveis || [];
    for (const anoStr of anos) {
      const ano = parseInt(anoStr);
      const anoData = data.dados?.[anoStr];
      if (!anoData) continue;

      if (anoData.censo_escolar) {
        const c = anoData.censo_escolar;
        const existing = db.select().from(censoEscolar)
          .where(and(eq(censoEscolar.inep, inep), eq(censoEscolar.ano, ano)))
          .get();

        const record = {
          inep,
          ano,
          nome: c.no_entidade || null,
          municipio: c.localizacao?.no_municipio || null,
          uf: c.localizacao?.sg_uf || null,
          dependencia: c.caracteristicas?.ds_dependencia || null,
          localizacao: c.caracteristicas?.ds_localizacao || null,
          situacao: c.caracteristicas?.ds_situacao || null,
          matriculas: c.quantidades?.qt_matriculas || 0,
          docentes: c.quantidades?.qt_docentes || 0,
          turmas: c.quantidades?.qt_turmas || 0,
          dados: JSON.stringify(c),
          updatedAt: Date.now(),
        };

        if (existing) {
          db.update(censoEscolar).set(record).where(eq(censoEscolar.id, existing.id)).run();
        } else {
          db.insert(censoEscolar).values(record).run();
        }
      }

      const indicatorTypes = ["ideb", "icg", "inse", "tdi", "ird", "taxas_rendimento", "taxa_nao_resposta", "saeb"];
      for (const tipo of indicatorTypes) {
        if (anoData[tipo]) {
          const existing = db.select().from(indicadoresEducacionais)
            .where(and(
              eq(indicadoresEducacionais.inep, inep),
              eq(indicadoresEducacionais.ano, ano),
              eq(indicadoresEducacionais.tipo, tipo)
            ))
            .get();

          const record = {
            inep, ano, tipo,
            dados: JSON.stringify(anoData[tipo]),
            updatedAt: Date.now(),
          };

          if (existing) {
            db.update(indicadoresEducacionais).set(record).where(eq(indicadoresEducacionais.id, existing.id)).run();
          } else {
            db.insert(indicadoresEducacionais).values(record).run();
          }
        }
      }
    }

    return data;
  } catch (err: any) {
    console.error(`[Import Single] Error for ${inep}:`, err.message);
    return null;
  }
}

export function listCensoEscolar(ano: number, filters: Record<string, string> = {}, page = 1, perPage = 20) {
  const depMap: Record<string, string> = { "1": "Federal", "2": "Estadual", "3": "Municipal", "4": "Privada" };
  const locMap: Record<string, string> = { "1": "Urbana", "2": "Rural" };
  const sitMap: Record<string, string> = { "1": "Em Atividade", "2": "Paralisada", "3": "Extinta" };

  const conditions: any[] = [eq(censoEscolar.ano, ano)];
  if (filters.uf) conditions.push(sql`upper(${censoEscolar.uf}) = ${filters.uf.toUpperCase()}`);
  if (filters.municipio) conditions.push(sql`upper(${censoEscolar.municipio}) LIKE ${'%' + filters.municipio.toUpperCase() + '%'}`);
  if (filters.nome) conditions.push(sql`upper(${censoEscolar.nome}) LIKE ${'%' + filters.nome.toUpperCase() + '%'}`);
  if (filters.tp_dependencia) {
    const depText = depMap[filters.tp_dependencia] || filters.tp_dependencia;
    conditions.push(eq(censoEscolar.dependencia, depText));
  }
  if (filters.tp_localizacao) {
    const locText = locMap[filters.tp_localizacao] || filters.tp_localizacao;
    conditions.push(eq(censoEscolar.localizacao, locText));
  }
  if (filters.tp_situacao) {
    const sitText = sitMap[filters.tp_situacao] || filters.tp_situacao;
    conditions.push(eq(censoEscolar.situacao, sitText));
  }

  const whereClause = and(...conditions);
  const countResult = db.select({ count: sql<number>`count(*)` }).from(censoEscolar).where(whereClause).get();
  const total = countResult?.count || 0;
  const totalPages = Math.ceil(total / perPage);
  const offset = (page - 1) * perPage;

  const pageRows = db.select().from(censoEscolar)
    .where(whereClause)
    .limit(perPage)
    .offset(offset)
    .all();

  return {
    ano,
    dados: pageRows.map(r => {
      const full = r.dados ? JSON.parse(r.dados) : {};
      return {
        co_entidade: parseInt(r.inep),
        no_entidade: r.nome,
        no_municipio: r.municipio,
        sg_uf: r.uf,
        ds_dependencia: r.dependencia,
        ds_localizacao: r.localizacao,
        ds_situacao: r.situacao,
        qt_matriculas: r.matriculas,
        qt_docentes: r.docentes,
        qt_turmas: r.turmas,
        ...full,
      };
    }),
    total,
    total_paginas: totalPages,
    pagina: page,
    por_pagina: perPage,
    filtros_disponiveis: {
      uf: "Sigla do estado (ex: SP, RJ)",
      municipio: "Nome do municipio (busca parcial)",
      nome: "Nome da escola (busca parcial)",
      tp_dependencia: "1=Federal, 2=Estadual, 3=Municipal, 4=Privada",
      tp_localizacao: "1=Urbana, 2=Rural",
      tp_situacao: "1=Em Atividade, 2=Paralisada, 3=Extinta",
    },
  };
}

export function getCensoEscolarDetail(ano: number, inep: string) {
  const row = db.select().from(censoEscolar)
    .where(and(eq(censoEscolar.inep, inep), eq(censoEscolar.ano, ano)))
    .get();
  if (!row) return null;
  const full = row.dados ? JSON.parse(row.dados) : {};
  return {
    co_entidade: parseInt(row.inep),
    no_entidade: row.nome,
    ano: row.ano,
    ...full,
  };
}

function getStatsCache(key: string): any | null {
  try {
    const row = sqlite.prepare(`SELECT data, updated_at FROM stats_cache WHERE cache_key = ?`).get(key) as any;
    if (row && (Date.now() - row.updated_at) < 24 * 60 * 60 * 1000) {
      return JSON.parse(row.data);
    }
  } catch {}
  return null;
}

function setStatsCache(key: string, data: any): void {
  try {
    sqlite.prepare(`INSERT OR REPLACE INTO stats_cache (cache_key, data, updated_at) VALUES (?, ?, ?)`).run(key, JSON.stringify(data), Date.now());
  } catch {}
}

export function getCensoEstatisticas(ano: number) {
  const cacheKey = `censo_stats_${ano}`;
  const cached = getStatsCache(cacheKey);
  if (cached) return cached;

  const row = sqlite.prepare(`SELECT count(*) as total_escolas, coalesce(sum(matriculas),0) as total_matriculas, coalesce(sum(docentes),0) as total_docentes, coalesce(sum(turmas),0) as total_turmas FROM censo_escolar WHERE ano = ?`).get(ano) as any;
  const groupByRaw = (col: string) => {
    const rows = sqlite.prepare(`SELECT ${col} as key, count(*) as count FROM censo_escolar WHERE ano = ? AND ${col} IS NOT NULL GROUP BY ${col}`).all(ano) as any[];
    const result: Record<string, number> = {};
    for (const r of rows) result[r.key] = r.count;
    return result;
  };
  const result = {
    ano,
    total_escolas: row?.total_escolas || 0,
    total_matriculas: row?.total_matriculas || 0,
    total_docentes: row?.total_docentes || 0,
    total_turmas: row?.total_turmas || 0,
    por_dependencia: groupByRaw('dependencia'),
    por_localizacao: groupByRaw('localizacao'),
    por_uf: groupByRaw('uf'),
    por_situacao: groupByRaw('situacao'),
  };
  setStatsCache(cacheKey, result);
  return result;
}

export function listIndicador(tipo: string, ano: number, filters: Record<string, string> = {}, page = 1, perPage = 20) {
  const conditions: any[] = [
    eq(indicadoresEducacionais.tipo, tipo),
    eq(indicadoresEducacionais.ano, ano),
  ];

  const needsJoin = filters.nome || filters.uf || filters.municipio;

  if (needsJoin) {
    if (filters.uf) {
      conditions.push(sql`EXISTS (SELECT 1 FROM censo_escolar c WHERE c.inep = ${indicadoresEducacionais.inep} AND c.ano = ${ano} AND upper(c.uf) = ${filters.uf.toUpperCase()})`);
    }
    if (filters.municipio) {
      conditions.push(sql`EXISTS (SELECT 1 FROM censo_escolar c WHERE c.inep = ${indicadoresEducacionais.inep} AND c.ano = ${ano} AND upper(c.municipio) LIKE ${'%' + filters.municipio.toUpperCase() + '%'})`);
    }
    if (filters.nome) {
      conditions.push(sql`EXISTS (SELECT 1 FROM censo_escolar c WHERE c.inep = ${indicadoresEducacionais.inep} AND c.ano = ${ano} AND upper(c.nome) LIKE ${'%' + filters.nome.toUpperCase() + '%'})`);
    }
  }

  const whereClause = and(...conditions);
  const countResult = db.select({ count: sql<number>`count(*)` }).from(indicadoresEducacionais).where(whereClause).get();
  const total = countResult?.count || 0;
  const totalPages = Math.ceil(total / perPage);
  const offset = (page - 1) * perPage;

  const pageRows = db.select().from(indicadoresEducacionais)
    .where(whereClause)
    .limit(perPage)
    .offset(offset)
    .all();

  return {
    ano,
    dados: pageRows.map(r => {
      const dados = r.dados ? JSON.parse(r.dados) : {};
      return { co_entidade: parseInt(r.inep), ...dados };
    }),
    total,
    total_paginas: totalPages,
    pagina: page,
    por_pagina: perPage,
  };
}

export function getIndicadorDetail(tipo: string, ano: number, inep: string) {
  const row = db.select().from(indicadoresEducacionais)
    .where(and(
      eq(indicadoresEducacionais.tipo, tipo),
      eq(indicadoresEducacionais.ano, ano),
      eq(indicadoresEducacionais.inep, inep)
    ))
    .get();
  if (!row) return null;
  const dados = row.dados ? JSON.parse(row.dados) : {};
  return { co_entidade: parseInt(row.inep), ano: row.ano, ...dados };
}

export function getEscolaCompleta(inep: string) {
  const censoRows = db.select().from(censoEscolar)
    .where(eq(censoEscolar.inep, inep))
    .all();

  const indRows = db.select().from(indicadoresEducacionais)
    .where(eq(indicadoresEducacionais.inep, inep))
    .all();

  if (censoRows.length === 0 && indRows.length === 0) return null;

  const allYears = new Set<string>();
  censoRows.forEach(r => allYears.add(String(r.ano)));
  indRows.forEach(r => allYears.add(String(r.ano)));

  const anosDisponiveis = [...allYears].sort();

  const dados: Record<string, any> = {};
  for (const anoStr of anosDisponiveis) {
    const ano = parseInt(anoStr);
    const anoData: any = {};

    const censo = censoRows.find(r => r.ano === ano);
    if (censo) {
      anoData.censo_escolar = censo.dados ? JSON.parse(censo.dados) : {};
    }

    const yearInds = indRows.filter(r => r.ano === ano);
    for (const ind of yearInds) {
      anoData[ind.tipo] = ind.dados ? JSON.parse(ind.dados) : {};
    }

    if (Object.keys(anoData).length > 0) {
      dados[anoStr] = anoData;
    }
  }

  return {
    co_entidade: parseInt(inep),
    anos_disponiveis: anosDisponiveis,
    dados,
  };
}

export function getApiInfo() {
  const stats = getLocalStats();
  return {
    name: "api-escolas",
    version: "2.0.0-local",
    description: "API de informações educacionais - Dados locais integrados do INEP",
    dados_disponiveis: {
      censo_escolar: {
        anos: INDICATOR_CONFIG.censo_escolar.anos,
        fonte: "INEP - Instituto Nacional de Estudos e Pesquisas Educacionais",
        registros_locais: stats.censo_escolar,
      },
      ideb: {
        anos: INDICATOR_CONFIG.ideb.anos,
        descricao: "Notas SAEB, Indicador de Rendimento e IDEB por etapa",
        fonte: "INEP - Indice de Desenvolvimento da Educacao Basica",
        registros_locais: stats.indicadores.ideb || 0,
      },
      icg: {
        anos: INDICATOR_CONFIG.icg.anos,
        descricao: "Classificacao das escolas em 6 niveis de complexidade de gestao",
        fonte: "INEP - Indicador de Complexidade de Gestao da Escola",
        registros_locais: stats.indicadores.icg || 0,
      },
      inse: {
        anos: INDICATOR_CONFIG.inse.anos,
        descricao: "Nivel socioeconomico das escolas",
        fonte: "INEP - Indicador de Nivel Socioeconomico",
        registros_locais: stats.indicadores.inse || 0,
      },
      tdi: {
        anos: INDICATOR_CONFIG.tdi.anos,
        descricao: "Percentual de alunos com idade superior a recomendada",
        fonte: "INEP - Taxa de Distorcao Idade-Serie",
        registros_locais: stats.indicadores.tdi || 0,
      },
      ird: {
        anos: INDICATOR_CONFIG.ird.anos,
        descricao: "Media do indicador de regularidade do corpo docente",
        fonte: "INEP - Indicador de Regularidade do Corpo Docente",
        registros_locais: stats.indicadores.ird || 0,
      },
      taxas_rendimento: {
        anos: INDICATOR_CONFIG.taxas_rendimento.anos,
        descricao: "Taxas de Aprovacao, Reprovacao e Abandono Escolar",
        fonte: "INEP - Indicadores Educacionais",
        registros_locais: stats.indicadores.taxas_rendimento || 0,
      },
      taxa_nao_resposta: {
        anos: INDICATOR_CONFIG.taxa_nao_resposta.anos,
        descricao: "Percentual de alunos sem informacao de rendimento",
        fonte: "INEP - Indicadores Educacionais",
        registros_locais: stats.indicadores.taxa_nao_resposta || 0,
      },
      atu: {
        anos: INDICATOR_CONFIG.atu.anos,
        descricao: "Media de alunos por turma",
        fonte: "INEP - Indicadores Educacionais",
        registros_locais: stats.indicadores.atu || 0,
      },
      had: {
        anos: INDICATOR_CONFIG.had.anos,
        descricao: "Media de horas-aula diarias",
        fonte: "INEP - Indicadores Educacionais",
        registros_locais: stats.indicadores.had || 0,
      },
      dsu: {
        anos: INDICATOR_CONFIG.dsu.anos,
        descricao: "Percentual de docentes com formacao superior",
        fonte: "INEP - Indicadores Educacionais",
        registros_locais: stats.indicadores.dsu || 0,
      },
      afd: {
        anos: INDICATOR_CONFIG.afd.anos,
        descricao: "Percentual de docentes com formacao adequada",
        fonte: "INEP - Indicadores Educacionais",
        registros_locais: stats.indicadores.afd || 0,
      },
    },
    endpoints: {
      info: "GET /",
      health: "GET /health",
      escola_completa: "GET /api/escola/{co_entidade}",
      escola_busca: "GET /api/escola/buscar?nome={nome}",
      escolas_lista: "GET /api/censo-escolar/{ano}/escolas",
      escola_detalhe: "GET /api/censo-escolar/{ano}/escolas/{co_entidade}",
      estatisticas: "GET /api/censo-escolar/{ano}/escolas/estatisticas",
      ideb_lista: "GET /api/ideb/{ano}/escolas",
      ideb_detalhe: "GET /api/ideb/{ano}/escolas/{co_entidade}",
      icg_lista: "GET /api/icg/{ano}/escolas",
      icg_detalhe: "GET /api/icg/{ano}/escolas/{co_entidade}",
      inse_lista: "GET /api/inse/{ano}/escolas",
      inse_detalhe: "GET /api/inse/{ano}/escolas/{co_entidade}",
      tdi_lista: "GET /api/tdi/{ano}/escolas",
      tdi_detalhe: "GET /api/tdi/{ano}/escolas/{co_entidade}",
      ird_lista: "GET /api/ird/{ano}/escolas",
      ird_detalhe: "GET /api/ird/{ano}/escolas/{co_entidade}",
      taxas_lista: "GET /api/taxa-rendimento/{ano}/escolas",
      taxas_detalhe: "GET /api/taxa-rendimento/{ano}/escolas/{co_entidade}",
      tnr_lista: "GET /api/taxa-nao-resposta/{ano}/escolas",
      tnr_detalhe: "GET /api/taxa-nao-resposta/{ano}/escolas/{co_entidade}",
      atu_lista: "GET /api/atu/{ano}/escolas",
      atu_detalhe: "GET /api/atu/{ano}/escolas/{co_entidade}",
      had_lista: "GET /api/had/{ano}/escolas",
      had_detalhe: "GET /api/had/{ano}/escolas/{co_entidade}",
      dsu_lista: "GET /api/dsu/{ano}/escolas",
      dsu_detalhe: "GET /api/dsu/{ano}/escolas/{co_entidade}",
      afd_lista: "GET /api/afd/{ano}/escolas",
      afd_detalhe: "GET /api/afd/{ano}/escolas/{co_entidade}",
      importar_tipo: "POST /api/{tipo}/importar?ano={ano}",
      importar_ideb: "POST /api/admin/importar-ideb",
      importar_inse: "POST /api/admin/importar-inse",
      admin_importar: "POST /api/admin/importar",
      admin_status: "GET /api/admin/importar-status",
    },
  };
}

export function getMediasNacionais(ano?: number) {
  const cacheKey = `medias_nacionais_${ano || 'latest'}`;
  const cached = getStatsCache(cacheKey);
  if (cached) return cached;

  const tiposParaMedias = ['ideb', 'taxas_rendimento', 'tdi', 'atu', 'had', 'afd', 'dsu', 'ird', 'icg', 'inse'];
  const result: Record<string, any> = {};

  for (const tipo of tiposParaMedias) {
    const anoQuery = ano
      ? sqlite.prepare(`SELECT dados FROM indicadores_educacionais WHERE tipo = ? AND ano = ?`).all(tipo, ano) as any[]
      : sqlite.prepare(`SELECT dados FROM indicadores_educacionais WHERE tipo = ? AND ano = (SELECT MAX(ano) FROM indicadores_educacionais WHERE tipo = ?)`).all(tipo, tipo) as any[];

    if (anoQuery.length === 0) continue;

    const avgFields: Record<string, { sum: number; count: number }> = {};
    let totalParsed = 0;
    for (const r of anoQuery) {
      const d = r.dados ? JSON.parse(r.dados) : null;
      if (!d) continue;
      totalParsed++;
      for (const [k, v] of Object.entries(d)) {
        if (typeof v === 'number' && !isNaN(v) && k !== 'co_entidade' && k !== 'ano') {
          if (!avgFields[k]) avgFields[k] = { sum: 0, count: 0 };
          avgFields[k].sum += v;
          avgFields[k].count += 1;
        }
      }
    }

    if (totalParsed === 0) continue;

    const averages: Record<string, number> = {};
    for (const [k, v] of Object.entries(avgFields)) {
      if (v.count > 0) averages[k] = Number((v.sum / v.count).toFixed(2));
    }
    result[tipo] = { ...averages, _total_escolas: totalParsed };
  }

  setStatsCache(cacheKey, result);
  return result;
}
