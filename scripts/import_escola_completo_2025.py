#!/usr/bin/env python3
"""
Importação completa dos campos da Tabela_Escola_2025.csv → censo_escolas (ano=2025)
Inclui: geolocalização, saneamento, espaços, tecnologia, acessibilidade,
        educação ambiental, pessoal de apoio, modalidades, materiais pedagógicos.
"""
import csv, io, os, sys
import psycopg2

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'Dados',
                        'Censo Escolar 2025', 'Tabela_Escola_2025.csv')
DB_URL = os.environ['RAILWAY_DATABASE_URL']

# (coluna_banco, coluna_csv, tipo)  tipo: 'text'|'int'|'num'
CAMPOS = [
    # Geolocalização e endereço
    ('latitude',                   'LATITUDE',                   'num'),
    ('longitude',                  'LONGITUDE',                  'num'),
    ('ds_endereco',                'DS_ENDERECO',                'text'),
    ('nu_endereco',                'NU_ENDERECO',                'text'),
    ('no_bairro',                  'NO_BAIRRO',                  'text'),
    ('co_cep',                     'CO_CEP',                     'text'),
    ('no_mesorregiao',             'NO_MESORREGIAO',             'text'),
    ('co_mesorregiao',             'CO_MESORREGIAO',             'text'),
    ('no_microrregiao',            'NO_MICRORREGIAO',            'text'),
    ('co_microrregiao',            'CO_MICRORREGIAO',            'text'),
    ('no_distrito',                'NO_DISTRITO',                'text'),
    ('co_distrito',                'CO_DISTRITO',                'text'),
    ('dt_ano_letivo_inicio',       'DT_ANO_LETIVO_INICIO',       'text'),
    ('dt_ano_letivo_termino',      'DT_ANO_LETIVO_TERMINO',      'text'),
    # Água e saneamento
    ('in_agua_rede_publica',       'IN_AGUA_REDE_PUBLICA',       'text'),
    ('in_agua_poco_artesiano',     'IN_AGUA_POCO_ARTESIANO',     'text'),
    ('in_agua_cacimba',            'IN_AGUA_CACIMBA',            'text'),
    ('in_agua_fonte_rio',          'IN_AGUA_FONTE_RIO',          'text'),
    ('in_agua_inexistente',        'IN_AGUA_INEXISTENTE',        'text'),
    ('in_agua_carro_pipa',         'IN_AGUA_CARRO_PIPA',         'text'),
    ('in_energia_gerador_fossil',  'IN_ENERGIA_GERADOR_FOSSIL',  'text'),
    ('in_energia_inexistente',     'IN_ENERGIA_INEXISTENTE',     'text'),
    ('in_esgoto_fossa_septica',    'IN_ESGOTO_FOSSA_SEPTICA',    'text'),
    ('in_esgoto_fossa_comum',      'IN_ESGOTO_FOSSA_COMUM',      'text'),
    ('in_esgoto_fossa',            'IN_ESGOTO_FOSSA',            'text'),
    ('in_esgoto_inexistente',      'IN_ESGOTO_INEXISTENTE',      'text'),
    ('in_lixo_enterra',            'IN_LIXO_ENTERRA',            'text'),
    ('in_lixo_destino_final_publico','IN_LIXO_DESTINO_FINAL_PUBLICO','text'),
    ('in_lixo_descarta_outra_area','IN_LIXO_DESCARTA_OUTRA_AREA','text'),
    ('in_tratamento_lixo_reutiliza','IN_TRATAMENTO_LIXO_REUTILIZA','text'),
    # Espaços físicos
    ('in_auditorio',               'IN_AUDITORIO',               'text'),
    ('in_almoxarifado',            'IN_ALMOXARIFADO',            'text'),
    ('in_despensa',                'IN_DESPENSA',                'text'),
    ('in_patio_descoberto',        'IN_PATIO_DESCOBERTO',        'text'),
    ('in_quadra_esportes_coberta', 'IN_QUADRA_ESPORTES_COBERTA', 'text'),
    ('in_quadra_esportes_descoberta','IN_QUADRA_ESPORTES_DESCOBERTA','text'),
    ('in_sala_diretoria',          'IN_SALA_DIRETORIA',          'text'),
    ('in_sala_professor',          'IN_SALA_PROFESSOR',          'text'),
    ('in_secretaria',              'IN_SECRETARIA',              'text'),
    ('in_sala_leitura',            'IN_SALA_LEITURA',            'text'),
    ('in_biblioteca_sala_leitura', 'IN_BIBLIOTECA_SALA_LEITURA', 'text'),
    ('in_banheiro_funcionarios',   'IN_BANHEIRO_FUNCIONARIOS',   'text'),
    ('in_banheiro_chuveiro',       'IN_BANHEIRO_CHUVEIRO',       'text'),
    ('in_dormitorio_aluno',        'IN_DORMITORIO_ALUNO',        'text'),
    ('in_dormitorio_professor',    'IN_DORMITORIO_PROFESSOR',    'text'),
    ('in_sala_multiuso',           'IN_SALA_MULTIUSO',           'text'),
    ('in_sala_atelie_artes',       'IN_SALA_ATELIE_ARTES',       'text'),
    ('in_sala_musica_coral',       'IN_SALA_MUSICA_CORAL',       'text'),
    ('in_laboratorio_educ_prof',   'IN_LABORATORIO_EDUC_PROF',   'text'),
    ('in_parque_infantil',         'IN_PARQUE_INFANTIL',         'text'),
    ('in_piscina',                 'IN_PISCINA',                 'text'),
    ('qt_salas_utilizadas_acessiveis','QT_SALAS_UTILIZADAS_ACESSIVEIS','int'),
    ('qt_salas_utiliza_climatizadas','QT_SALAS_UTILIZA_CLIMATIZADAS','int'),
    # Tecnologia e equipamentos
    ('in_computador',              'IN_COMPUTADOR',              'text'),
    ('in_equip_impressora',        'IN_EQUIP_IMPRESSORA',        'text'),
    ('in_equip_impressora_mult',   'IN_EQUIP_IMPRESSORA_MULT',   'text'),
    ('in_equip_scanner',           'IN_EQUIP_SCANNER',           'text'),
    ('in_equip_som',               'IN_EQUIP_SOM',               'text'),
    ('in_equip_tv',                'IN_EQUIP_TV',                'text'),
    ('in_equip_dvd',               'IN_EQUIP_DVD',               'text'),
    ('in_equip_lousa_digital',     'IN_EQUIP_LOUSA_DIGITAL',     'text'),
    ('in_equip_multimidia',        'IN_EQUIP_MULTIMIDIA',        'text'),
    ('in_equip_parabolica',        'IN_EQUIP_PARABOLICA',        'text'),
    ('qt_equip_tv',                'QT_EQUIP_TV',                'int'),
    ('qt_equip_som',               'QT_EQUIP_SOM',               'int'),
    ('qt_equip_lousa_digital',     'QT_EQUIP_LOUSA_DIGITAL',     'int'),
    ('qt_equip_multimidia',        'QT_EQUIP_MULTIMIDIA',        'int'),
    ('in_internet_aprendizagem',   'IN_INTERNET_APRENDIZAGEM',   'text'),
    ('in_internet_administrativo', 'IN_INTERNET_ADMINISTRATIVO', 'text'),
    ('in_internet_comunidade',     'IN_INTERNET_COMUNIDADE',     'text'),
    ('in_acesso_internet_computador','IN_ACESSO_INTERNET_COMPUTADOR','text'),
    ('in_aces_internet_disp_pessoais','IN_ACES_INTERNET_DISP_PESSOAIS','text'),
    # Acessibilidade completa
    ('in_acessibilidade_corrimao', 'IN_ACESSIBILIDADE_CORRIMAO', 'text'),
    ('in_acessibilidade_elevador', 'IN_ACESSIBILIDADE_ELEVADOR', 'text'),
    ('in_acessibilidade_vao_livre','IN_ACESSIBILIDADE_VAO_LIVRE', 'text'),
    ('in_acessibilidade_sinal_sonoro','IN_ACESSIBILIDADE_SINAL_SONORO','text'),
    ('in_acessibilidade_sinal_tatil','IN_ACESSIBILIDADE_SINAL_TATIL','text'),
    ('in_acessibilidade_sinalizacao','IN_ACESSIBILIDADE_SINALIZACAO','text'),
    # Educação ambiental
    ('in_educ_ambiental',          'IN_EDUC_AMBIENTAL',          'text'),
    ('in_educ_amb_conteudo',       'IN_EDUC_AMB_CONTEUDO',       'text'),
    ('in_educ_amb_curricular',     'IN_EDUC_AMB_CURRICULAR',     'text'),
    ('in_educ_amb_eixo',           'IN_EDUC_AMB_EIXO',           'text'),
    ('in_educ_amb_eventos',        'IN_EDUC_AMB_EVENTOS',        'text'),
    ('in_educ_amb_projetos',       'IN_EDUC_AMB_PROJETOS',       'text'),
    ('in_educ_amb_nenhuma',        'IN_EDUC_AMB_NENHUMA',        'text'),
    # Pessoal de apoio
    ('qt_prof_administrativos',    'QT_PROF_ADMINISTRATIVOS',    'int'),
    ('qt_prof_servicos_gerais',    'QT_PROF_SERVICOS_GERAIS',    'int'),
    ('qt_prof_bibliotecario',      'QT_PROF_BIBLIOTECARIO',      'int'),
    ('qt_prof_saude',              'QT_PROF_SAUDE',              'int'),
    ('qt_prof_coordenador',        'QT_PROF_COORDENADOR',        'int'),
    ('qt_prof_fonaudiologo',       'QT_PROF_FONAUDIOLOGO',       'int'),
    ('qt_prof_nutricionista',      'QT_PROF_NUTRICIONISTA',      'int'),
    ('qt_prof_psicologo',          'QT_PROF_PSICOLOGO',          'int'),
    ('qt_prof_alimentacao',        'QT_PROF_ALIMENTACAO',        'int'),
    ('qt_prof_pedagogia',          'QT_PROF_PEDAGOGIA',          'int'),
    ('qt_prof_secretario',         'QT_PROF_SECRETARIO',         'int'),
    ('qt_prof_seguranca',          'QT_PROF_SEGURANCA',          'int'),
    ('qt_prof_monitores',          'QT_PROF_MONITORES',          'int'),
    ('qt_prof_gestao',             'QT_PROF_GESTAO',             'int'),
    ('qt_prof_assist_social',      'QT_PROF_ASSIST_SOCIAL',      'int'),
    ('qt_prof_trad_libras',        'QT_PROF_TRAD_LIBRAS',        'int'),
    ('qt_prof_revisor_braille',    'QT_PROF_REVISOR_BRAILLE',    'int'),
    # Organização pedagógica
    ('tp_aee',                     'TP_AEE',                     'int'),
    ('tp_atividade_complementar',  'TP_ATIVIDADE_COMPLEMENTAR',  'int'),
    ('in_espaco_atividade',        'IN_ESPACO_ATIVIDADE',        'text'),
    ('in_espaco_equipamento',      'IN_ESPACO_EQUIPAMENTO',      'text'),
    ('in_regular',                 'IN_REGULAR',                 'text'),
    ('in_eja',                     'IN_EJA',                     'text'),
    ('in_profissionalizante',      'IN_PROFISSIONALIZANTE',      'text'),
    ('in_especial_exclusiva',      'IN_ESPECIAL_EXCLUSIVA',      'text'),
    ('in_mediacao_presencial',     'IN_MEDIACAO_PRESENCIAL',     'text'),
    ('in_mediacao_semipresencial', 'IN_MEDIACAO_SEMIPRESENCIAL', 'text'),
    ('in_mediacao_ead',            'IN_MEDIACAO_EAD',            'text'),
    # Modalidades por etapa
    ('in_comum_fund_ai',           'IN_COMUM_FUND_AI',           'text'),
    ('in_comum_fund_af',           'IN_COMUM_FUND_AF',           'text'),
    ('in_comum_medio_medio',       'IN_COMUM_MEDIO_MEDIO',       'text'),
    ('in_comum_medio_integrado',   'IN_COMUM_MEDIO_INTEGRADO',   'text'),
    ('in_comum_medio_fic',         'IN_COMUM_MEDIO_FIC',         'text'),
    ('in_comum_eja_fund',          'IN_COMUM_EJA_FUND',          'text'),
    ('in_comum_eja_medio',         'IN_COMUM_EJA_MEDIO',         'text'),
    ('in_comum_eja_prof',          'IN_COMUM_EJA_PROF',          'text'),
    ('in_comum_prof',              'IN_COMUM_PROF',              'text'),
    # Participação complementar
    ('in_orgao_ass_pais_mestres',  'IN_ORGAO_ASS_PAIS_MESTRES',  'text'),
    ('in_orgao_outros',            'IN_ORGAO_OUTROS',            'text'),
    ('in_orgao_nenhum',            'IN_ORGAO_NENHUM',            'text'),
    # Materiais pedagógicos
    ('in_material_ped_multimidia', 'IN_MATERIAL_PED_MULTIMIDIA', 'text'),
    ('in_material_ped_cientifico', 'IN_MATERIAL_PED_CIENTIFICO', 'text'),
    ('in_material_ped_jogos',      'IN_MATERIAL_PED_JOGOS',      'text'),
    ('in_material_ped_musical',    'IN_MATERIAL_PED_MUSICAL',    'text'),
    ('in_material_ped_artisticas', 'IN_MATERIAL_PED_ARTISTICAS', 'text'),
    ('in_material_ped_desportiva', 'IN_MATERIAL_PED_DESPORTIVA', 'text'),
    ('in_material_ped_profissional','IN_MATERIAL_PED_PROFISSIONAL','text'),
    ('in_material_ped_agricola',   'IN_MATERIAL_PED_AGRICOLA',   'text'),
    ('in_material_ped_bil_surdos', 'IN_MATERIAL_PED_BIL_SURDOS', 'text'),
    ('in_material_ped_etnico',     'IN_MATERIAL_PED_ETNICO',     'text'),
    ('in_material_ped_edu_esp',    'IN_MATERIAL_PED_EDU_ESP',    'text'),
    ('in_material_ped_nenhum',     'IN_MATERIAL_PED_NENHUM',     'text'),
    # Prédio
    ('in_local_func_predio_escolar','IN_LOCAL_FUNC_PREDIO_ESCOLAR','text'),
    ('in_predio_compartilhado',    'IN_PREDIO_COMPARTILHADO',    'text'),
]

DB_COLS  = [c[0] for c in CAMPOS]
CSV_COLS = [c[1] for c in CAMPOS]
TIPOS    = {c[0]: c[2] for c in CAMPOS}

def to_val(v, tipo):
    if v is None: return None
    v = v.strip()
    if not v: return None
    if tipo == 'int':
        try: return str(int(float(v)))
        except: return None
    if tipo == 'num':
        # replace comma with dot for Brazilian decimal notation
        v = v.replace(',', '.')
        try: float(v); return v
        except: return None
    return v  # text

def main():
    print('Conectando...')
    conn = psycopg2.connect(DB_URL, sslmode='require')
    conn.autocommit = False
    cur = conn.cursor()

    # Temp table
    col_defs = ', '.join(f'{col} TEXT' for col in DB_COLS)
    cur.execute(f'CREATE TEMP TABLE _imp2 (co_entidade BIGINT, {col_defs})')
    print(f'Temp table criada ({len(CAMPOS)} campos)')

    # Lê CSV → buffer COPY
    print('Lendo CSV...')
    buf = io.StringIO()
    writer = csv.writer(buf, delimiter='\t', quotechar='"', lineterminator='\n')
    count = 0
    with open(CSV_PATH, encoding='latin-1', newline='') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            co = row.get('CO_ENTIDADE','').strip()
            if not co: continue
            vals = [co]
            for col, csv_col, tipo in CAMPOS:
                v = to_val(row.get(csv_col), tipo)
                vals.append('' if v is None else str(v))
            writer.writerow(vals)
            count += 1
            if count % 50000 == 0:
                print(f'  lidas: {count:,}')
    print(f'Total: {count:,} escolas')

    buf.seek(0)
    col_list = ['co_entidade'] + DB_COLS
    cur.copy_from(buf, '_imp2', sep='\t', null='', columns=col_list)
    print('COPY concluído')

    # UPDATE em massa
    set_parts = []
    for col, _, tipo in CAMPOS:
        if tipo == 'int':
            set_parts.append(f"{col} = NULLIF(t.{col},'')::INTEGER")
        elif tipo == 'num':
            set_parts.append(f"{col} = NULLIF(t.{col},'')::NUMERIC")
        else:
            set_parts.append(f"{col} = NULLIF(t.{col},'')")
    set_clause = ',\n        '.join(set_parts)

    cur.execute(f'''
        UPDATE censo_escolas c
        SET {set_clause}
        FROM _imp2 t
        WHERE c.co_entidade = t.co_entidade AND c.ano = 2025
    ''')
    updated = cur.rowcount
    conn.commit()
    print(f'UPDATE: {updated:,} linhas')

    # Verificação amostra
    cur.execute('''
        SELECT latitude, longitude, ds_endereco, no_bairro, co_cep,
               in_agua_rede_publica, in_esgoto_fossa_septica,
               in_sala_diretoria, in_computador, qt_salas_utiliza_climatizadas,
               in_educ_ambiental, qt_prof_coordenador, in_regular, in_eja,
               in_acessibilidade_corrimao, tp_aee
        FROM censo_escolas WHERE ano=2025 AND co_entidade=15044327
    ''')
    row = cur.fetchone()
    cols_desc = [d[0] for d in cur.description]
    print('\nVerificação (15044327):')
    for c, v in zip(cols_desc, row):
        print(f'  {c} = {v}')

    cur.close()
    conn.close()
    print('\nConcluído!')

if __name__ == '__main__':
    main()
