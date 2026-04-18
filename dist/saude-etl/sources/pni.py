#!/usr/bin/env python3
"""PNI ETL — downloads PNI Cobertura Vacinal (CPNI) DBC via pysus.
Already pre-aggregated by município × imunobiologico × ano.
Emits JSONL: one record per município/year/imuno with cobertura percent.

Note: PNI legacy FTP data ends in 2019. Newer data is in LocalizaSUS.

Usage:
    pni.py --states ALL --years 2015-2019
    pni.py --states MG --years 2019 --co-municipio 3151206
"""
import argparse, json, sys, time
from pysus.online_data import PNI

UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
           "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]

# IMUNO code → label mapping (PNI codes; partial — unknowns kept as raw code)
IMUNO_LABELS = {
    '000': 'Total agregado',
    '001': 'BCG (recém-nascidos)',
    '003': 'BCG',
    '004': 'Hepatite B (rec-nasc)',
    '005': 'Tetravalente (DTP+Hib)',
    '006': 'Tetra/Penta',
    '010': 'Hepatite B',
    '012': 'Hepatite B (em adultos)',
    '014': 'Tríplice viral D1',
    '015': 'Tríplice viral D2',
    '019': 'Tríplice viral',
    '020': 'Tetra viral',
    '021': 'Poliomielite',
    '022': 'Rotavírus humano',
    '023': 'Pneumocócica 10-valente',
    '024': 'Meningocócica C',
    '025': 'DTP reforço',
    '026': 'Pentavalente (DTP+Hib+HepB)',
    '027': 'Febre amarela',
    '028': 'Hepatite A',
    '029': 'Influenza',
    '030': 'Tríplice viral D2 / SCR',
    '031': 'Varicela',
    '033': 'HPV quadrivalente',
    '034': 'dTpa gestante',
    '037': 'VOP',
    '038': 'VIP',
    '039': 'Dengue',
    '044': 'COVID-19',
    '045': 'Pneumo 13-valente',
    '046': 'Meningo ACWY',
}


def to_ibge7(code6):
    s = str(code6).strip().split('.')[0]
    if not s.isdigit() or len(s) > 6:
        return None
    s = s.zfill(6)
    weights = [1, 2, 1, 2, 1, 2]
    total = 0
    for d, w in zip(s, weights):
        p = int(d) * w
        if p > 9: p -= 9
        total += p
    return s + str((10 - (total % 10)) % 10)


def parse_states(arg):
    return UF_LIST if arg.upper() == 'ALL' else [s.strip().upper() for s in arg.split(',') if s.strip()]


def parse_years(arg):
    if '-' in arg:
        a, b = arg.split('-', 1)
        return list(range(int(a), int(b) + 1))
    return [int(y.strip()) for y in arg.split(',') if y.strip()]


def parse_br_number(s):
    if s is None: return None
    t = str(s).strip()
    if not t or t.lower() in ('nan', 'none'): return None
    # Handle BR format ("1.234,56" → 1234.56) vs US format ("1,234.56" → 1234.56)
    has_comma = ',' in t
    has_dot = '.' in t
    if has_comma and has_dot:
        # Decimal is whichever appears LAST
        if t.rfind(',') > t.rfind('.'):
            t = t.replace('.', '').replace(',', '.')  # BR: dots are thousands
        else:
            t = t.replace(',', '')                    # US: commas are thousands
    elif has_comma:
        t = t.replace(',', '.')                       # BR decimal
    # else: dot-only or plain int → leave as-is
    try:
        v = float(t)
        if v != v:  # NaN check
            return None
        return v
    except Exception:
        return None


def _clean(v):
    if v is None: return None
    if isinstance(v, float) and v != v: return None  # NaN
    if isinstance(v, dict):
        return {k: _clean(x) for k, x in v.items()}
    return v


def emit(rec):
    cleaned = {k: _clean(v) for k, v in rec.items()}
    sys.stdout.write(json.dumps(cleaned, ensure_ascii=False, allow_nan=False) + "\n")


def process_uf_year(uf, year, only_co=None):
    log = lambda m: sys.stderr.write(f"[pni {uf} {year}] {m}\n")
    log("downloading...")
    t0 = time.time()
    try:
        ps = PNI.download(group='CPNI', states=uf, years=year)
    except Exception as e:
        log(f"download failed: {e}")
        return 0
    try:
        df = ps.to_dataframe()
    except Exception as e:
        log(f"read failed: {e}")
        return 0
    if df is None or len(df) == 0:
        log("empty df")
        return 0
    log(f"loaded {len(df)} rows in {time.time()-t0:.1f}s")

    # MUNIC is 6-digit
    df['MUNIC'] = df['MUNIC'].astype(str).str.strip()
    df['ibge7'] = df['MUNIC'].map(to_ibge7)
    df = df[df['ibge7'].notna()]
    if only_co:
        df = df[df['ibge7'] == str(only_co)]
        if df.empty:
            log(f"no rows for co_municipio={only_co}")
            return 0

    df['cobert_f'] = df['COBERT'].map(parse_br_number)
    df['qt_dose_f'] = df['QT_DOSE'].map(parse_br_number)
    df['pop_f'] = df['POP'].map(parse_br_number)

    emitted = 0
    for _, row in df.iterrows():
        ibge7 = row['ibge7']
        imuno = str(row.get('IMUNO', '')).strip().zfill(3)
        label = IMUNO_LABELS.get(imuno, f'Imuno {imuno}')
        cobert = row['cobert_f']
        qt = row['qt_dose_f']
        pop = row['pop_f']

        # cobertura indicator (recorte=imuno code)
        if cobert is not None:
            emit({"co_municipio": ibge7, "ano": int(year), "fonte": "PNI",
                  "indicador": "pni_cobertura_vacinal",
                  "recorte": imuno,
                  "valor": float(cobert),
                  "denominador": float(pop) if pop is not None else None,
                  "unidade": "%",
                  "metadata": {"imuno_code": imuno, "imuno_label": label, "qt_dose": qt}})
            emitted += 1

    log(f"emitted {emitted} cobertura records for {df['ibge7'].nunique()} municípios")
    return emitted


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--states', required=True)
    ap.add_argument('--years', required=True)
    ap.add_argument('--co-municipio', default=None)
    args = ap.parse_args()
    states = parse_states(args.states)
    years = parse_years(args.years)
    sys.stderr.write(f"[pni] states={states} years={years}\n")
    total = 0
    for uf in states:
        for y in years:
            try:
                total += process_uf_year(uf, y, only_co=args.co_municipio)
            except Exception as e:
                sys.stderr.write(f"[pni {uf} {y}] EXCEPTION {e}\n")
            sys.stdout.flush()
    sys.stderr.write(f"[pni] DONE total emitted={total}\n")


if __name__ == '__main__':
    main()
