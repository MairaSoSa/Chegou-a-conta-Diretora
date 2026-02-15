import { db } from "./db";
import { censoEscolar, indicadoresEducacionais, importacaoStatus } from "@shared/schema";
import { eq, and, like } from "drizzle-orm";

const EXTERNAL_API = process.env.EXTERNAL_API_URL || "https://api-escolas.replit.app";
const INEP_BASE = "https://download.inep.gov.br/informacoes_estatisticas/indicadores_educacionais";

interface ImportProgress {
  running: boolean;
  currentTask: string | null;
  progress: { tipo: string; imported: number; total: number }[];
  errors: string[];
}

let importProgress: ImportProgress = {
  running: false,
  currentTask: null,
  progress: [],
  errors: [],
};

export function getImportStatus() {
  return importProgress;
}

async function fetchJson(url: string, timeout = 15000): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

export async function importFromExternalApi(tipos?: string[]) {
  if (importProgress.running) return { error: "Importação já em andamento" };
  
  importProgress = { running: true, currentTask: null, progress: [], errors: [] };

  try {
    const tiposToImport = tipos || ["censo_escolar", "ideb", "icg", "inse", "tdi", "ird", "taxas_rendimento", "taxa_nao_resposta"];
    
    for (const tipo of tiposToImport) {
      importProgress.currentTask = tipo;
      try {
        if (tipo === "censo_escolar") {
          await importCensoFromApi();
        } else {
          await importIndicadorFromApi(tipo);
        }
      } catch (err: any) {
        importProgress.errors.push(`${tipo}: ${err.message}`);
        console.error(`[Import] Error importing ${tipo}:`, err.message);
      }
    }
  } finally {
    importProgress.running = false;
    importProgress.currentTask = null;
  }

  return { success: true, progress: importProgress.progress, errors: importProgress.errors };
}

async function importCensoFromApi() {
  const anos = [2024, 2023, 2022, 2021, 2020];
  
  for (const ano of anos) {
    let page = 1;
    let totalImported = 0;
    let totalRecords = 0;
    
    try {
      const firstPage = await fetchJson(
        `${EXTERNAL_API}/api/censo-escolar/${ano}/escolas?per_page=100&pagina=1`
      );
      totalRecords = firstPage.total || 0;
      if (totalRecords === 0) continue;

      const totalPages = firstPage.total_paginas || 1;
      
      const processPage = async (dados: any[]) => {
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
            db.update(censoEscolar)
              .set(record)
              .where(eq(censoEscolar.id, existing.id))
              .run();
          } else {
            db.insert(censoEscolar).values(record).run();
          }
          totalImported++;
        }
      };

      await processPage(firstPage.dados || []);
      
      for (page = 2; page <= Math.min(totalPages, 500); page++) {
        try {
          const data = await fetchJson(
            `${EXTERNAL_API}/api/censo-escolar/${ano}/escolas?per_page=100&pagina=${page}`
          );
          await processPage(data.dados || []);
          
          importProgress.progress = importProgress.progress.filter(p => p.tipo !== `censo_${ano}`);
          importProgress.progress.push({ tipo: `censo_${ano}`, imported: totalImported, total: totalRecords });
          
          if (page % 10 === 0) {
            console.log(`[Import] Censo ${ano}: ${totalImported}/${totalRecords} (page ${page}/${totalPages})`);
          }
        } catch (err: any) {
          console.error(`[Import] Censo ${ano} page ${page} error:`, err.message);
          break;
        }
      }
      
      console.log(`[Import] Censo ${ano}: Completed ${totalImported} records`);
    } catch (err: any) {
      console.error(`[Import] Censo ${ano} failed:`, err.message);
    }
  }
}

async function importIndicadorFromApi(tipo: string) {
  const apiTipoMap: Record<string, string> = {
    "ideb": "ideb",
    "icg": "icg",
    "inse": "inse",
    "tdi": "tdi",
    "ird": "ird",
    "taxas_rendimento": "taxa-rendimento",
    "taxa_nao_resposta": "taxa-nao-resposta",
    "saeb": "saeb",
  };
  
  const apiTipo = apiTipoMap[tipo] || tipo;
  const anos = tipo === "ideb" ? [2023, 2021, 2019] :
               tipo === "inse" ? [2023, 2021] :
               [2024, 2023, 2022, 2021, 2020];

  for (const ano of anos) {
    let page = 1;
    let totalImported = 0;
    
    try {
      const firstPage = await fetchJson(
        `${EXTERNAL_API}/api/${apiTipo}/${ano}/escolas?per_page=100&pagina=1`
      );
      const totalRecords = firstPage.total || 0;
      if (totalRecords === 0) continue;

      const totalPages = firstPage.total_paginas || 1;

      const processPage = async (dados: any[]) => {
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
            inep,
            ano,
            tipo,
            dados: JSON.stringify(d),
            updatedAt: Date.now(),
          };

          if (existing) {
            db.update(indicadoresEducacionais)
              .set(record)
              .where(eq(indicadoresEducacionais.id, existing.id))
              .run();
          } else {
            db.insert(indicadoresEducacionais).values(record).run();
          }
          totalImported++;
        }
      };

      await processPage(firstPage.dados || []);

      for (page = 2; page <= Math.min(totalPages, 500); page++) {
        try {
          const data = await fetchJson(
            `${EXTERNAL_API}/api/${apiTipo}/${ano}/escolas?per_page=100&pagina=${page}`
          );
          await processPage(data.dados || []);
          
          importProgress.progress = importProgress.progress.filter(p => p.tipo !== `${tipo}_${ano}`);
          importProgress.progress.push({ tipo: `${tipo}_${ano}`, imported: totalImported, total: totalRecords });
        } catch {
          break;
        }
      }
      
      console.log(`[Import] ${tipo} ${ano}: Completed ${totalImported} records`);
    } catch (err: any) {
      console.error(`[Import] ${tipo} ${ano} failed:`, err.message);
    }
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
  const censo = db.select().from(censoEscolar)
    .where(and(eq(censoEscolar.inep, inep), eq(censoEscolar.ano, ano)))
    .get();

  if (!censo && !ano) {
    const anyCenso = db.select().from(censoEscolar)
      .where(eq(censoEscolar.inep, inep))
      .limit(1)
      .all();
    if (anyCenso.length > 0) {
      return getEscolaCompletaLocal(inep, anyCenso[0].ano);
    }
  }

  const allCensoYears = db.select({ ano: censoEscolar.ano }).from(censoEscolar)
    .where(eq(censoEscolar.inep, inep))
    .all()
    .map(r => String(r.ano));
  
  const indicadores = db.select().from(indicadoresEducacionais)
    .where(and(eq(indicadoresEducacionais.inep, inep), eq(indicadoresEducacionais.ano, ano)))
    .all();

  const result: any = {
    co_entidade: parseInt(inep),
    anos_disponiveis: allCensoYears,
    ano_selecionado: ano,
  };

  if (censo) {
    const censoFull = censo.dados ? JSON.parse(censo.dados) : {};
    result.censo_escolar = {
      ...censoFull,
      no_entidade: censo.nome,
      qt_mat_bas: censo.matriculas || censoFull.quantidades?.qt_matriculas,
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
            inep,
            ano,
            tipo,
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
