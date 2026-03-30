#!/usr/bin/env python3
"""
Importa os 7 indicadores educacionais de 2025 a partir dos xlsx do INEP.
Arquivos esperados: AFD, ATU, HAD, ICG, IED, IRD, TDI _ESCOLAS_2025_*.xlsx
"""

import os
import json
import glob
import time
import sqlite3
import openpyxl

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dev.db')
ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'attached_assets')

ANO = 2025

# ─── Column-level mapping: xlsx header → dados key ─────────────────────────
# Keys not listed here are stored as-is (lowercased, with _cat_N stripped).
# Metadata columns (before and including co_entidade) are skipped.

SKIP_COLS = {'nu_ano_censo', 'no_regiao', 'sg_uf', 'co_municipio',
             'no_municipio', 'no_entidade', 'no_categoria', 'no_dependencia'}

# For ATU and HAD – map to existing campo names so dashboard keeps working
ATU_MAP = {
    'ed_inf_cat_0': 'media_ed_inf',
    'cre_cat_0':    'media_cre',
    'pre_cat_0':    'media_pre',
    'fun_cat_0':    'media_fund',
    'fun_ai_cat_0': 'media_fund_ai',
    'fun_af_cat_0': 'media_fund_af',
    'fun_01_cat_0': 'media_fund_1',
    'fun_02_cat_0': 'media_fund_2',
    'fun_03_cat_0': 'media_fund_3',
    'fun_04_cat_0': 'media_fund_4',
    'fun_05_cat_0': 'media_fund_5',
    'fun_06_cat_0': 'media_fund_6',
    'fun_07_cat_0': 'media_fund_7',
    'fun_08_cat_0': 'media_fund_8',
    'fun_09_cat_0': 'media_fund_9',
    'mult_eta_cat_0': 'media_mult_eta',
    'med_cat_0':    'media_med',
    'med_01_cat_0': 'media_med_1',
    'med_02_cat_0': 'media_med_2',
    'med_03_cat_0': 'media_med_3',
    'med_04_cat_0': 'media_med_4',
    'med_ns_cat_0': 'media_med_ns',
}

HAD_MAP = {
    'ed_inf_cat_0': 'media_ed_inf',
    'cre_cat_0':    'media_cre',
    'pre_cat_0':    'media_pre',
    'fun_cat_0':    'media_fund',
    'fun_ai_cat_0': 'media_fund_ai',
    'fun_af_cat_0': 'media_fund_af',
    'fun_01_cat_0': 'media_fund_1',
    'fun_02_cat_0': 'media_fund_2',
    'fun_03_cat_0': 'media_fund_3',
    'fun_04_cat_0': 'media_fund_4',
    'fun_05_cat_0': 'media_fund_5',
    'fun_06_cat_0': 'media_fund_6',
    'fun_07_cat_0': 'media_fund_7',
    'fun_08_cat_0': 'media_fund_8',
    'fun_09_cat_0': 'media_fund_9',
    'med_cat_0':    'media_med',
    'med_01_cat_0': 'media_med_1',
    'med_02_cat_0': 'media_med_2',
    'med_03_cat_0': 'media_med_3',
    'med_04_cat_0': 'media_med_4',
    'med_ns_cat_0': 'media_med_ns',
}

TDI_MAP = {
    'fun_cat_0':    'fundamental_total',
    'fun_ai_cat_0': 'fundamental_ai',
    'fun_af_cat_0': 'fundamental_af',
    'fun_01_cat_0': 'fund_1ano',
    'fun_02_cat_0': 'fund_2ano',
    'fun_03_cat_0': 'fund_3ano',
    'fun_04_cat_0': 'fund_4ano',
    'fun_05_cat_0': 'fund_5ano',
    'fun_06_cat_0': 'fund_6ano',
    'fun_07_cat_0': 'fund_7ano',
    'fun_08_cat_0': 'fund_8ano',
    'fun_09_cat_0': 'fund_9ano',
    'med_cat_0':    'medio_total',
    'med_01_cat_0': 'medio_1serie',
    'med_02_cat_0': 'medio_2serie',
    'med_03_cat_0': 'medio_3serie',
    'med_04_cat_0': 'medio_4serie',
}

IED_MAP = {
    'fun_cat_1': 'nivel_1',    'fun_cat_2': 'nivel_2',    'fun_cat_3': 'nivel_3',
    'fun_cat_4': 'nivel_4',    'fun_cat_5': 'nivel_5',    'fun_cat_6': 'nivel_6',
    'fun_ai_cat_1': 'fund_ai_nivel_1', 'fun_ai_cat_2': 'fund_ai_nivel_2',
    'fun_ai_cat_3': 'fund_ai_nivel_3', 'fun_ai_cat_4': 'fund_ai_nivel_4',
    'fun_ai_cat_5': 'fund_ai_nivel_5', 'fun_ai_cat_6': 'fund_ai_nivel_6',
    'fun_af_cat_1': 'fund_af_nivel_1', 'fun_af_cat_2': 'fund_af_nivel_2',
    'fun_af_cat_3': 'fund_af_nivel_3', 'fun_af_cat_4': 'fund_af_nivel_4',
    'fun_af_cat_5': 'fund_af_nivel_5', 'fun_af_cat_6': 'fund_af_nivel_6',
    'med_cat_1': 'med_nivel_1', 'med_cat_2': 'med_nivel_2',
    'med_cat_3': 'med_nivel_3', 'med_cat_4': 'med_nivel_4',
    'med_cat_5': 'med_nivel_5', 'med_cat_6': 'med_nivel_6',
}

TYPE_MAPS = {
    'atu': ATU_MAP,
    'had': HAD_MAP,
    'tdi': TDI_MAP,
    'ied': IED_MAP,
}

ICG_TEXTO = {
    1: 'Nível 1', 2: 'Nível 2', 3: 'Nível 3',
    4: 'Nível 4', 5: 'Nível 5', 6: 'Nível 6',
}


def find_header_row(ws):
    for i, row in enumerate(ws.iter_rows(max_row=20, values_only=True)):
        if any(str(v) == 'NU_ANO_CENSO' for v in row if v is not None):
            return i, list(row)
    return None, None


def parse_val(v):
    if v is None or v == '' or v == '-':
        return None
    try:
        f = float(str(v).replace(',', '.'))
        return round(f, 4)
    except (ValueError, TypeError):
        return None


def import_file(conn, path, tipo):
    col_map = TYPE_MAPS.get(tipo, {})

    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    header_idx, header_row = find_header_row(ws)
    if header_idx is None:
        print(f'  [ERRO] Não encontrei cabeçalho em {path}')
        wb.close()
        return 0

    headers = [str(h).strip().lower() if h is not None else None for h in header_row]
    co_entidade_col = headers.index('co_entidade')

    cur = conn.cursor()
    now = int(time.time() * 1000)
    count = 0
    batch = []

    for row in ws.iter_rows(min_row=header_idx + 2, values_only=True):
        inep_val = row[co_entidade_col] if co_entidade_col < len(row) else None
        if inep_val is None:
            continue
        try:
            inep = int(inep_val)
        except (ValueError, TypeError):
            continue

        dados = {'co_entidade': inep}

        if tipo == 'icg':
            raw = row[9] if len(row) > 9 else None
            nivel = None
            try:
                nivel = int(raw)
            except (ValueError, TypeError):
                pass
            if nivel is not None:
                dados['nivel'] = nivel
                dados['nivel_texto'] = ICG_TEXTO.get(nivel, f'Nível {nivel}')

        elif tipo == 'ird':
            raw = row[9] if len(row) > 9 else None
            dados['media_ird'] = parse_val(raw)

        else:
            for col_idx, col_name in enumerate(headers):
                if col_name is None or col_name in SKIP_COLS or col_name == 'co_entidade':
                    continue
                mapped = col_map.get(col_name, col_name)
                val = row[col_idx] if col_idx < len(row) else None
                dados[mapped] = parse_val(val)

        batch.append((inep, ANO, tipo, json.dumps(dados), now))
        count += 1

        if len(batch) >= 2000:
            cur.executemany(
                '''INSERT OR REPLACE INTO indicadores_educacionais
                   (inep, ano, tipo, dados, updated_at)
                   VALUES (?,?,?,?,?)''',
                batch
            )
            conn.commit()
            batch = []
            print(f'  {tipo}: {count:,} registros...', flush=True)

    if batch:
        cur.executemany(
            '''INSERT OR REPLACE INTO indicadores_educacionais
               (inep, ano, tipo, dados, updated_at)
               VALUES (?,?,?,?,?)''',
            batch
        )
        conn.commit()

    wb.close()
    return count


def main():
    files = sorted(glob.glob(os.path.join(ASSETS_DIR, '*_2025_*.xlsx')))
    if not files:
        print(f'Nenhum xlsx encontrado em {ASSETS_DIR}')
        return

    conn = sqlite3.connect(DB_PATH)
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA synchronous=NORMAL')

    for path in files:
        basename = os.path.basename(path)
        tipo = basename.split('_')[0].lower()
        print(f'\n[{tipo.upper()}] Importando {basename}...')
        n = import_file(conn, path, tipo)
        print(f'  => {n:,} registros inseridos/atualizados para {tipo}(2025)')

    conn.close()
    print('\nConcluído!')


if __name__ == '__main__':
    main()
