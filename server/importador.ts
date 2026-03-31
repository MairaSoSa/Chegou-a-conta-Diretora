import { db, sqlite } from "./db";
import { pgGet, pgAll, pgRun } from "./pg";
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

  const updateStatus = async (tipo: string, ano: number, status: string, imported: number, total: number) => {
    const existingArr = await db.select().from(importacaoStatus)
      .where(and(eq(importacaoStatus.tipo, tipo), eq(importacaoStatus.ano, ano)))
      .limit(1);
    const existing = existingArr[0] || null;
    const record = {
      tipo, ano, status,
      registrosImportados: imported,
      totalRegistros: total,
      erro: null,
      iniciadoEm: existing?.iniciadoEm || Date.now(),
      finalizadoEm: status === "completo" ? Date.now() : null,
    };
    if (existing) {
      await db.update(importacaoStatus).set(record).where(eq(importacaoStatus.id, existing.id));
    } else {
      await db.insert(importacaoStatus).values(record);
    }
  };

  try {
    const firstPage = await fetchJson(
      `${EXTERNAL_API}/api/censo-escolar/${ano}/escolas?per_page=100&pagina=1`
    );
    totalRecords = firstPage.total || 0;
    if (totalRecords === 0) {
      await updateStatus("censo_escolar", ano, "vazio", 0, 0);
      return;
    }

    const totalPages = firstPage.total_paginas || 1;
    await updateStatus("censo_escolar", ano, "importando", 0, totalRecords);

    const processPage = async (dados: any[]) => {
      for (const d of dados) {
        const inep = String(d.co_entidade);
        const existingArr = await db.select().from(censoEscolar)
          .where(and(eq(censoEscolar.inep, inep), eq(censoEscolar.ano, String(ano))))
          .limit(1);
        const existing = existingArr[0] || null;

        const record = {
          id: parseInt(inep),
          inep,
          ano: String(ano),
          nome: d.no_entidade || null,
          municipio: d.no_municipio || null,
          uf: d.sg_uf || null,
          dependencia: d.ds_dependencia || null,
          localizacao: d.ds_localizacao || null,
          situacao: d.ds_situacao || null,
          matriculas: parseInt(d.qt_matriculas) || 0,
          docentes: parseInt(d.qt_docentes) || 0,
          turmas: parseInt(d.qt_turmas) || 0,
          dados: JSON.stringify(d),
          updatedAt: Date.now(),
        };

        if (existing) {
          await db.update(censoEscolar).set(record).where(eq(censoEscolar.id, existing.id));
        } else {
          await db.insert(censoEscolar).values(record);
        }
        totalImported++;
      }
    };

    await processPage(firstPage.dados || []);

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
        await processPage(data.dados || []);

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
          await updateStatus("censo_escolar", ano, "importando", totalImported, totalRecords);
        }
      } catch (err: any) {
        console.error(`[Import] Censo ${ano} page ${page} error:`, err.message);
        await updateStatus("censo_escolar", ano, "erro", totalImported, totalRecords);
        break;
      }
    }

    await updateStatus("censo_escolar", ano, "completo", totalImported, totalRecords);
    console.log(`[Import] Censo ${ano}: Completed ${totalImported} records`);
  } catch (err: any) {
    console.error(`[Import] Censo ${ano} failed:`, err.message);
    await updateStatus("censo_escolar", ano, "erro", totalImported, totalRecords);
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

    const processPage = async (dados: any[]) => {
      for (const d of dados) {
        const inep = String(d.co_entidade);
        const existingArr = await db.select().from(indicadoresEducacionais)
          .where(and(
            eq(indicadoresEducacionais.inep, inep),
            eq(indicadoresEducacionais.ano, ano),
            eq(indicadoresEducacionais.tipo, tipo)
          ))
          .limit(1);
        const existing = existingArr[0] || null;

        const record = {
          inep, ano, tipo,
          dados: JSON.stringify(d),
          updatedAt: Date.now(),
        };

        if (existing) {
          await db.update(indicadoresEducacionais).set(record).where(and(
            eq(indicadoresEducacionais.inep, inep),
            eq(indicadoresEducacionais.ano, ano),
            eq(indicadoresEducacionais.tipo, tipo)
          ));
        } else {
          await db.insert(indicadoresEducacionais).values(record);
        }
        totalImported++;
      }
    };

    await processPage(firstPage.dados || []);

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
        await processPage(data.dados || []);

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

export async function searchSchoolsLocal(query: string, limit = 20): Promise<any[]> {
  const isInep = /^\d{7,8}$/.test(query.trim());

  if (isInep) {
    const results = await pgAll(
      `SELECT inep, nome, municipio, uf, dependencia, localizacao, matriculas FROM censo_escolar WHERE inep = ? ORDER BY ano DESC LIMIT 1`,
      [query.trim()]
    );
    return results.map(mapCensoToSchool);
  }

  // Busca por nome usando ILIKE (PostgreSQL)
  const latestAnoRow = await pgGet(`SELECT MAX(ano) as max_ano FROM censo_escolar`, []);
  const ano = (latestAnoRow as any)?.max_ano || 2025;
  const results = await pgAll(
    `SELECT inep, nome, municipio, uf, dependencia, localizacao, matriculas FROM censo_escolar WHERE ano = ? AND UPPER(nome) LIKE ? LIMIT ?`,
    [ano, '%' + query.trim().toUpperCase() + '%', limit]
  );
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

export async function getEscolaCompletaLocal(inep: string, ano: number) {
  let censoArr = await db.select().from(censoEscolar)
    .where(and(eq(censoEscolar.inep, inep), eq(censoEscolar.ano, String(ano))))
    .limit(1);
  let censo = censoArr[0] || null;

  if (!censo) {
    const anyCenso = await db.select().from(censoEscolar)
      .where(eq(censoEscolar.inep, inep))
      .limit(1);
    if (anyCenso.length > 0) {
      censo = anyCenso[0];
    }
  }

  const allCensoYears = (await db.select({ ano: censoEscolar.ano }).from(censoEscolar)
    .where(eq(censoEscolar.inep, inep)))
    .map(r => String(r.ano));

  const allIndicatorYears = (await db.select({ ano: indicadoresEducacionais.ano }).from(indicadoresEducacionais)
    .where(eq(indicadoresEducacionais.inep, inep)))
    .map(r => String(r.ano));

  const anosDisponiveis = [...new Set([...allCensoYears, ...allIndicatorYears])].sort();

  const indicadores = await db.select().from(indicadoresEducacionais)
    .where(and(eq(indicadoresEducacionais.inep, inep), eq(indicadoresEducacionais.ano, ano)));

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

const DEP_MAP: Record<string, string> = { '1': 'Federal', '2': 'Estadual', '3': 'Municipal', '4': 'Privada' };
const LOC_MAP: Record<string, string> = { '1': 'Urbana', '2': 'Rural' };
const SIT_MAP: Record<string, string> = { '1': 'Em Atividade', '2': 'Paralisada', '3': 'Extinta' };

export async function getEscolaEvolucaoLocal(inep: string) {
  const coEntidade = parseInt(inep, 10);
  if (isNaN(coEntidade)) return null;

  // Query censo_escolas directly (integer co_entidade = uses idx_censo_escolas_co_entidade index)
  const [censoRows, indicadorRows, historicoRows] = await Promise.all([
    pgAll(
      `SELECT ano, co_entidade, no_entidade, no_municipio, sg_uf,
              tp_dependencia, tp_localizacao, tp_situacao_funcionamento,
              qt_mat_bas, qt_mat_inf, qt_mat_fund, qt_mat_med, qt_mat_eja,
              qt_doc_bas, qt_tur_bas, qt_tur_inf, qt_tur_fund, qt_tur_med,
              qt_salas_utilizadas, qt_salas_utilizadas_dentro, qt_salas_utilizadas_fora,
              in_agua_potavel, in_energia_rede_publica,
              in_esgoto_rede_publica, in_internet, in_banda_larga,
              in_laboratorio_informatica, in_biblioteca, in_quadra_esportes,
              in_alimentacao, no_regiao, co_regiao, no_uf, co_uf, co_municipio,
              -- novos campos importados da Tabela_Escola_2025
              in_banheiro, in_banheiro_pne, in_laboratorio_ciencias,
              in_patio_coberto, in_cozinha, in_refeitorio,
              in_internet_alunos,
              qt_desktop_aluno, qt_comp_portatil_aluno, qt_tablet_aluno,
              in_energia_renovavel, in_lixo_servico_coleta, in_lixo_queima,
              in_tratamento_lixo_separacao, in_tratamento_lixo_reciclagem,
              in_tratamento_lixo_inexistente, in_area_verde, in_area_plantio,
              in_sala_atendimento_especial,
              in_acessibilidade_rampas, in_acessibilidade_pisos_tateis,
              in_acessibilidade_sinal_visual, in_acessibilidade_inexistente,
              in_educacao_indigena, tp_localizacao_diferenciada,
              in_orgao_conselho_escolar, in_orgao_ass_pais, in_orgao_gremio_estudantil,
              in_material_ped_quilombola, in_material_ped_campo, in_material_ped_indigena,
              -- geolocalização e endereço
              latitude, longitude, ds_endereco, nu_endereco, no_bairro, co_cep,
              no_mesorregiao, co_mesorregiao, no_microrregiao, co_microrregiao,
              no_distrito, co_distrito, dt_ano_letivo_inicio, dt_ano_letivo_termino,
              -- água e saneamento
              in_agua_rede_publica, in_agua_poco_artesiano, in_agua_cacimba,
              in_agua_fonte_rio, in_agua_inexistente, in_agua_carro_pipa,
              in_energia_gerador_fossil, in_energia_inexistente,
              in_esgoto_fossa_septica, in_esgoto_fossa_comum, in_esgoto_fossa, in_esgoto_inexistente,
              in_lixo_enterra, in_lixo_destino_final_publico, in_lixo_descarta_outra_area,
              in_tratamento_lixo_reutiliza,
              -- espaços físicos
              in_auditorio, in_almoxarifado, in_despensa,
              in_patio_descoberto, in_quadra_esportes_coberta, in_quadra_esportes_descoberta,
              in_sala_diretoria, in_sala_professor, in_secretaria,
              in_sala_leitura, in_biblioteca_sala_leitura,
              in_banheiro_funcionarios, in_banheiro_chuveiro,
              in_dormitorio_aluno, in_dormitorio_professor,
              in_sala_multiuso, in_sala_atelie_artes, in_sala_musica_coral,
              in_laboratorio_educ_prof, in_parque_infantil, in_piscina,
              qt_salas_utilizadas_acessiveis, qt_salas_utiliza_climatizadas,
              -- tecnologia e equipamentos
              in_computador, in_equip_impressora, in_equip_impressora_mult, in_equip_scanner,
              in_equip_som, in_equip_tv, in_equip_dvd,
              in_equip_lousa_digital, in_equip_multimidia, in_equip_parabolica,
              qt_equip_tv, qt_equip_som, qt_equip_lousa_digital, qt_equip_multimidia,
              in_internet_aprendizagem, in_internet_administrativo, in_internet_comunidade,
              in_acesso_internet_computador, in_aces_internet_disp_pessoais,
              -- acessibilidade completa
              in_acessibilidade_corrimao, in_acessibilidade_elevador,
              in_acessibilidade_vao_livre,
              in_acessibilidade_sinal_sonoro, in_acessibilidade_sinal_tatil, in_acessibilidade_sinalizacao,
              -- educação ambiental
              in_educ_ambiental,
              in_educ_amb_conteudo, in_educ_amb_curricular, in_educ_amb_eixo,
              in_educ_amb_eventos, in_educ_amb_projetos, in_educ_amb_nenhuma,
              -- pessoal de apoio
              qt_prof_administrativos, qt_prof_servicos_gerais, qt_prof_bibliotecario,
              qt_prof_saude, qt_prof_coordenador, qt_prof_fonaudiologo,
              qt_prof_nutricionista, qt_prof_psicologo, qt_prof_alimentacao,
              qt_prof_pedagogia, qt_prof_secretario, qt_prof_seguranca,
              qt_prof_monitores, qt_prof_gestao, qt_prof_assist_social,
              qt_prof_trad_libras, qt_prof_revisor_braille,
              -- organização pedagógica
              tp_aee, tp_atividade_complementar,
              in_espaco_atividade, in_espaco_equipamento,
              in_regular, in_eja, in_profissionalizante, in_especial_exclusiva,
              in_mediacao_presencial, in_mediacao_semipresencial, in_mediacao_ead,
              -- modalidades por etapa
              in_comum_fund_ai, in_comum_fund_af,
              in_comum_medio_medio, in_comum_medio_integrado, in_comum_medio_fic,
              in_comum_eja_fund, in_comum_eja_medio, in_comum_eja_prof, in_comum_prof,
              -- participação e materiais pedagógicos
              in_orgao_ass_pais_mestres, in_orgao_outros, in_orgao_nenhum,
              in_material_ped_multimidia, in_material_ped_cientifico, in_material_ped_jogos,
              in_material_ped_musical, in_material_ped_artisticas, in_material_ped_desportiva,
              in_material_ped_profissional, in_material_ped_agricola,
              in_material_ped_bil_surdos, in_material_ped_etnico,
              in_material_ped_edu_esp, in_material_ped_nenhum,
              in_local_func_predio_escolar, in_predio_compartilhado,
              -- campos complementares
              in_banheiro_ei, in_sala_repouso_aluno,
              in_sala_estudio_danca, in_sala_estudio_gravacao, in_sala_oficinas_educ_prof,
              in_terreirao, in_viveiro, in_dependencias_outras,
              in_vinculo_secretaria_educacao, in_vinculo_seguranca_publica,
              in_vinculo_secretaria_saude, in_vinculo_outro_orgao, in_poder_publico_parceria,
              in_local_func_salas_outra_esc, in_local_func_galpao,
              in_local_func_socioeducativo, in_local_func_unid_prisional, in_local_func_outros,
              in_redes_sociais
       FROM censo_escolas WHERE co_entidade = $1 ORDER BY ano`,
      [coEntidade]
    ),
    // Query all indicator tables directly using co_entidade integer (uses per-table indexes)
    // Uses ? placeholders (converted to $1..$11) so each UNION ALL branch gets its own param
    pgAll(
      `SELECT co_entidade::text as inep, ano, 'ied' as tipo, dados_json::text as dados FROM ied_escola WHERE co_entidade=?
       UNION ALL SELECT co_entidade::text, ano, 'icg', dados_json::text FROM icg_escola WHERE co_entidade=?
       UNION ALL SELECT co_entidade::text, ano, 'inse', dados_json::text FROM inse_escola WHERE co_entidade=?
       UNION ALL SELECT co_entidade::text, ano, 'ird', dados_json::text FROM ird_escola WHERE co_entidade=?
       UNION ALL SELECT co_entidade::text, ano, 'afd', dados_json::text FROM afd_escola WHERE co_entidade=?
       UNION ALL SELECT co_entidade::text, ano, 'atu', dados_json::text FROM atu_escola WHERE co_entidade=?
       UNION ALL SELECT co_entidade::text, ano, 'tdi', dados_json::text FROM tdi_escola WHERE co_entidade=?
       UNION ALL SELECT co_entidade::text, ano, 'rendimento', dados_json::text FROM rendimento_escola WHERE co_entidade=?
       UNION ALL SELECT co_entidade::text, ano, 'had', dados_json::text FROM had_escola WHERE co_entidade=?
       UNION ALL SELECT co_entidade::text, ano, 'tnr', dados_json::text FROM tnr_escola WHERE co_entidade=?
       UNION ALL SELECT co_entidade::text, ano, 'ideb',
         jsonb_build_object('etapa', etapa, 'ideb', ideb, 'nota_saeb', nota_saeb, 'taxa_aprovacao', taxa_aprovacao)::text
         FROM ideb_escola WHERE co_entidade=?`,
      [coEntidade, coEntidade, coEntidade, coEntidade, coEntidade, coEntidade, coEntidade, coEntidade, coEntidade, coEntidade, coEntidade]
    ),
    // Dados de gênero/raça/faixa etária/turno/zona do JSON histórico (2020-2024)
    pgAll(
      `SELECT ano,
        (dados_json->>'QT_MAT_BAS_FEM')::int AS qt_mat_bas_fem,
        (dados_json->>'QT_MAT_BAS_MASC')::int AS qt_mat_bas_masc,
        (dados_json->>'QT_MAT_BAS_BRANCA')::int AS qt_mat_bas_branca,
        (dados_json->>'QT_MAT_BAS_PRETA')::int AS qt_mat_bas_preta,
        (dados_json->>'QT_MAT_BAS_PARDA')::int AS qt_mat_bas_parda,
        (dados_json->>'QT_MAT_BAS_AMARELA')::int AS qt_mat_bas_amarela,
        (dados_json->>'QT_MAT_BAS_INDIGENA')::int AS qt_mat_bas_indigena,
        (dados_json->>'QT_MAT_BAS_ND')::int AS qt_mat_bas_nd,
        (dados_json->>'QT_MAT_BAS_D')::int AS qt_mat_bas_diurno,
        (dados_json->>'QT_MAT_BAS_N')::int AS qt_mat_bas_noturno,
        (dados_json->>'QT_MAT_BAS_0_3')::int AS qt_mat_bas_0_3,
        (dados_json->>'QT_MAT_BAS_4_5')::int AS qt_mat_bas_4_5,
        (dados_json->>'QT_MAT_BAS_6_10')::int AS qt_mat_bas_6_10,
        (dados_json->>'QT_MAT_BAS_11_14')::int AS qt_mat_bas_11_14,
        (dados_json->>'QT_MAT_BAS_15_17')::int AS qt_mat_bas_15_17,
        COALESCE((dados_json->>'QT_MAT_BAS_18_MAIS')::int,
          (dados_json->>'QT_MAT_BAS_18_19')::int) AS qt_mat_bas_18_mais,
        (dados_json->>'QT_MAT_ZR_URB')::int AS qt_mat_zr_urba,
        (dados_json->>'QT_MAT_ZR_RUR')::int AS qt_mat_zr_rura,
        (dados_json->>'QT_MAT_EJA_FUND')::int AS qt_mat_eja_fund,
        (dados_json->>'QT_MAT_EJA_MED')::int AS qt_mat_eja_med,
        (dados_json->>'QT_MAT_ESP_CC')::int AS qt_mat_esp_cc,
        (dados_json->>'QT_MAT_ESP_CE')::int AS qt_mat_esp_ce,
        (dados_json->>'QT_MAT_INF_INT')::int AS qt_mat_inf_int,
        (dados_json->>'QT_MAT_FUND_AI_INT')::int AS qt_mat_fund_ai_int,
        (dados_json->>'QT_MAT_FUND_AF_INT')::int AS qt_mat_fund_af_int,
        (dados_json->>'QT_MAT_MED_INT')::int AS qt_mat_med_int,
        (dados_json->>'QT_MAT_EJA_INT')::int AS qt_mat_eja_int
       FROM censo_escola_historico
       WHERE co_entidade = $1 ORDER BY ano`,
      [coEntidade]
    ),
  ]);

  if (censoRows.length === 0) return null;

  const anosSet = new Set<number>();
  censoRows.forEach((r: any) => anosSet.add(Number(r.ano)));
  indicadorRows.forEach((r: any) => anosSet.add(Number(r.ano)));
  const anos = [...anosSet].sort();

  const censoByYear: Record<number, any> = {};
  for (const c of censoRows as any[]) {
    const ano = Number(c.ano);
    const matriculas = c.qt_mat_bas ? Number(c.qt_mat_bas) || 0 : 0;
    const docentes = c.qt_doc_bas ? Number(c.qt_doc_bas) || 0 : 0;
    const turmas = c.qt_tur_bas ? Number(c.qt_tur_bas) || 0 : 0;
    const dependencia = DEP_MAP[c.tp_dependencia] || c.tp_dependencia;
    const localizacao = LOC_MAP[c.tp_localizacao] || c.tp_localizacao;
    const situacao = SIT_MAP[c.tp_situacao_funcionamento] || c.tp_situacao_funcionamento;

    censoByYear[ano] = {
      no_entidade: c.no_entidade,
      no_municipio: c.no_municipio,
      sg_uf: c.sg_uf,
      tp_dependencia_texto: dependencia,
      tp_localizacao_texto: localizacao,
      tp_situacao_texto: situacao,
      qt_mat_bas: matriculas,
      qt_doc_bas: docentes,
      qt_docentes: docentes,
      qt_tur_bas: turmas,
      qt_turmas: turmas,
      qt_mat_inf: c.qt_mat_inf ? Number(c.qt_mat_inf) || 0 : 0,
      qt_mat_fund: c.qt_mat_fund ? Number(c.qt_mat_fund) || 0 : 0,
      qt_mat_med: c.qt_mat_med ? Number(c.qt_mat_med) || 0 : 0,
      qt_mat_eja: c.qt_mat_eja ? Number(c.qt_mat_eja) || 0 : 0,
      qt_tur_inf: c.qt_tur_inf ? Number(c.qt_tur_inf) || 0 : 0,
      qt_tur_fund: c.qt_tur_fund ? Number(c.qt_tur_fund) || 0 : 0,
      qt_tur_med: c.qt_tur_med ? Number(c.qt_tur_med) || 0 : 0,
      qt_salas_utilizadas: c.qt_salas_utilizadas ? Number(c.qt_salas_utilizadas) || 0 : 0,
      qt_salas_utilizadas_dentro: c.qt_salas_utilizadas_dentro != null ? Number(c.qt_salas_utilizadas_dentro) : null,
      qt_salas_utilizadas_fora: c.qt_salas_utilizadas_fora != null ? Number(c.qt_salas_utilizadas_fora) : null,
      in_internet: c.in_internet,
      in_agua_potavel: c.in_agua_potavel,
      in_energia_rede_publica: c.in_energia_rede_publica,
      in_esgoto_rede_publica: c.in_esgoto_rede_publica,
      in_banda_larga: c.in_banda_larga,
      in_laboratorio_informatica: c.in_laboratorio_informatica,
      in_biblioteca: c.in_biblioteca,
      in_quadra_esportes: c.in_quadra_esportes,
      in_alimentacao: c.in_alimentacao,
      no_regiao: c.no_regiao,
      co_municipio: c.co_municipio?.toString(),
      // Infra extras
      in_banheiro: c.in_banheiro,
      in_banheiro_pne: c.in_banheiro_pne,
      in_laboratorio_ciencias: c.in_laboratorio_ciencias,
      in_patio_coberto: c.in_patio_coberto,
      in_cozinha: c.in_cozinha,
      in_refeitorio: c.in_refeitorio,
      // Tecnologia extras
      in_internet_alunos: c.in_internet_alunos,
      qt_desktop_aluno: c.qt_desktop_aluno != null ? Number(c.qt_desktop_aluno) : null,
      qt_comp_portatil_aluno: c.qt_comp_portatil_aluno != null ? Number(c.qt_comp_portatil_aluno) : null,
      qt_tablet_aluno: c.qt_tablet_aluno != null ? Number(c.qt_tablet_aluno) : null,
      // Sustentabilidade
      in_energia_renovavel: c.in_energia_renovavel,
      in_lixo_servico_coleta: c.in_lixo_servico_coleta,
      in_lixo_queima: c.in_lixo_queima,
      in_tratamento_lixo_separacao: c.in_tratamento_lixo_separacao,
      in_tratamento_lixo_reciclagem: c.in_tratamento_lixo_reciclagem,
      in_tratamento_lixo_inexistente: c.in_tratamento_lixo_inexistente,
      in_area_verde: c.in_area_verde,
      in_area_plantio: c.in_area_plantio,
      // Inclusão / Acessibilidade
      in_sala_atendimento_especial: c.in_sala_atendimento_especial,
      in_acessibilidade_rampas: c.in_acessibilidade_rampas,
      in_acessibilidade_pisos_tateis: c.in_acessibilidade_pisos_tateis,
      in_acessibilidade_sinal_visual: c.in_acessibilidade_sinal_visual,
      in_acessibilidade_inexistente: c.in_acessibilidade_inexistente,
      // Participação / Identidade
      in_educacao_indigena: c.in_educacao_indigena,
      tp_localizacao_diferenciada: c.tp_localizacao_diferenciada != null ? Number(c.tp_localizacao_diferenciada) : null,
      in_orgao_conselho_escolar: c.in_orgao_conselho_escolar,
      in_orgao_ass_pais: c.in_orgao_ass_pais,
      in_orgao_gremio_estudantil: c.in_orgao_gremio_estudantil,
      in_material_ped_quilombola: c.in_material_ped_quilombola,
      in_material_ped_campo: c.in_material_ped_campo,
      in_material_ped_indigena: c.in_material_ped_indigena,
      // Geolocalização e endereço
      latitude: c.latitude != null ? Number(c.latitude) : null,
      longitude: c.longitude != null ? Number(c.longitude) : null,
      ds_endereco: c.ds_endereco ?? null,
      nu_endereco: c.nu_endereco ?? null,
      no_bairro: c.no_bairro ?? null,
      co_cep: c.co_cep ?? null,
      no_mesorregiao: c.no_mesorregiao ?? null,
      no_microrregiao: c.no_microrregiao ?? null,
      no_distrito: c.no_distrito ?? null,
      dt_ano_letivo_inicio: c.dt_ano_letivo_inicio ?? null,
      dt_ano_letivo_termino: c.dt_ano_letivo_termino ?? null,
      // Água e saneamento
      in_agua_rede_publica: c.in_agua_rede_publica,
      in_agua_poco_artesiano: c.in_agua_poco_artesiano,
      in_agua_cacimba: c.in_agua_cacimba,
      in_agua_fonte_rio: c.in_agua_fonte_rio,
      in_agua_inexistente: c.in_agua_inexistente,
      in_agua_carro_pipa: c.in_agua_carro_pipa,
      in_energia_gerador_fossil: c.in_energia_gerador_fossil,
      in_energia_inexistente: c.in_energia_inexistente,
      in_esgoto_fossa_septica: c.in_esgoto_fossa_septica,
      in_esgoto_fossa_comum: c.in_esgoto_fossa_comum,
      in_esgoto_fossa: c.in_esgoto_fossa,
      in_esgoto_inexistente: c.in_esgoto_inexistente,
      in_lixo_enterra: c.in_lixo_enterra,
      in_lixo_destino_final_publico: c.in_lixo_destino_final_publico,
      in_lixo_descarta_outra_area: c.in_lixo_descarta_outra_area,
      in_tratamento_lixo_reutiliza: c.in_tratamento_lixo_reutiliza,
      // Espaços físicos
      in_auditorio: c.in_auditorio,
      in_almoxarifado: c.in_almoxarifado,
      in_despensa: c.in_despensa,
      in_patio_descoberto: c.in_patio_descoberto,
      in_quadra_esportes_coberta: c.in_quadra_esportes_coberta,
      in_quadra_esportes_descoberta: c.in_quadra_esportes_descoberta,
      in_sala_diretoria: c.in_sala_diretoria,
      in_sala_professor: c.in_sala_professor,
      in_secretaria: c.in_secretaria,
      in_sala_leitura: c.in_sala_leitura,
      in_biblioteca_sala_leitura: c.in_biblioteca_sala_leitura,
      in_banheiro_funcionarios: c.in_banheiro_funcionarios,
      in_banheiro_chuveiro: c.in_banheiro_chuveiro,
      in_dormitorio_aluno: c.in_dormitorio_aluno,
      in_dormitorio_professor: c.in_dormitorio_professor,
      in_sala_multiuso: c.in_sala_multiuso,
      in_sala_atelie_artes: c.in_sala_atelie_artes,
      in_sala_musica_coral: c.in_sala_musica_coral,
      in_laboratorio_educ_prof: c.in_laboratorio_educ_prof,
      in_parque_infantil: c.in_parque_infantil,
      in_piscina: c.in_piscina,
      qt_salas_utilizadas_acessiveis: c.qt_salas_utilizadas_acessiveis != null ? Number(c.qt_salas_utilizadas_acessiveis) : null,
      qt_salas_utiliza_climatizadas: c.qt_salas_utiliza_climatizadas != null ? Number(c.qt_salas_utiliza_climatizadas) : null,
      // Tecnologia e equipamentos
      in_computador: c.in_computador,
      in_equip_impressora: c.in_equip_impressora,
      in_equip_impressora_mult: c.in_equip_impressora_mult,
      in_equip_scanner: c.in_equip_scanner,
      in_equip_som: c.in_equip_som,
      in_equip_tv: c.in_equip_tv,
      in_equip_dvd: c.in_equip_dvd,
      in_equip_lousa_digital: c.in_equip_lousa_digital,
      in_equip_multimidia: c.in_equip_multimidia,
      in_equip_parabolica: c.in_equip_parabolica,
      qt_equip_tv: c.qt_equip_tv != null ? Number(c.qt_equip_tv) : null,
      qt_equip_som: c.qt_equip_som != null ? Number(c.qt_equip_som) : null,
      qt_equip_lousa_digital: c.qt_equip_lousa_digital != null ? Number(c.qt_equip_lousa_digital) : null,
      qt_equip_multimidia: c.qt_equip_multimidia != null ? Number(c.qt_equip_multimidia) : null,
      in_internet_aprendizagem: c.in_internet_aprendizagem,
      in_internet_administrativo: c.in_internet_administrativo,
      in_internet_comunidade: c.in_internet_comunidade,
      in_acesso_internet_computador: c.in_acesso_internet_computador,
      in_aces_internet_disp_pessoais: c.in_aces_internet_disp_pessoais,
      // Acessibilidade completa
      in_acessibilidade_corrimao: c.in_acessibilidade_corrimao,
      in_acessibilidade_elevador: c.in_acessibilidade_elevador,
      in_acessibilidade_vao_livre: c.in_acessibilidade_vao_livre,
      in_acessibilidade_sinal_sonoro: c.in_acessibilidade_sinal_sonoro,
      in_acessibilidade_sinal_tatil: c.in_acessibilidade_sinal_tatil,
      in_acessibilidade_sinalizacao: c.in_acessibilidade_sinalizacao,
      // Educação ambiental
      in_educ_ambiental: c.in_educ_ambiental,
      in_educ_amb_conteudo: c.in_educ_amb_conteudo,
      in_educ_amb_curricular: c.in_educ_amb_curricular,
      in_educ_amb_eixo: c.in_educ_amb_eixo,
      in_educ_amb_eventos: c.in_educ_amb_eventos,
      in_educ_amb_projetos: c.in_educ_amb_projetos,
      in_educ_amb_nenhuma: c.in_educ_amb_nenhuma,
      // Pessoal de apoio
      qt_prof_administrativos: c.qt_prof_administrativos != null ? Number(c.qt_prof_administrativos) : null,
      qt_prof_servicos_gerais: c.qt_prof_servicos_gerais != null ? Number(c.qt_prof_servicos_gerais) : null,
      qt_prof_bibliotecario: c.qt_prof_bibliotecario != null ? Number(c.qt_prof_bibliotecario) : null,
      qt_prof_saude: c.qt_prof_saude != null ? Number(c.qt_prof_saude) : null,
      qt_prof_coordenador: c.qt_prof_coordenador != null ? Number(c.qt_prof_coordenador) : null,
      qt_prof_fonaudiologo: c.qt_prof_fonaudiologo != null ? Number(c.qt_prof_fonaudiologo) : null,
      qt_prof_nutricionista: c.qt_prof_nutricionista != null ? Number(c.qt_prof_nutricionista) : null,
      qt_prof_psicologo: c.qt_prof_psicologo != null ? Number(c.qt_prof_psicologo) : null,
      qt_prof_alimentacao: c.qt_prof_alimentacao != null ? Number(c.qt_prof_alimentacao) : null,
      qt_prof_pedagogia: c.qt_prof_pedagogia != null ? Number(c.qt_prof_pedagogia) : null,
      qt_prof_secretario: c.qt_prof_secretario != null ? Number(c.qt_prof_secretario) : null,
      qt_prof_seguranca: c.qt_prof_seguranca != null ? Number(c.qt_prof_seguranca) : null,
      qt_prof_monitores: c.qt_prof_monitores != null ? Number(c.qt_prof_monitores) : null,
      qt_prof_gestao: c.qt_prof_gestao != null ? Number(c.qt_prof_gestao) : null,
      qt_prof_assist_social: c.qt_prof_assist_social != null ? Number(c.qt_prof_assist_social) : null,
      qt_prof_trad_libras: c.qt_prof_trad_libras != null ? Number(c.qt_prof_trad_libras) : null,
      qt_prof_revisor_braille: c.qt_prof_revisor_braille != null ? Number(c.qt_prof_revisor_braille) : null,
      // Organização pedagógica
      tp_aee: c.tp_aee != null ? Number(c.tp_aee) : null,
      tp_atividade_complementar: c.tp_atividade_complementar != null ? Number(c.tp_atividade_complementar) : null,
      in_espaco_atividade: c.in_espaco_atividade,
      in_espaco_equipamento: c.in_espaco_equipamento,
      in_regular: c.in_regular,
      in_eja: c.in_eja,
      in_profissionalizante: c.in_profissionalizante,
      in_especial_exclusiva: c.in_especial_exclusiva,
      in_mediacao_presencial: c.in_mediacao_presencial,
      in_mediacao_semipresencial: c.in_mediacao_semipresencial,
      in_mediacao_ead: c.in_mediacao_ead,
      // Modalidades por etapa
      in_comum_fund_ai: c.in_comum_fund_ai,
      in_comum_fund_af: c.in_comum_fund_af,
      in_comum_medio_medio: c.in_comum_medio_medio,
      in_comum_medio_integrado: c.in_comum_medio_integrado,
      in_comum_medio_fic: c.in_comum_medio_fic,
      in_comum_eja_fund: c.in_comum_eja_fund,
      in_comum_eja_medio: c.in_comum_eja_medio,
      in_comum_eja_prof: c.in_comum_eja_prof,
      in_comum_prof: c.in_comum_prof,
      // Participação complementar e materiais pedagógicos
      in_orgao_ass_pais_mestres: c.in_orgao_ass_pais_mestres,
      in_orgao_outros: c.in_orgao_outros,
      in_orgao_nenhum: c.in_orgao_nenhum,
      in_material_ped_multimidia: c.in_material_ped_multimidia,
      in_material_ped_cientifico: c.in_material_ped_cientifico,
      in_material_ped_jogos: c.in_material_ped_jogos,
      in_material_ped_musical: c.in_material_ped_musical,
      in_material_ped_artisticas: c.in_material_ped_artisticas,
      in_material_ped_desportiva: c.in_material_ped_desportiva,
      in_material_ped_profissional: c.in_material_ped_profissional,
      in_material_ped_agricola: c.in_material_ped_agricola,
      in_material_ped_bil_surdos: c.in_material_ped_bil_surdos,
      in_material_ped_etnico: c.in_material_ped_etnico,
      in_material_ped_edu_esp: c.in_material_ped_edu_esp,
      in_material_ped_nenhum: c.in_material_ped_nenhum,
      in_local_func_predio_escolar: c.in_local_func_predio_escolar,
      in_predio_compartilhado: c.in_predio_compartilhado,
      // Campos complementares
      in_banheiro_ei: c.in_banheiro_ei,
      in_sala_repouso_aluno: c.in_sala_repouso_aluno,
      in_sala_estudio_danca: c.in_sala_estudio_danca,
      in_sala_estudio_gravacao: c.in_sala_estudio_gravacao,
      in_sala_oficinas_educ_prof: c.in_sala_oficinas_educ_prof,
      in_terreirao: c.in_terreirao,
      in_viveiro: c.in_viveiro,
      in_dependencias_outras: c.in_dependencias_outras,
      in_vinculo_secretaria_educacao: c.in_vinculo_secretaria_educacao,
      in_vinculo_seguranca_publica: c.in_vinculo_seguranca_publica,
      in_vinculo_secretaria_saude: c.in_vinculo_secretaria_saude,
      in_vinculo_outro_orgao: c.in_vinculo_outro_orgao,
      in_poder_publico_parceria: c.in_poder_publico_parceria,
      in_local_func_salas_outra_esc: c.in_local_func_salas_outra_esc,
      in_local_func_galpao: c.in_local_func_galpao,
      in_local_func_socioeducativo: c.in_local_func_socioeducativo,
      in_local_func_unid_prisional: c.in_local_func_unid_prisional,
      in_local_func_outros: c.in_local_func_outros,
      in_redes_sociais: c.in_redes_sociais,
    };
  }

  // Mescla dados de gênero/raça/faixa etária/turno/zona históricos (2020-2024) em censoByYear
  for (const h of historicoRows as any[]) {
    const ano = Number(h.ano);
    if (!censoByYear[ano]) continue;
    const _hn = (v: any) => v != null ? Number(v) : null;
    censoByYear[ano].qt_mat_bas_fem      = _hn(h.qt_mat_bas_fem);
    censoByYear[ano].qt_mat_bas_masc     = _hn(h.qt_mat_bas_masc);
    censoByYear[ano].qt_mat_bas_branca   = _hn(h.qt_mat_bas_branca);
    censoByYear[ano].qt_mat_bas_preta    = _hn(h.qt_mat_bas_preta);
    censoByYear[ano].qt_mat_bas_parda    = _hn(h.qt_mat_bas_parda);
    censoByYear[ano].qt_mat_bas_amarela  = _hn(h.qt_mat_bas_amarela);
    censoByYear[ano].qt_mat_bas_indigena = _hn(h.qt_mat_bas_indigena);
    censoByYear[ano].qt_mat_bas_nd       = _hn(h.qt_mat_bas_nd);
    censoByYear[ano].qt_mat_bas_diurno   = _hn(h.qt_mat_bas_diurno);
    censoByYear[ano].qt_mat_bas_noturno  = _hn(h.qt_mat_bas_noturno);
    censoByYear[ano].qt_mat_bas_d        = _hn(h.qt_mat_bas_diurno);   // alias para o pizza chart
    censoByYear[ano].qt_mat_bas_n        = _hn(h.qt_mat_bas_noturno);  // alias para o pizza chart
    censoByYear[ano].qt_mat_bas_0_3      = _hn(h.qt_mat_bas_0_3);
    censoByYear[ano].qt_mat_bas_4_5      = _hn(h.qt_mat_bas_4_5);
    censoByYear[ano].qt_mat_bas_6_10     = _hn(h.qt_mat_bas_6_10);
    censoByYear[ano].qt_mat_bas_11_14    = _hn(h.qt_mat_bas_11_14);
    censoByYear[ano].qt_mat_bas_15_17    = _hn(h.qt_mat_bas_15_17);
    censoByYear[ano].qt_mat_bas_18_mais  = _hn(h.qt_mat_bas_18_mais);
    censoByYear[ano].qt_mat_zr_urba      = _hn(h.qt_mat_zr_urba);
    censoByYear[ano].qt_mat_zr_rura      = _hn(h.qt_mat_zr_rura);
    censoByYear[ano].qt_mat_eja_fund     = _hn(h.qt_mat_eja_fund);
    censoByYear[ano].qt_mat_eja_med      = _hn(h.qt_mat_eja_med);
    censoByYear[ano].qt_mat_esp_cc       = _hn(h.qt_mat_esp_cc);
    censoByYear[ano].qt_mat_esp_ce       = _hn(h.qt_mat_esp_ce);
    censoByYear[ano].qt_mat_inf_int      = _hn(h.qt_mat_inf_int);
    censoByYear[ano].qt_mat_fund_ai_int  = _hn(h.qt_mat_fund_ai_int);
    censoByYear[ano].qt_mat_fund_af_int  = _hn(h.qt_mat_fund_af_int);
    censoByYear[ano].qt_mat_med_int      = _hn(h.qt_mat_med_int);
    censoByYear[ano].qt_mat_eja_int      = _hn(h.qt_mat_eja_int);
    // qt_mat_bas_int (total integral) não existe no historico — derivar da soma das etapas
    const intSum = (_hn(h.qt_mat_inf_int) ?? 0) + (_hn(h.qt_mat_fund_ai_int) ?? 0) +
                   (_hn(h.qt_mat_fund_af_int) ?? 0) + (_hn(h.qt_mat_med_int) ?? 0) +
                   (_hn(h.qt_mat_eja_int) ?? 0);
    censoByYear[ano].qt_mat_bas_int = intSum > 0 ? intSum : null;
  }

  const indicadoresByYear: Record<number, Record<string, any>> = {};
  for (const ind of indicadorRows as any[]) {
    const ano = Number(ind.ano);
    if (!indicadoresByYear[ano]) indicadoresByYear[ano] = {};
    indicadoresByYear[ano][ind.tipo] = ind.dados ? JSON.parse(ind.dados) : {};
  }

  const latestAno = anos[anos.length - 1];
  const latestCenso = censoByYear[latestAno] || censoByYear[anos[0]];

  return {
    co_entidade: coEntidade,
    anos_disponiveis: anos,
    escola: {
      no_entidade: latestCenso?.no_entidade,
      no_municipio: latestCenso?.no_municipio,
      sg_uf: latestCenso?.sg_uf,
      ds_dependencia: latestCenso?.tp_dependencia_texto,
      ds_localizacao: latestCenso?.tp_localizacao_texto,
      ds_situacao: latestCenso?.tp_situacao_texto,
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
  const localData = await getEscolaEvolucaoLocal(inep);

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

export async function getLocalSchoolCount() {
  const result = (await db.select({ count: sql<number>`count(*)` }).from(censoEscolar))[0];
  return Number(result?.count) || 0;
}

export async function getLocalStats() {
  const cached = getStatsCache('local_stats');
  if (cached) return cached;

  const censoCountRow = (await db.select({ count: sql<number>`count(*)` }).from(censoEscolar))[0];
  const censoCount = Number(censoCountRow?.count) || 0;

  const indicadorCounts: Record<string, number> = {};
  for (const tipo of Object.keys(INDICATOR_CONFIG)) {
    if (tipo === "censo_escolar") continue;
    const row = (await db.select({ count: sql<number>`count(*)` }).from(indicadoresEducacionais)
      .where(eq(indicadoresEducacionais.tipo, tipo)))[0];
    indicadorCounts[tipo] = Number(row?.count) || 0;
  }

  const importHistory = await db.select().from(importacaoStatus);

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
  pgRun(`DELETE FROM stats_cache`, []).catch(() => {});
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
        const existingArr = await db.select().from(censoEscolar)
          .where(and(eq(censoEscolar.inep, inep), eq(censoEscolar.ano, String(ano))))
          .limit(1);
        const existing = existingArr[0] || null;

        const record = {
          id: parseInt(inep),
          inep,
          ano: String(ano),
          nome: c.no_entidade || null,
          municipio: c.localizacao?.no_municipio || null,
          uf: c.localizacao?.sg_uf || null,
          dependencia: c.caracteristicas?.ds_dependencia || null,
          localizacao: c.caracteristicas?.ds_localizacao || null,
          situacao: c.caracteristicas?.ds_situacao || null,
          matriculas: parseInt(c.quantidades?.qt_matriculas) || 0,
          docentes: parseInt(c.quantidades?.qt_docentes) || 0,
          turmas: parseInt(c.quantidades?.qt_turmas) || 0,
          dados: JSON.stringify(c),
          updatedAt: Date.now(),
        };

        if (existing) {
          await db.update(censoEscolar).set(record).where(eq(censoEscolar.id, existing.id));
        } else {
          await db.insert(censoEscolar).values(record);
        }
      }

      const indicatorTypes = ["ideb", "icg", "inse", "tdi", "ird", "taxas_rendimento", "taxa_nao_resposta", "saeb"];
      for (const tipo of indicatorTypes) {
        if (anoData[tipo]) {
          const existingArr = await db.select().from(indicadoresEducacionais)
            .where(and(
              eq(indicadoresEducacionais.inep, inep),
              eq(indicadoresEducacionais.ano, ano),
              eq(indicadoresEducacionais.tipo, tipo)
            ))
            .limit(1);
          const existing = existingArr[0] || null;

          const record = {
            inep, ano, tipo,
            dados: JSON.stringify(anoData[tipo]),
            updatedAt: Date.now(),
          };

          if (existing) {
            await db.update(indicadoresEducacionais).set(record).where(and(
              eq(indicadoresEducacionais.inep, inep),
              eq(indicadoresEducacionais.ano, ano),
              eq(indicadoresEducacionais.tipo, tipo)
            ));
          } else {
            await db.insert(indicadoresEducacionais).values(record);
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

export async function listCensoEscolar(ano: number, filters: Record<string, string> = {}, page = 1, perPage = 20) {
  const depMap: Record<string, string> = { "1": "Federal", "2": "Estadual", "3": "Municipal", "4": "Privada" };
  const locMap: Record<string, string> = { "1": "Urbana", "2": "Rural" };
  const sitMap: Record<string, string> = { "1": "Em Atividade", "2": "Paralisada", "3": "Extinta" };

  const conditions: any[] = [eq(censoEscolar.ano, String(ano))];
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
  const countResultArr = await db.select({ count: sql<number>`count(*)` }).from(censoEscolar).where(whereClause);
  const total = Number(countResultArr[0]?.count) || 0;
  const totalPages = Math.ceil(total / perPage);
  const offset = (page - 1) * perPage;

  const pageRows = await db.select().from(censoEscolar)
    .where(whereClause)
    .limit(perPage)
    .offset(offset);

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

export async function getCensoEscolarDetail(ano: number, inep: string) {
  const arr = await db.select().from(censoEscolar)
    .where(and(eq(censoEscolar.inep, inep), eq(censoEscolar.ano, String(ano))))
    .limit(1);
  const row = arr[0] || null;
  if (!row) return null;
  const full = row.dados ? JSON.parse(row.dados) : {};
  return {
    co_entidade: parseInt(row.inep),
    no_entidade: row.nome,
    ano: row.ano,
    ...full,
  };
}

const _statsMemCache: Record<string, { data: any; ts: number }> = {};
const STATS_MEM_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function getStatsCache(key: string): any | null {
  const entry = _statsMemCache[key];
  if (entry && (Date.now() - entry.ts) < STATS_MEM_TTL_MS) return entry.data;
  return null;
}

function setStatsCache(key: string, data: any): void {
  _statsMemCache[key] = { data, ts: Date.now() };
  pgRun(`INSERT INTO stats_cache (cache_key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT (cache_key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`,
    [key, JSON.stringify(data), Date.now()]
  ).catch(() => {});
}

// Carrega o stats_cache persistente (banco) na memória ao inicializar.
// Evita recalcular queries pesadas (60s) após cada restart do servidor.
export async function warmFromDBCache(): Promise<number> {
  try {
    const rows = await pgAll(
      `SELECT cache_key, data, updated_at FROM stats_cache WHERE cache_key NOT LIKE 'evolucao_%' AND cache_key NOT LIKE 'comparativo_%' AND cache_key NOT LIKE 'diagnostico_%'`,
      []
    ) as any[];
    const now = Date.now();
    let loaded = 0;
    for (const row of rows) {
      if (!row.data) continue;
      const age = now - (row.updated_at || 0);
      if (age > STATS_MEM_TTL_MS) continue;
      try {
        _statsMemCache[row.cache_key] = { data: JSON.parse(row.data), ts: row.updated_at || now };
        loaded++;
      } catch {}
    }
    return loaded;
  } catch {
    return 0;
  }
}

export async function getCensoEstatisticas(ano: number) {
  const cacheKey = `censo_stats_${ano}`;
  const cached = getStatsCache(cacheKey);
  if (cached) return cached;

  const row = await pgGet(`SELECT count(*) as total_escolas, coalesce(sum(matriculas),0) as total_matriculas, coalesce(sum(docentes),0) as total_docentes, coalesce(sum(turmas),0) as total_turmas FROM censo_escolar WHERE ano = ?`, [ano]) as any;
  const groupByRaw = async (col: string) => {
    const rows = await pgAll(`SELECT ${col} as key, count(*) as count FROM censo_escolar WHERE ano = ? AND ${col} IS NOT NULL GROUP BY ${col}`, [ano]) as any[];
    const result: Record<string, number> = {};
    for (const r of rows) result[r.key] = Number(r.count);
    return result;
  };
  const result = {
    ano,
    total_escolas: Number(row?.total_escolas) || 0,
    total_matriculas: Number(row?.total_matriculas) || 0,
    total_docentes: Number(row?.total_docentes) || 0,
    total_turmas: Number(row?.total_turmas) || 0,
    por_dependencia: await groupByRaw('dependencia'),
    por_localizacao: await groupByRaw('localizacao'),
    por_uf: await groupByRaw('uf'),
    por_situacao: await groupByRaw('situacao'),
  };
  setStatsCache(cacheKey, result);
  return result;
}

export async function listIndicador(tipo: string, ano: number, filters: Record<string, string> = {}, page = 1, perPage = 20) {
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
  const countResultArr = await db.select({ count: sql<number>`count(*)` }).from(indicadoresEducacionais).where(whereClause);
  const total = Number(countResultArr[0]?.count) || 0;
  const totalPages = Math.ceil(total / perPage);
  const offset = (page - 1) * perPage;

  const pageRows = await db.select().from(indicadoresEducacionais)
    .where(whereClause)
    .limit(perPage)
    .offset(offset);

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

export async function getIndicadorDetail(tipo: string, ano: number, inep: string) {
  const arr = await db.select().from(indicadoresEducacionais)
    .where(and(
      eq(indicadoresEducacionais.tipo, tipo),
      eq(indicadoresEducacionais.ano, ano),
      eq(indicadoresEducacionais.inep, inep)
    ))
    .limit(1);
  const row = arr[0] || null;
  if (!row) return null;
  const dados = row.dados ? JSON.parse(row.dados) : {};
  return { co_entidade: parseInt(row.inep), ano: row.ano, ...dados };
}

export async function getEscolaCompleta(inep: string) {
  const censoRows = await db.select().from(censoEscolar)
    .where(eq(censoEscolar.inep, inep));

  const indRows = await db.select().from(indicadoresEducacionais)
    .where(eq(indicadoresEducacionais.inep, inep));

  if (censoRows.length === 0 && indRows.length === 0) return null;

  const allYears = new Set<string>();
  censoRows.forEach(r => allYears.add(String(r.ano)));
  indRows.forEach(r => allYears.add(String(r.ano)));

  const anosDisponiveis = [...allYears].sort();

  const dados: Record<string, any> = {};
  for (const anoStr of anosDisponiveis) {
    const ano = parseInt(anoStr);
    const anoData: any = {};

    const censo = censoRows.find(r => Number(r.ano) === ano);
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

export async function getApiInfo() {
  const stats = await getLocalStats();
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

export async function getMediasNacionais(ano?: number) {
  const cacheKey = `medias_nacionais_${ano || 'latest'}`;
  const cached = getStatsCache(cacheKey);
  if (cached) return cached;

  const tiposParaMedias = ['ideb', 'taxas_rendimento', 'tdi', 'atu', 'had', 'afd', 'dsu', 'ird', 'icg', 'inse', 'ied', 'saeb'];
  const result: Record<string, any> = {};

  for (const tipo of tiposParaMedias) {
    const anoQuery = ano
      ? await pgAll(`SELECT dados FROM indicadores_educacionais WHERE tipo = ? AND ano = ?`, [tipo, ano]) as any[]
      : await pgAll(`SELECT dados FROM indicadores_educacionais WHERE tipo = ? AND ano = (SELECT MAX(ano) FROM indicadores_educacionais WHERE tipo = ?)`, [tipo, tipo]) as any[];

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

// ────────────────────────────────────────────────────────────────
// CENSO 2025 DETALHADO – dados das 4 tabelas importadas do INEP
// ────────────────────────────────────────────────────────────────
const _n = (v: any) => (v !== null && v !== undefined ? Number(v) || 0 : 0);

export async function getEscolaCenso2025(inep: string) {
  const coEntidade = inep.toString().trim();

  const [matRows, turRows, docRows, gestRows, cursoRows] = await Promise.all([
    pgAll(`SELECT dados_json FROM matricula_escola WHERE co_entidade = $1 AND ano = '2025' LIMIT 1`, [coEntidade]),
    pgAll(`SELECT dados_json FROM turma_escola WHERE co_entidade = $1 AND ano = '2025' LIMIT 1`, [coEntidade]),
    pgAll(`SELECT dados_json FROM docente_escola WHERE co_entidade = $1 AND ano = '2025' LIMIT 1`, [coEntidade]),
    pgAll(`SELECT dados_json FROM gestor_escolar WHERE co_entidade = $1 AND ano = '2025' LIMIT 1`, [coEntidade]),
    pgAll(`SELECT dados_json FROM curso_tecnico_escola WHERE co_entidade = $1 AND ano = '2025'`, [coEntidade]),
  ]);

  if (!matRows.length && !turRows.length && !docRows.length && !gestRows.length) return null;

  const parse = (rows: any[]) => {
    if (!rows.length) return {};
    const d = rows[0].dados_json;
    return typeof d === 'string' ? JSON.parse(d) : (d ?? {});
  };

  const mat  = parse(matRows);
  const tur  = parse(turRows);
  const doc  = parse(docRows);
  const gest = parse(gestRows);

  const cursos = cursoRows.map((r: any) => {
    const d = typeof r.dados_json === 'string' ? JSON.parse(r.dados_json) : (r.dados_json ?? {});
    return {
      codigo:           d.CO_CURSO_EDUC_PROFISSIONAL ?? null,
      nome:             d.NO_CURSO_EDUC_PROFISSIONAL ?? null,
      area_codigo:      d.ID_AREA_CURSO_PROFISSIONAL ?? null,
      area_nome:        d.NO_AREA_CURSO_PROFISSIONAL ?? null,
      qt_cursos:        _n(d.QT_CURSO_TEC),
      qt_matriculas:    _n(d.QT_MAT_CURSO_TEC),
      modalidade: {
        integrado:   _n(d.QT_CURSO_TEC_IFTP),
        concomitante: _n(d.QT_CURSO_TEC_CONC),
        subsequente:  _n(d.QT_CURSO_TEC_SUBS),
        eja:          _n(d.QT_CURSO_TEC_EJA),
        novo_medio:   _n(d.QT_CURSO_TEC_NM),
      },
      matriculas_modalidade: {
        integrado:    _n(d.QT_MAT_CURSO_TEC_IFTP),
        concomitante: _n(d.QT_MAT_CURSO_TEC_CONC),
        subsequente:  _n(d.QT_MAT_CURSO_TEC_SUBS),
        eja:          _n(d.QT_MAT_CURSO_TEC_EJA),
        novo_medio:   _n(d.QT_MAT_CURSO_TEC_NM),
      },
    };
  });

  return {
    co_entidade: coEntidade,
    ano: 2025,
    fonte: 'inep_censo_escolar_2025',

    matriculas: {
      total:        _n(mat.QT_MAT_BAS),
      infantil:     _n(mat.QT_MAT_INF),
      creche:       _n(mat.QT_MAT_INF_CRE),
      pre_escola:   _n(mat.QT_MAT_INF_PRE),
      fundamental:  _n(mat.QT_MAT_FUND),
      fund_ai:      _n(mat.QT_MAT_FUND_AI),
      fund_af:      _n(mat.QT_MAT_FUND_AF),
      medio:        _n(mat.QT_MAT_MED),
      eja:          _n(mat.QT_MAT_EJA),
      eja_fund:     _n(mat.QT_MAT_EJA_FUND),
      eja_med:      _n(mat.QT_MAT_EJA_MED),
      especial:     _n(mat.QT_MAT_ESP),
      esp_cc:       _n(mat.QT_MAT_ESP_CC),
      esp_ce:       _n(mat.QT_MAT_ESP_CE),
      profissional: _n(mat.QT_MAT_PROF),
      diurno:       _n(mat.QT_MAT_BAS_D),
      noturno:      _n(mat.QT_MAT_BAS_N),
      integral:     _n(mat.QT_MAT_BAS_INT),
      por_genero: {
        feminino:  _n(mat.QT_MAT_BAS_FEM),
        masculino: _n(mat.QT_MAT_BAS_MASC),
      },
      por_raca: {
        branca:        _n(mat.QT_MAT_BAS_BRANCA),
        preta:         _n(mat.QT_MAT_BAS_PRETA),
        parda:         _n(mat.QT_MAT_BAS_PARDA),
        amarela:       _n(mat.QT_MAT_BAS_AMARELA),
        indigena:      _n(mat.QT_MAT_BAS_INDIGENA),
        nao_declarada: _n(mat.QT_MAT_BAS_ND),
      },
      por_faixa_etaria: {
        ate_3_anos:  _n(mat.QT_MAT_BAS_0_3),
        de_4_5:      _n(mat.QT_MAT_BAS_4_5),
        de_6_10:     _n(mat.QT_MAT_BAS_6_10),
        de_11_14:    _n(mat.QT_MAT_BAS_11_14),
        de_15_17:    _n(mat.QT_MAT_BAS_15_17),
        de_18_mais:  _n(mat.QT_MAT_BAS_18_MAIS) || (_n(mat.QT_MAT_BAS_18_19) + _n(mat.QT_MAT_BAS_20_24) + _n(mat.QT_MAT_BAS_25_29) + _n(mat.QT_MAT_BAS_30_34) + _n(mat.QT_MAT_BAS_35_39) + _n(mat.QT_MAT_BAS_40_49) + _n(mat.QT_MAT_BAS_50_MAIS)),
      },
      zona: {
        urbana: _n(mat.QT_MAT_ZR_URB),
        rural:  _n(mat.QT_MAT_ZR_RUR),
      },
      integral_por_etapa: {
        infantil:  _n(mat.QT_MAT_INF_INT),
        fund_ai:   _n(mat.QT_MAT_FUND_AI_INT),
        fund_af:   _n(mat.QT_MAT_FUND_AF_INT),
        medio:     _n(mat.QT_MAT_MED_INT),
        eja:       _n(mat.QT_MAT_EJA_INT),
      },
    },

    turmas: {
      total:        _n(tur.QT_TUR_BAS),
      infantil:     _n(tur.QT_TUR_INF),
      fundamental:  _n(tur.QT_TUR_FUND),
      medio:        _n(tur.QT_TUR_MED),
      eja:          _n(tur.QT_TUR_EJA),
      especial:     _n(tur.QT_TUR_ESP),
      profissional: _n(tur.QT_TUR_PROF),
      diurno:       _n(tur.QT_TUR_BAS_D),
      noturno:      _n(tur.QT_TUR_BAS_N),
      integral:     _n(tur.QT_TUR_BAS_INT),
    },

    docentes: {
      total:       _n(doc.QT_DOC_BAS),
      infantil:    _n(doc.QT_DOC_INF),
      fundamental: _n(doc.QT_DOC_FUND),
      fund_ai:     _n(doc.QT_DOC_FUND_AI),
      fund_af:     _n(doc.QT_DOC_FUND_AF),
      medio:       _n(doc.QT_DOC_MED),
      eja:         _n(doc.QT_DOC_EJA),
      especial:    _n(doc.QT_DOC_ESP),
      feminino:    _n(doc.QT_DOC_BAS_FEM),
      masculino:   _n(doc.QT_DOC_BAS_MASC),
      por_raca: {
        branca:   _n(doc.QT_DOC_BAS_BRANCA),
        preta:    _n(doc.QT_DOC_BAS_PRETA),
        parda:    _n(doc.QT_DOC_BAS_PARDA),
        amarela:  _n(doc.QT_DOC_BAS_AMARELA),
        indigena: _n(doc.QT_DOC_BAS_INDIGENA),
        nao_declarada: _n(doc.QT_DOC_BAS_ND),
      },
      por_faixa: {
        ate_24:   _n(doc.QT_DOC_BAS_0_24),
        de_25_29: _n(doc.QT_DOC_BAS_25_29),
        de_30_39: _n(doc.QT_DOC_BAS_30_39),
        de_40_49: _n(doc.QT_DOC_BAS_40_49),
        de_50_54: _n(doc.QT_DOC_BAS_50_54),
        de_55_59: _n(doc.QT_DOC_BAS_55_59),
        mais_60:  _n(doc.QT_DOC_BAS_60_MAIS),
      },
    },

    gestor: {
      total:      _n(gest.QT_GEST_BAS),
      feminino:   _n(gest.QT_GEST_BAS_FEM),
      masculino:  _n(gest.QT_GEST_BAS_MASC),
      diretor:    _n(gest.QT_GEST_BAS_DIRETOR),
      vice_diretor: _n(gest.QT_GEST_BAS_VICE_DIR),
      coordenador: _n(gest.QT_GEST_BAS_COORD_PED),
      concursado: _n(gest.QT_GEST_BAS_VINCULO_CONCUR),
      efetivo:    _n(gest.QT_GEST_BAS_VINCULO_EFET),
      com_ensino_superior: _n(gest.QT_GEST_BAS_ESCO_SUP_GRAD) + _n(gest.QT_GEST_BAS_ESCO_SUP_POS_ESPEC),
      pos_graduacao: _n(gest.QT_GEST_BAS_ESCO_SUP_POS_ESPEC),
      por_raca: {
        branca:        _n(gest.QT_GEST_BAS_BRANCA),
        preta:         _n(gest.QT_GEST_BAS_PRETA),
        parda:         _n(gest.QT_GEST_BAS_PARDA),
        amarela:       _n(gest.QT_GEST_BAS_AMARELA),
        indigena:      _n(gest.QT_GEST_BAS_INDIGENA),
        nao_declarada: _n(gest.QT_GEST_BAS_ND),
      },
      por_faixa: {
        ate_24:   _n(gest.QT_GEST_BAS_0_24),
        de_25_29: _n(gest.QT_GEST_BAS_25_29),
        de_30_39: _n(gest.QT_GEST_BAS_30_39),
        de_40_49: _n(gest.QT_GEST_BAS_40_49),
        de_50_54: _n(gest.QT_GEST_BAS_50_54),
        de_55_59: _n(gest.QT_GEST_BAS_55_59),
        mais_60:  _n(gest.QT_GEST_BAS_60_MAIS),
      },
    },

    cursos_tecnicos: {
      total_cursos:     cursos.reduce((s: number, c: any) => s + c.qt_cursos, 0),
      total_matriculas: cursos.reduce((s: number, c: any) => s + c.qt_matriculas, 0),
      cursos,
    },
  };
}
