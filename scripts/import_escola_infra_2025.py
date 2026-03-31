#!/usr/bin/env python3
"""
Importa campos de infraestrutura, sustentabilidade, inclusão e participação
da Tabela_Escola_2025.csv para censo_escolas (ano=2025)

Estratégia: COPY FROM para temp table → UPDATE em massa
"""
import csv
import io
import os
import sys
import psycopg2
import psycopg2.extras

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'Dados',
                        'Censo Escolar 2025', 'Tabela_Escola_2025.csv')
DB_URL = os.environ.get('RAILWAY_DATABASE_URL')

# Mapeamento: coluna_banco → coluna_CSV (maiúsculas no CSV)
CAMPOS_BIN = [
    ('in_banheiro',                   'IN_BANHEIRO'),
    ('in_banheiro_pne',               'IN_BANHEIRO_PNE'),
    ('in_laboratorio_ciencias',       'IN_LABORATORIO_CIENCIAS'),
    ('in_patio_coberto',              'IN_PATIO_COBERTO'),
    ('in_cozinha',                    'IN_COZINHA'),
    ('in_refeitorio',                 'IN_REFEITORIO'),
    ('in_internet_alunos',            'IN_INTERNET_ALUNOS'),
    ('in_energia_renovavel',          'IN_ENERGIA_RENOVAVEL'),
    ('in_lixo_servico_coleta',        'IN_LIXO_SERVICO_COLETA'),
    ('in_lixo_queima',                'IN_LIXO_QUEIMA'),
    ('in_tratamento_lixo_separacao',  'IN_TRATAMENTO_LIXO_SEPARACAO'),
    ('in_tratamento_lixo_reciclagem', 'IN_TRATAMENTO_LIXO_RECICLAGEM'),
    ('in_tratamento_lixo_inexistente','IN_TRATAMENTO_LIXO_INEXISTENTE'),
    ('in_area_verde',                 'IN_AREA_VERDE'),
    ('in_area_plantio',               'IN_AREA_PLANTIO'),
    ('in_sala_atendimento_especial',  'IN_SALA_ATENDIMENTO_ESPECIAL'),
    ('in_acessibilidade_rampas',      'IN_ACESSIBILIDADE_RAMPAS'),
    ('in_acessibilidade_pisos_tateis','IN_ACESSIBILIDADE_PISOS_TATEIS'),
    ('in_acessibilidade_sinal_visual','IN_ACESSIBILIDADE_SINAL_VISUAL'),
    ('in_acessibilidade_inexistente', 'IN_ACESSIBILIDADE_INEXISTENTE'),
    ('in_educacao_indigena',          'IN_EDUCACAO_INDIGENA'),
    ('in_orgao_conselho_escolar',     'IN_ORGAO_CONSELHO_ESCOLAR'),
    ('in_orgao_ass_pais',             'IN_ORGAO_ASS_PAIS'),
    ('in_orgao_gremio_estudantil',    'IN_ORGAO_GREMIO_ESTUDANTIL'),
    ('in_material_ped_quilombola',    'IN_MATERIAL_PED_QUILOMBOLA'),
    ('in_material_ped_campo',         'IN_MATERIAL_PED_CAMPO'),
    ('in_material_ped_indigena',      'IN_MATERIAL_PED_INDIGENA'),
]
CAMPOS_INT = [
    ('qt_salas_utilizadas_dentro',  'QT_SALAS_UTILIZADAS_DENTRO'),
    ('qt_salas_utilizadas_fora',    'QT_SALAS_UTILIZADAS_FORA'),
    ('qt_desktop_aluno',            'QT_DESKTOP_ALUNO'),
    ('qt_comp_portatil_aluno',      'QT_COMP_PORTATIL_ALUNO'),
    ('qt_tablet_aluno',             'QT_TABLET_ALUNO'),
    ('tp_localizacao_diferenciada', 'TP_LOCALIZACAO_DIFERENCIADA'),
]
ALL_COLS = CAMPOS_BIN + CAMPOS_INT
INT_COLS = {col for col, _ in CAMPOS_INT}
ALL_DB_COLS = [col for col, _ in ALL_COLS]

def to_val(v, col):
    """Converte valor do CSV para o tipo adequado."""
    if v is None or v.strip() == '':
        return None
    v = v.strip()
    if col in INT_COLS:
        try:
            return int(v)
        except ValueError:
            return None
    return v  # TEXT: '0' ou '1'


def main():
    if not DB_URL:
        print('ERRO: RAILWAY_DATABASE_URL não definido')
        sys.exit(1)
    if not os.path.exists(CSV_PATH):
        print(f'ERRO: CSV não encontrado em {CSV_PATH}')
        sys.exit(1)

    print('Conectando ao banco...')
    conn = psycopg2.connect(DB_URL, sslmode='require')
    conn.autocommit = False
    cur = conn.cursor()

    # 1) Cria tabela temporária
    col_defs = ', '.join(f'{col} TEXT' for col in ALL_DB_COLS)
    cur.execute(f'''
        CREATE TEMP TABLE _import_infra (
            co_entidade BIGINT,
            {col_defs}
        ) ON COMMIT DROP
    ''')
    print('Temp table criada.')

    # 2) Lê CSV e prepara buffer para COPY
    print(f'Lendo CSV: {CSV_PATH}')
    csv_csv_cols = [csv_col for _, csv_col in ALL_COLS]

    buf = io.StringIO()
    writer = csv.writer(buf, delimiter='\t', quotechar='"', lineterminator='\n')
    count = 0

    with open(CSV_PATH, encoding='latin-1', newline='') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            co = row.get('CO_ENTIDADE', '').strip()
            if not co:
                continue
            vals = [str(co)]
            for col, csv_col in ALL_COLS:
                v = to_val(row.get(csv_col, ''), col)
                vals.append('' if v is None else str(v))
            writer.writerow(vals)
            count += 1
            if count % 50000 == 0:
                print(f'  lidas: {count:,}')

    print(f'Total lidas: {count:,} escolas')

    # 3) COPY para temp table
    buf.seek(0)
    col_list = 'co_entidade, ' + ', '.join(ALL_DB_COLS)
    cur.copy_from(buf, '_import_infra', sep='\t', null='', columns=col_list.split(', '))
    print(f'COPY concluído.')

    # 4) UPDATE em massa
    int_set = INT_COLS
    set_parts = []
    for col in ALL_DB_COLS:
        if col in int_set:
            set_parts.append(f"{col} = NULLIF(t.{col}, '')::INTEGER")
        else:
            set_parts.append(f"{col} = NULLIF(t.{col}, '')")
    set_clause = ',\n        '.join(set_parts)

    cur.execute(f'''
        UPDATE censo_escolas c
        SET {set_clause}
        FROM _import_infra t
        WHERE c.co_entidade = t.co_entidade AND c.ano = 2025
    ''')
    updated = cur.rowcount
    print(f'UPDATE concluído: {updated:,} linhas atualizadas')

    conn.commit()
    cur.close()

    # 5) Verifica amostra
    cur2 = conn.cursor()
    cur2.execute('''
        SELECT co_entidade, in_energia_renovavel, in_tratamento_lixo_separacao,
               in_acessibilidade_rampas, in_orgao_conselho_escolar,
               qt_salas_utilizadas_dentro, in_internet_alunos, in_banheiro_pne
        FROM censo_escolas
        WHERE ano=2025 AND co_entidade=15044327
    ''')
    row = cur2.fetchone()
    cols = [d[0] for d in cur2.description]
    print('\nVerificação (escola 15044327):')
    for c, v in zip(cols, row):
        print(f'  {c} = {v}')

    cur2.execute('''
        SELECT COUNT(*) total,
               COUNT(in_energia_renovavel) com_sustent,
               COUNT(in_acessibilidade_rampas) com_access,
               COUNT(in_orgao_conselho_escolar) com_partic
        FROM censo_escolas WHERE ano=2025
    ''')
    stats = cur2.fetchone()
    print(f'\nEstatísticas: total={stats[0]:,} | com_sustent={stats[1]:,} | com_access={stats[2]:,} | com_partic={stats[3]:,}')
    cur2.close()
    conn.close()
    print('\nImportação concluída com sucesso!')


if __name__ == '__main__':
    main()
