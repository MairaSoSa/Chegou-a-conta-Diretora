import fs from 'fs';
import readline from 'readline';
import { pgPool as pool } from './pg';

const DRIVE_FILES: Record<number, string> = {
  2020: '1WIgBpEQ_ArzVASZ6QmMnXleMbwjIP7Bq',
  2021: '1eO9j0qt-7B3qvaWu_S-WL7_9vjBGNSXc',
  2022: '1o8Oue88j4dcylb5386f4olg3rqRINyPE',
  2023: '1Ywntj1CCzLh4x8ro3_YI5GDkAgHWRpiC',
  2024: '1B-0g0aQKrhdxYLnH6UfQjl3bFHSmUang',
};

const DEP_MAP: Record<string, string> = {
  '1': 'Federal', '2': 'Estadual', '3': 'Municipal', '4': 'Privada',
};
const LOC_MAP: Record<string, string> = {
  '1': 'Urbana', '2': 'Rural',
};
const SIT_MAP: Record<string, string> = {
  '1': 'Em Atividade', '2': 'Paralisada', '3': 'Extinta', '4': 'Escola Estadual Extinta',
};

// Progress tracking (shared state for API polling)
export const importProgress: {
  running: boolean;
  ano: number | null;
  stage: string;
  processed: number;
  total: number;
  errors: string[];
  done: boolean;
  summary: Record<number, { processed: number; upserted: number }>;
} = {
  running: false,
  ano: null,
  stage: 'idle',
  processed: 0,
  total: 0,
  errors: [],
  done: false,
  summary: {},
};

async function downloadToFile(
  fileId: string,
  destPath: string,
  onProgress?: (bytes: number) => void,
): Promise<void> {
  const { ReplitConnectors } = await import('@replit/connectors-sdk');
  const connectors = new ReplitConnectors();

  const response = await connectors.proxy('google-drive', `/drive/v3/files/${fileId}?alt=media`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }

  const body = response.body as ReadableStream<Uint8Array> | null;
  if (!body) throw new Error('Response body is null');

  const fileStream = fs.createWriteStream(destPath);
  const reader = body.getReader();
  let totalBytes = 0;

  return new Promise((resolve, reject) => {
    function pump(): void {
      reader.read().then(({ done, value }) => {
        if (done) {
          fileStream.end();
          fileStream.on('finish', resolve);
          fileStream.on('error', reject);
          return;
        }
        totalBytes += value.byteLength;
        if (onProgress) onProgress(totalBytes);
        const ok = fileStream.write(Buffer.from(value));
        if (ok) {
          pump();
        } else {
          fileStream.once('drain', pump);
        }
      }).catch(reject);
    }
    pump();
  });
}

// Fields to capture per row (subset that matters for the dashboard)
const NUMERIC_FIELDS = [
  'qt_mat_bas','qt_mat_inf','qt_mat_inf_cre','qt_mat_inf_pre',
  'qt_mat_fund','qt_mat_fund_ai','qt_mat_fund_af',
  'qt_mat_med','qt_mat_prof','qt_mat_prof_tec',
  'qt_mat_eja','qt_mat_eja_fund','qt_mat_eja_med',
  'qt_mat_esp','qt_mat_esp_cc','qt_mat_esp_ce',
  'qt_mat_bas_fem','qt_mat_bas_masc','qt_mat_bas_nd',
  'qt_mat_bas_branca','qt_mat_bas_preta','qt_mat_bas_parda',
  'qt_mat_bas_amarela','qt_mat_bas_indigena',
  'qt_mat_branca','qt_mat_preta','qt_mat_parda',
  'qt_mat_amarela','qt_mat_indigena','qt_mat_nd',
  'qt_mat_bas_0_3','qt_mat_bas_4_5','qt_mat_bas_6_10',
  'qt_mat_bas_11_14','qt_mat_bas_15_17','qt_mat_bas_18_mais',
  'qt_mat_bas_d','qt_mat_bas_n','qt_mat_bas_ead',
  'qt_mat_zr_urba','qt_mat_zr_rura',
  'qt_mat_int','qt_mat_int_fund','qt_mat_int_med',
  'qt_mat_inf_int','qt_mat_inf_cre_int','qt_mat_inf_pre_int',
  'qt_mat_fund_int','qt_mat_fund_ai_int','qt_mat_fund_af_int',
  'qt_mat_med_int',
  'qt_tur_bas','qt_tur_bas_d','qt_tur_bas_n','qt_tur_bas_ead',
  'qt_tur_inf','qt_tur_inf_cre','qt_tur_inf_pre',
  'qt_tur_fund','qt_tur_fund_ai','qt_tur_fund_af',
  'qt_tur_med','qt_tur_prof','qt_tur_eja','qt_tur_eja_fund','qt_tur_eja_med',
  'qt_tur_esp','qt_tur_esp_cc','qt_tur_esp_ce',
  'qt_tur_inf_int','qt_tur_fund_ai_int','qt_tur_fund_af_int','qt_tur_med_int',
  'qt_doc_bas','qt_doc_inf','qt_doc_inf_cre','qt_doc_inf_pre',
  'qt_doc_fund','qt_doc_fund_ai','qt_doc_fund_af',
  'qt_doc_med','qt_doc_prof','qt_doc_prof_tec',
  'qt_doc_eja','qt_doc_eja_fund','qt_doc_eja_med',
  'qt_doc_esp','qt_doc_esp_cc','qt_doc_esp_ce',
  'qt_gest_bas',
  'qt_salas_existentes','qt_salas_utilizadas',
  'qt_salas_utiliza_climatizadas','qt_salas_utilizadas_acessiveis',
  'qt_salas_utilizadas_dentro','qt_salas_utilizadas_fora',
  'qt_equip_tv','qt_equip_som','qt_equip_multimidia','qt_equip_lousa_digital',
  'qt_equip_impressora','qt_equip_impressora_mult','qt_equip_copiadora',
  'qt_equip_dvd','qt_equip_parabolica',
  'qt_desktop_aluno','qt_comp_portatil_aluno','qt_tablet_aluno',
  'qt_comp_aluno',
  'qt_desktop_adm','qt_comp_portatil_adm',
  'qt_transp_publico','qt_transp_carros','qt_transp_onibus','qt_transp_bicicleta',
  'qt_transp_nao','qt_transp_outros',
  'qt_transp_resp_est','qt_transp_resp_mun',
];

const BINARY_FIELDS = [
  'in_agua_potavel','in_agua_filtrada','in_agua_rede_publica','in_agua_poco_artesiano',
  'in_agua_cacimba','in_agua_fonte_rio','in_agua_inexistente',
  'in_energia_rede_publica','in_energia_gerador','in_energia_gerador_fossil',
  'in_energia_outros','in_energia_renovavel','in_energia_inexistente',
  'in_esgoto_rede_publica','in_esgoto_fossa_septica','in_esgoto_fossa_comum',
  'in_esgoto_fossa','in_esgoto_inexistente',
  'in_lixo_servico_coleta','in_lixo_queima','in_lixo_enterra',
  'in_lixo_destino_final_publico','in_lixo_descarta_outra_area',
  'in_lixo_joga_outra_area','in_lixo_outros','in_lixo_recicla',
  'in_tratamento_lixo_separacao','in_tratamento_lixo_reutiliza',
  'in_tratamento_lixo_reciclagem','in_tratamento_lixo_inexistente',
  'in_almoxarifado','in_area_verde','in_auditorio',
  'in_banheiro','in_banheiro_fora_predio','in_banheiro_dentro_predio',
  'in_banheiro_ei','in_banheiro_pne','in_banheiro_funcionarios','in_banheiro_chuveiro',
  'in_bercario','in_biblioteca','in_biblioteca_sala_leitura',
  'in_cozinha','in_despensa','in_dormitorio_aluno','in_dormitorio_professor',
  'in_laboratorio_ciencias','in_laboratorio_informatica','in_laboratorio_educ_prof',
  'in_patio_coberto','in_patio_descoberto','in_parque_infantil',
  'in_piscina','in_quadra_esportes','in_quadra_esportes_coberta','in_quadra_esportes_descoberta',
  'in_refeitorio',
  'in_sala_atelie_artes','in_sala_musica_coral','in_sala_estudio_danca',
  'in_sala_multiuso','in_sala_oficinas_educ_prof','in_sala_estudio_gravacao',
  'in_sala_diretoria','in_sala_leitura','in_sala_professor',
  'in_sala_repouso_aluno','in_secretaria','in_sala_atendimento_especial',
  'in_terreirao','in_viveiro','in_lavanderia',
  'in_dependencias_pne','in_dependencias_outras','in_predio_compartilhado',
  'in_area_plantio',
  'in_acessibilidade_corrimao','in_acessibilidade_elevador',
  'in_acessibilidade_pisos_tateis','in_acessibilidade_vao_livre',
  'in_acessibilidade_rampas','in_acessibilidade_sinal_sonoro',
  'in_acessibilidade_sinal_tatil','in_acessibilidade_sinal_visual',
  'in_acessibilidade_inexistente',
  'in_computador','in_desktop_aluno','in_comp_portatil_aluno','in_tablet_aluno',
  'in_internet','in_internet_alunos','in_internet_administrativo',
  'in_internet_aprendizagem','in_internet_comunidade',
  'in_acesso_internet_computador','in_aces_internet_disp_pessoais',
  'in_banda_larga','in_rede_local','in_wifi',
  'in_equip_parabolica',
  'in_equip_copiadora','in_equip_impressora','in_equip_impressora_mult',
  'in_equip_scanner','in_equip_nenhum','in_equip_dvd','in_equip_som',
  'in_equip_tv','in_equip_lousa_digital','in_equip_multimidia',
  'in_equip_videocassete','in_equip_retroprojetor',
  'in_equip_transpor_vans_micro','in_equip_transpor_micro_onibus',
  'in_equip_transpor_onibus','in_equip_transpor_bicicleta',
  'in_equip_transpor_tracao_animal','in_equip_transpor_rodoviario',
  'in_equip_transpor_aquaviario','in_equip_transpor_ferroviario',
  'in_alimentacao',
  'in_prof_administrativos','in_prof_servicos_gerais','in_prof_bibliotecario',
  'in_prof_saude','in_prof_coordenador','in_prof_fonaudiologo',
  'in_prof_nutricionista','in_prof_psicologo','in_prof_alimentacao',
  'in_prof_pedagogia','in_prof_secretario','in_prof_seguranca',
  'in_prof_monitores','in_prof_gestao','in_prof_assist_social',
  'in_prof_interprete_libras','in_prof_apoio',
  'in_material_ped_multimidia','in_material_ped_infantil','in_material_ped_cientifico',
  'in_material_ped_difusao','in_material_ped_musical','in_material_ped_jogos',
  'in_material_ped_artisticas','in_material_ped_profissional',
  'in_material_ped_desportiva','in_material_ped_indigena',
  'in_material_ped_etnico','in_material_ped_campo','in_material_ped_nenhum',
  'in_esp_cc','in_esp_ce',
  'in_inf','in_inf_cre','in_inf_pre','in_fund','in_fund_ai','in_fund_af',
  'in_med','in_prof','in_prof_tec','in_eja','in_eja_fund','in_eja_med',
  'in_esp','in_bas','in_regular','in_diurno','in_noturno','in_ead',
  'in_tempo_integral',
  'in_local_func_predio_escolar','in_local_func_salas_empresa',
  'in_local_func_socioeducativo','in_local_func_unid_prisional',
  'in_local_func_prisional_socio','in_local_func_templo_igreja',
  'in_local_func_casa_professor','in_local_func_galpao',
  'in_local_func_salas_outra_esc','in_local_func_outros',
  'in_vinculo_secretaria_educacao','in_vinculo_seguranca_publica',
  'in_vinculo_secretaria_saude','in_vinculo_outro_orgao',
  'in_poder_publico_parceria',
  'in_educacao_indigena','in_educacao_quilombola',
  'in_educacao_campo','in_educacao_ambiental',
  'in_horta','in_compostagem',
  'in_orgao_ass_pais','in_orgao_ass_pais_mestres',
  'in_orgao_conselho_escolar','in_orgao_gremio_estudantil',
  'in_orgao_outros','in_orgao_nenhum',
  'in_ppp',
  'in_lingua_ingles','in_lingua_espanhol','in_lingua_frances',
  'in_lingua_libras','in_lingua_indigena','in_lingua_outra_estrang',
  'in_esp_libras','in_esp_braille','in_esp_comunicacao_alternativa',
  'in_esp_orient_mobilidade','in_esp_enriquecimento_curricular',
];

function parseRow(headers: string[], values: string[], ano: number): Record<string, any> | null {
  const row: Record<string, string> = {};
  headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim(); });

  const inep = row['co_entidade'];
  if (!inep) return null;

  const dep = row['tp_dependencia'];
  if (!['1', '2', '3'].includes(dep)) return null;

  const dados: Record<string, any> = {
    co_entidade:    parseInt(inep),
    co_municipio:   row['co_municipio'] ? parseInt(row['co_municipio']) : null,
    co_regiao:      row['co_regiao']    ? parseInt(row['co_regiao'])    : null,
    co_uf:          row['co_uf']        ? parseInt(row['co_uf'])        : null,
    no_entidade:    row['no_entidade']  ?? null,
    no_municipio:   row['no_municipio'] ?? null,
    no_regiao:      row['no_regiao']    ?? null,
    sg_uf:          row['sg_uf']        ?? null,
    no_bairro:      row['no_bairro']    ?? null,
    co_cep:         row['co_cep']       ?? null,
    ds_endereco:    row['ds_endereco']  ?? null,
    ds_dependencia: DEP_MAP[dep]        ?? dep,
    ds_localizacao: LOC_MAP[row['tp_localizacao']] ?? row['tp_localizacao'] ?? null,
    ds_situacao:    SIT_MAP[row['tp_situacao_funcionamento']] ?? row['tp_situacao_funcionamento'] ?? null,
    tp_dependencia: dep ? parseInt(dep) : null,
    tp_localizacao: row['tp_localizacao'] ? parseInt(row['tp_localizacao']) : null,
    tp_situacao_funcionamento: row['tp_situacao_funcionamento'] ? parseInt(row['tp_situacao_funcionamento']) : null,
    telefone:       row['nu_telefone']  ? `(${row['nu_ddd']}) ${row['nu_telefone']}` : null,
  };

  for (const field of NUMERIC_FIELDS) {
    const val = row[field];
    if (val !== undefined && val !== '' && val !== '.') {
      const num = parseInt(val);
      dados[field] = isNaN(num) ? null : num;
    } else if (val !== undefined) {
      dados[field] = null;
    }
  }

  for (const field of BINARY_FIELDS) {
    const val = row[field];
    if (val !== undefined && val !== '' && val !== '.') {
      const num = parseInt(val);
      dados[field] = isNaN(num) ? null : num;
    } else if (val !== undefined) {
      dados[field] = null;
    }
  }

  return dados;
}

async function upsertBatchPg(rows: Record<string, any>[], ano: number): Promise<number> {
  if (rows.length === 0) return 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ineps = rows.map(d => String(d.co_entidade));
    const placeholders = ineps.map((_, i) => `$${i + 2}`).join(',');
    await client.query(
      `DELETE FROM censo_escolar WHERE ano=$1 AND inep IN (${placeholders})`,
      [ano, ...ineps]
    );

    const now = Date.now();
    for (const d of rows) {
      await client.query(
        `INSERT INTO censo_escolar (inep, ano, nome, municipio, uf, dependencia, localizacao, situacao, matriculas, docentes, turmas, dados, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          String(d.co_entidade),
          ano,
          d.no_entidade ?? null,
          d.no_municipio ?? null,
          d.sg_uf ?? null,
          d.ds_dependencia ?? null,
          d.ds_localizacao ?? null,
          d.ds_situacao ?? null,
          d.qt_mat_bas ?? null,
          d.qt_doc_bas ?? null,
          d.qt_tur_bas ?? null,
          JSON.stringify(d),
          now,
        ]
      );
    }

    await client.query('COMMIT');
    return rows.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function importDriveYear(ano: number): Promise<{ processed: number; upserted: number }> {
  const fileId = DRIVE_FILES[ano];
  if (!fileId) throw new Error(`No Drive file for year ${ano}`);

  importProgress.running = true;
  importProgress.ano = ano;
  importProgress.stage = 'downloading';
  importProgress.processed = 0;
  importProgress.errors = [];
  importProgress.done = false;

  const tempPath = `/tmp/microdados_${ano}.csv`;

  try {
    console.log(`[drive-import] Downloading ${ano} (${fileId})...`);
    await downloadToFile(fileId, tempPath, (bytes) => {
      importProgress.stage = `downloading (${(bytes / 1024 / 1024).toFixed(1)} MB)`;
    });
    console.log(`[drive-import] Downloaded ${ano}, size: ${(fs.statSync(tempPath).size / 1024 / 1024).toFixed(1)} MB`);

    importProgress.stage = 'parsing';

    const fileStream = fs.createReadStream(tempPath, { encoding: 'latin1' as BufferEncoding });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let headers: string[] = [];
    let batch: Record<string, any>[] = [];
    let processed = 0;
    let upserted = 0;

    for await (const line of rl) {
      if (!line.trim()) continue;

      if (headers.length === 0) {
        headers = line.split(';').map(h => h.trim().toLowerCase());
        console.log(`[drive-import] ${ano}: ${headers.length} columns detected`);
        continue;
      }

      const values = line.split(';');
      const dados = parseRow(headers, values, ano);
      if (!dados) continue;

      batch.push(dados);

      if (batch.length >= 500) {
        const n = await upsertBatchPg(batch, ano);
        upserted += n;
        processed += batch.length;
        importProgress.processed = processed;
        importProgress.stage = `processing (${processed.toLocaleString('pt-BR')} escolas)`;
        batch = [];
      }
    }

    if (batch.length > 0) {
      const n = await upsertBatchPg(batch, ano);
      upserted += n;
      processed += batch.length;
    }

    importProgress.summary[ano] = { processed, upserted };
    console.log(`[drive-import] ${ano}: done — ${processed} processed, ${upserted} upserted`);

    return { processed, upserted };
  } finally {
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
    if (importProgress.running && importProgress.ano === ano) {
      importProgress.running = false;
      importProgress.done = true;
      importProgress.stage = 'done';
    }
  }
}

export async function importAllDriveYears(anos: number[] = [2020, 2021, 2022, 2023, 2024]): Promise<void> {
  importProgress.running = true;
  importProgress.done = false;
  importProgress.summary = {};
  importProgress.errors = [];

  for (const ano of anos) {
    try {
      await importDriveYear(ano);
    } catch (err: any) {
      console.error(`[drive-import] Error on ${ano}:`, err);
      importProgress.errors.push(`${ano}: ${err.message}`);
    }
  }

  importProgress.running = false;
  importProgress.done = true;
  importProgress.stage = 'done';
}
