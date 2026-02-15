import { db } from "./db";
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

  if (isInep) {
    const results = db.select().from(censoEscolar)
      .where(eq(censoEscolar.inep, query.trim()))
      .limit(1)
      .all();
    return results.map(mapCensoToSchool);
  }

  const upperQuery = query.toUpperCase();
  const results = db.select().from(censoEscolar)
    .where(like(censoEscolar.nome, `%${upperQuery}%`))
    .limit(limit)
    .all();
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
    result.censo_escolar = {
      ...censoFull,
      no_entidade: censo.nome || censoFull.no_entidade,
      qt_mat_bas: censo.matriculas || censoFull.quantidades?.qt_matriculas || censoFull.qt_matriculas,
      qt_mat_inf: censoFull.matriculas_por_etapa?.infantil,
      qt_mat_fund_ai: censoFull.matriculas_por_etapa?.fundamental,
      qt_mat_fund_af: censoFull.matriculas_por_etapa?.fundamental,
      qt_mat_med: censoFull.matriculas_por_etapa?.medio,
      qt_mat_eja: censoFull.matriculas_por_etapa?.eja,
      qt_mat_esp: censoFull.matriculas_por_etapa?.especial,
      qt_docentes: censo.docentes || censoFull.quantidades?.qt_docentes,
      qt_turmas: censo.turmas || censoFull.quantidades?.qt_turmas,
      qt_salas: censoFull.quantidades?.qt_salas_utilizadas,
      tp_dependencia_texto: censo.dependencia || censoFull.caracteristicas?.ds_dependencia,
      tp_localizacao_texto: censo.localizacao || censoFull.caracteristicas?.ds_localizacao,
      tp_situacao_texto: censo.situacao || censoFull.caracteristicas?.ds_situacao,
      in_internet: censoFull.infraestrutura?.in_internet,
      no_municipio: censo.municipio || censoFull.localizacao?.no_municipio,
      sg_uf: censo.uf || censoFull.localizacao?.sg_uf,
      infraestrutura: censoFull.infraestrutura,
      tempo_integral: censoFull.tempo_integral,
    };
  }

  for (const ind of indicadores) {
    const dados = ind.dados ? JSON.parse(ind.dados) : {};
    result[ind.tipo] = dados;
  }

  return Object.keys(result).length > 3 ? result : null;
}

export function getLocalSchoolCount() {
  const result = db.select().from(censoEscolar).all();
  return result.length;
}

export function getLocalStats() {
  const censoCount = db.select().from(censoEscolar).all().length;

  const indicadorCounts: Record<string, number> = {};
  for (const tipo of Object.keys(INDICATOR_CONFIG)) {
    if (tipo === "censo_escolar") continue;
    const rows = db.select().from(indicadoresEducacionais)
      .where(eq(indicadoresEducacionais.tipo, tipo))
      .all();
    indicadorCounts[tipo] = rows.length;
  }

  const importHistory = db.select().from(importacaoStatus).all();

  return {
    censo_escolar: censoCount,
    indicadores: indicadorCounts,
    importHistory,
    disponivel: INDICATOR_CONFIG,
  };
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
  let rows = db.select().from(censoEscolar)
    .where(eq(censoEscolar.ano, ano))
    .all();

  if (filters.uf) rows = rows.filter(r => r.uf?.toUpperCase() === filters.uf.toUpperCase());
  if (filters.municipio) rows = rows.filter(r => r.municipio?.toUpperCase().includes(filters.municipio.toUpperCase()));
  if (filters.nome) rows = rows.filter(r => r.nome?.toUpperCase().includes(filters.nome.toUpperCase()));
  if (filters.tp_dependencia) {
    const depMap: Record<string, string> = { "1": "Federal", "2": "Estadual", "3": "Municipal", "4": "Privada" };
    const depText = depMap[filters.tp_dependencia] || filters.tp_dependencia;
    rows = rows.filter(r => r.dependencia === depText);
  }
  if (filters.tp_localizacao) {
    const locMap: Record<string, string> = { "1": "Urbana", "2": "Rural" };
    const locText = locMap[filters.tp_localizacao] || filters.tp_localizacao;
    rows = rows.filter(r => r.localizacao === locText);
  }
  if (filters.tp_situacao) {
    const sitMap: Record<string, string> = { "1": "Em Atividade", "2": "Paralisada", "3": "Extinta" };
    const sitText = sitMap[filters.tp_situacao] || filters.tp_situacao;
    rows = rows.filter(r => r.situacao === sitText);
  }

  const total = rows.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const pageRows = rows.slice(start, start + perPage);

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

export function getCensoEstatisticas(ano: number) {
  const rows = db.select().from(censoEscolar)
    .where(eq(censoEscolar.ano, ano))
    .all();

  const totalEscolas = rows.length;
  const totalMatriculas = rows.reduce((sum, r) => sum + (r.matriculas || 0), 0);
  const totalDocentes = rows.reduce((sum, r) => sum + (r.docentes || 0), 0);
  const totalTurmas = rows.reduce((sum, r) => sum + (r.turmas || 0), 0);

  const porDependencia: Record<string, number> = {};
  const porLocalizacao: Record<string, number> = {};
  const porUf: Record<string, number> = {};
  const porSituacao: Record<string, number> = {};

  for (const r of rows) {
    if (r.dependencia) porDependencia[r.dependencia] = (porDependencia[r.dependencia] || 0) + 1;
    if (r.localizacao) porLocalizacao[r.localizacao] = (porLocalizacao[r.localizacao] || 0) + 1;
    if (r.uf) porUf[r.uf] = (porUf[r.uf] || 0) + 1;
    if (r.situacao) porSituacao[r.situacao] = (porSituacao[r.situacao] || 0) + 1;
  }

  return {
    ano,
    total_escolas: totalEscolas,
    total_matriculas: totalMatriculas,
    total_docentes: totalDocentes,
    total_turmas: totalTurmas,
    por_dependencia: porDependencia,
    por_localizacao: porLocalizacao,
    por_uf: porUf,
    por_situacao: porSituacao,
  };
}

export function listIndicador(tipo: string, ano: number, filters: Record<string, string> = {}, page = 1, perPage = 20) {
  let rows = db.select().from(indicadoresEducacionais)
    .where(and(eq(indicadoresEducacionais.tipo, tipo), eq(indicadoresEducacionais.ano, ano)))
    .all();

  if (filters.nome || filters.uf || filters.municipio) {
    const censoRows = db.select().from(censoEscolar).all();
    const censoMap = new Map(censoRows.map(c => [c.inep, c]));

    if (filters.uf) {
      rows = rows.filter(r => {
        const c = censoMap.get(r.inep);
        return c?.uf?.toUpperCase() === filters.uf.toUpperCase();
      });
    }
    if (filters.municipio) {
      rows = rows.filter(r => {
        const c = censoMap.get(r.inep);
        return c?.municipio?.toUpperCase().includes(filters.municipio.toUpperCase());
      });
    }
    if (filters.nome) {
      rows = rows.filter(r => {
        const c = censoMap.get(r.inep);
        return c?.nome?.toUpperCase().includes(filters.nome.toUpperCase());
      });
    }
  }

  const total = rows.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const pageRows = rows.slice(start, start + perPage);

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
      admin_importar: "POST /api/admin/importar",
      admin_status: "GET /api/admin/importar-status",
    },
  };
}
