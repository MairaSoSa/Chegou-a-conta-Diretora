#!/usr/bin/env python3
"""
Importa indicadores educacionais 2025 dos xlsx do INEP.
Usa leitura direta do XML interno do xlsx (baixo uso de memória).
"""
import os, sys, json, time, glob, sqlite3, zipfile
from xml.etree.ElementTree import iterparse
from io import BytesIO

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dev.db')
ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'attached_assets')
ANO = 2025

SKIP_COLS = {'nu_ano_censo','no_regiao','sg_uf','co_municipio','no_municipio',
             'no_entidade','no_categoria','no_dependencia'}

ICG_TEXTO = {1:'Nível 1',2:'Nível 2',3:'Nível 3',4:'Nível 4',5:'Nível 5',6:'Nível 6'}

ATU_MAP = {'ed_inf_cat_0':'media_ed_inf','cre_cat_0':'media_cre','pre_cat_0':'media_pre',
           'fun_cat_0':'media_fund','fun_ai_cat_0':'media_fund_ai','fun_af_cat_0':'media_fund_af',
           'fun_01_cat_0':'media_fund_1','fun_02_cat_0':'media_fund_2','fun_03_cat_0':'media_fund_3',
           'fun_04_cat_0':'media_fund_4','fun_05_cat_0':'media_fund_5','fun_06_cat_0':'media_fund_6',
           'fun_07_cat_0':'media_fund_7','fun_08_cat_0':'media_fund_8','fun_09_cat_0':'media_fund_9',
           'mult_eta_cat_0':'media_mult_eta','med_cat_0':'media_med','med_01_cat_0':'media_med_1',
           'med_02_cat_0':'media_med_2','med_03_cat_0':'media_med_3','med_04_cat_0':'media_med_4',
           'med_ns_cat_0':'media_med_ns'}
HAD_MAP = {k:v for k,v in ATU_MAP.items() if k != 'mult_eta_cat_0'}
TDI_MAP = {'fun_cat_0':'fundamental_total','fun_ai_cat_0':'fundamental_ai','fun_af_cat_0':'fundamental_af',
           'fun_01_cat_0':'fund_1ano','fun_02_cat_0':'fund_2ano','fun_03_cat_0':'fund_3ano',
           'fun_04_cat_0':'fund_4ano','fun_05_cat_0':'fund_5ano','fun_06_cat_0':'fund_6ano',
           'fun_07_cat_0':'fund_7ano','fun_08_cat_0':'fund_8ano','fun_09_cat_0':'fund_9ano',
           'med_cat_0':'medio_total','med_01_cat_0':'medio_1serie','med_02_cat_0':'medio_2serie',
           'med_03_cat_0':'medio_3serie','med_04_cat_0':'medio_4serie'}
IED_MAP = {}
for i in range(1,7):
    IED_MAP[f'fun_cat_{i}'] = f'nivel_{i}'
    IED_MAP[f'fun_ai_cat_{i}'] = f'fund_ai_nivel_{i}'
    IED_MAP[f'fun_af_cat_{i}'] = f'fund_af_nivel_{i}'
    IED_MAP[f'med_cat_{i}'] = f'med_nivel_{i}'

TYPE_MAPS = {'atu':ATU_MAP,'had':HAD_MAP,'tdi':TDI_MAP,'ied':IED_MAP}

NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'

def parse_val(v):
    if v is None or str(v).strip() in ('','-','--'): return None
    try: return round(float(str(v).replace(',','.')), 4)
    except: return None

def read_shared_strings(zf, max_strings=2000):
    """Read up to max_strings entries from the shared strings table.
    We only need a few hundred strings for header detection.
    Data string cells (school names, etc.) are skipped anyway."""
    if 'xl/sharedStrings.xml' not in zf.namelist():
        return []
    strings = []
    with zf.open('xl/sharedStrings.xml') as f:
        for event, elem in iterparse(f, events=('end',)):
            tag = elem.tag.replace(f'{{{NS}}}','')
            if tag == 'si':
                texts = [t.text or '' for t in elem.iter(f'{{{NS}}}t')]
                strings.append(''.join(texts))
                elem.clear()
                if len(strings) >= max_strings:
                    break
    return strings

C_TAG = f'{{{NS}}}c'
V_TAG = f'{{{NS}}}v'
ROW_TAG = f'{{{NS}}}row'

def col_ref_to_idx(ref):
    """Convert cell reference like 'AB3' to 0-based column index."""
    col_idx = 0
    for ch in ref:
        if ch.isalpha():
            col_idx = col_idx * 26 + (ord(ch) - ord('A') + 1)
        else:
            break
    return col_idx - 1

def iter_rows(zf, shared_strings):
    """Yield rows as lists of values. Uses 'end' events only + root.clear() for low memory."""
    sheet_path = None
    for name in zf.namelist():
        if name.startswith('xl/worksheets/sheet') and name.endswith('.xml'):
            sheet_path = name
            break
    if not sheet_path:
        return

    with zf.open(sheet_path) as f:
        context = iterparse(f, events=('end',))
        root = None
        current_row = None

        for event, elem in context:
            # Capture root (first element emitted)
            if root is None:
                root = elem

            if elem.tag == ROW_TAG:
                # Build row list from child <c> elements
                row = []
                for c in elem:
                    if c.tag != C_TAG:
                        continue
                    ref = c.get('r', 'A1')
                    col_idx = col_ref_to_idx(ref)
                    # Pad missing columns
                    while len(row) < col_idx:
                        row.append(None)
                    cell_type = c.get('t')
                    v_elem = c.find(V_TAG)
                    cell_value = v_elem.text if v_elem is not None else None
                    if cell_type == 's':
                        if shared_strings and cell_value is not None:
                            idx = int(cell_value)
                            val = shared_strings[idx] if idx < len(shared_strings) else ''
                        else:
                            val = None
                    elif cell_value is not None:
                        val = cell_value
                    else:
                        val = None
                    if len(row) <= col_idx:
                        row.append(val)
                    else:
                        row[col_idx] = val

                yield row
                # Release memory: clear root after each row
                if root is not None:
                    root.clear()


def import_xlsx(conn, path, tipo):
    col_map = TYPE_MAPS.get(tipo, {})
    cur = conn.cursor()
    now = int(time.time() * 1000)

    with zipfile.ZipFile(path, 'r') as zf:
        # Load all shared strings (~156K strings × ~40 bytes = ~6MB, manageable)
        shared_strings = read_shared_strings(zf, max_strings=500000)

        headers = None
        co_col = None
        count = 0
        batch = []

        for row in iter_rows(zf, shared_strings):
            # Find header row: contains 'nu_ano_censo' (case-insensitive)
            if headers is None:
                row_up = [str(v).strip().upper() if v else '' for v in row]
                if 'NU_ANO_CENSO' in row_up:
                    headers = [str(v).strip().lower() if v else None for v in row]
                    try:
                        co_col = headers.index('co_entidade')
                    except ValueError:
                        headers = None
                continue

            # Data rows
            if not row or co_col is None or co_col >= len(row) or row[co_col] is None:
                continue
            try:
                inep = int(float(str(row[co_col])))
                if not (10000000 <= inep <= 99999999):
                    continue
            except (ValueError, TypeError):
                continue

            dados = {'co_entidade': inep}

            if tipo == 'icg':
                raw = row[9] if len(row) > 9 else None
                try:
                    nivel = int(float(str(raw)))
                    dados['nivel'] = nivel
                    dados['nivel_texto'] = ICG_TEXTO.get(nivel, f'Nível {nivel}')
                except (ValueError, TypeError):
                    pass

            elif tipo == 'ird':
                raw = row[9] if len(row) > 9 else None
                dados['media_ird'] = parse_val(raw)

            else:
                for ci, cn in enumerate(headers):
                    if cn is None or cn in SKIP_COLS or cn == 'co_entidade':
                        continue
                    val = row[ci] if ci < len(row) else None
                    dados[col_map.get(cn, cn)] = parse_val(val)

            batch.append((inep, ANO, tipo, json.dumps(dados), now))
            count += 1

            if len(batch) >= 3000:
                cur.executemany(
                    'INSERT OR REPLACE INTO indicadores_educacionais(inep,ano,tipo,dados,updated_at)VALUES(?,?,?,?,?)',
                    batch
                )
                conn.commit()
                batch = []
                print(f'  {tipo}: {count:,}...', flush=True)

        if batch:
            cur.executemany(
                'INSERT OR REPLACE INTO indicadores_educacionais(inep,ano,tipo,dados,updated_at)VALUES(?,?,?,?,?)',
                batch
            )
            conn.commit()

    return count


def main():
    tipo_arg = sys.argv[1].lower() if len(sys.argv) > 1 else None

    all_types = [
        ('ICG', 'icg'), ('IRD', 'ird'), ('ATU', 'atu'),
        ('HAD', 'had'), ('TDI', 'tdi'), ('IED', 'ied'), ('AFD', 'afd'),
    ]

    conn = sqlite3.connect(DB_PATH)
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA synchronous=NORMAL')

    for prefix, tipo in all_types:
        if tipo_arg and tipo != tipo_arg:
            continue
        matches = sorted(glob.glob(os.path.join(ASSETS_DIR, f'{prefix}_*2025*.xlsx')))
        if not matches:
            print(f'{prefix}: arquivo não encontrado')
            continue
        path = matches[0]
        print(f'[{prefix}] Importando {os.path.basename(path)}...')
        n = import_xlsx(conn, path, tipo)
        print(f'  => {n:,} registros para {tipo}(2025)')

    conn.close()
    print('Concluído!')

if __name__ == '__main__':
    main()
