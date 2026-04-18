#!/usr/bin/env python3
"""SINAN bulk loader — notifiable diseases per município/ano.

Sources the most-current municipal-level health data on DataSUS FTP.
Files are nationwide (BR), so no per-UF download needed.

Diseases (códigos pysus):
  DENG (dengue), CHIK (chikungunya), ZIKA, HEPA (hepatites virais),
  TUBE (tuberculose), HANS (hanseníase), VIOL (violências), MALA (malária),
  SIFA/SIFC/SIFG (sífilis adq./congên./gestante), MENI (meningite),
  LEPT (leptospirose), CHAG (chagas aguda), ANIM (acid. peçonhentos).

Output JSONL records on stdout: count of notificações + óbitos por município/ano.
"""
import sys, os, json, argparse, time
from pysus.online_data import SINAN

DISEASES_DEFAULT = ['DENG', 'CHIK', 'ZIKA', 'HEPA', 'TUBE', 'HANS',
                    'VIOL', 'MALA', 'SIFA', 'SIFC', 'SIFG', 'MENI',
                    'LEPT', 'CHAG', 'ANIM']

# Display labels (Portuguese, lowercase indicador name)
LABEL = {
    'DENG': 'dengue', 'CHIK': 'chikungunya', 'ZIKA': 'zika',
    'HEPA': 'hepatites_virais', 'TUBE': 'tuberculose', 'HANS': 'hanseniase',
    'VIOL': 'violencia', 'MALA': 'malaria',
    'SIFA': 'sifilis_adquirida', 'SIFC': 'sifilis_congenita', 'SIFG': 'sifilis_gestante',
    'MENI': 'meningite', 'LEPT': 'leptospirose', 'CHAG': 'chagas_aguda',
    'ANIM': 'acidente_animal_peconhento',
}


def ibge6_to_ibge7(co6: str) -> str:
    s = str(co6).strip().zfill(6)
    if len(s) != 6 or not s.isdigit():
        return None
    weights = [1, 2, 1, 2, 1, 2]
    total = 0
    for i, d in enumerate(s):
        prod = int(d) * weights[i]
        if prod > 9: prod -= 9
        total += prod
    chk = (10 - (total % 10)) % 10
    return s + str(chk)


def parse_years(arg):
    if '-' in arg:
        a, b = arg.split('-', 1)
        return list(range(int(a), int(b) + 1))
    return [int(y.strip()) for y in arg.split(',') if y.strip()]


def _clean(v):
    if v is None: return None
    if isinstance(v, float) and v != v: return None
    if isinstance(v, dict): return {k: _clean(x) for k, x in v.items()}
    return v


def emit(rec):
    cleaned = {k: _clean(v) for k, v in rec.items()}
    sys.stdout.write(json.dumps(cleaned, ensure_ascii=False, allow_nan=False) + "\n")


def process_disease_year(disease, year, only_co=None):
    log = lambda m: sys.stderr.write(f"[sinan {disease} {year}] {m}\n")
    log("downloading...")
    t0 = time.time()
    try:
        ps = SINAN.download(diseases=disease, years=year)
    except Exception as e:
        log(f"download failed: {e}")
        return 0
    try:
        # pysus returns a list of ParquetSet (or single)
        if not isinstance(ps, list):
            ps = [ps]
        df = None
        for p in ps:
            d = p.to_dataframe() if hasattr(p, 'to_dataframe') else p
            df = d if df is None else __import__('pandas').concat([df, d], ignore_index=True)
    except Exception as e:
        log(f"to_dataframe failed: {e}")
        return 0
    if df is None or df.empty:
        log("empty dataframe"); return 0
    log(f"loaded {len(df)} rows in {time.time()-t0:.1f}s")

    # Município de residência
    if 'ID_MN_RESI' in df.columns:
        co_col = 'ID_MN_RESI'
    elif 'ID_MUNICIP' in df.columns:
        co_col = 'ID_MUNICIP'
    else:
        log(f"no município column in {df.columns.tolist()[:10]}")
        return 0

    # Coerce código string of 6 chars
    df = df.copy()
    df[co_col] = df[co_col].astype(str).str.replace(r'\D', '', regex=True).str.zfill(6).str[:6]

    if only_co:
        only6 = only_co[:6]
        df = df[df[co_col] == only6]
        if df.empty:
            log(f"nada para {only_co}"); return 0

    # Group by município
    fonte = 'SINAN'
    label = LABEL.get(disease, disease.lower())
    indicador = f"sinan_{label}_casos"
    indicador_obitos = f"sinan_{label}_obitos"

    # Detect "evolução = óbito" column (varies by disease)
    has_evol = 'EVOLUCAO' in df.columns
    emitted = 0
    grouped = df.groupby(co_col)
    for co6, sub in grouped:
        co7 = ibge6_to_ibge7(co6)
        if not co7: continue
        n = int(len(sub))
        if n == 0: continue
        emit({
            'co_municipio': co7, 'ano': year, 'fonte': fonte,
            'indicador': indicador, 'recorte': None,
            'valor': n, 'denominador': None, 'unidade': 'casos',
            'metadata': {'disease': disease, 'fonte_arquivo': f'{disease}BR{str(year)[-2:]}'},
        })
        emitted += 1
        if has_evol:
            obitos = int((sub['EVOLUCAO'].astype(str) == '2').sum())
            if obitos > 0:
                emit({
                    'co_municipio': co7, 'ano': year, 'fonte': fonte,
                    'indicador': indicador_obitos, 'recorte': None,
                    'valor': obitos, 'denominador': n, 'unidade': 'obitos',
                    'metadata': {'disease': disease, 'letalidade_pct': round(obitos*100.0/n, 2)},
                })
                emitted += 1
    log(f"emitted {emitted} records for {len(grouped)} municípios")
    return emitted


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--diseases', default=','.join(DISEASES_DEFAULT))
    ap.add_argument('--years', required=True)
    ap.add_argument('--co-municipio', default=None)
    args = ap.parse_args()

    diseases = [d.strip().upper() for d in args.diseases.split(',') if d.strip()]
    years = parse_years(args.years)
    only_co = args.co_municipio
    sys.stderr.write(f"[sinan] diseases={diseases} years={years} only_co={only_co}\n")

    total = 0
    for d in diseases:
        for y in years:
            try:
                total += process_disease_year(d, y, only_co=only_co)
            except Exception as e:
                sys.stderr.write(f"[sinan {d} {y}] FATAL: {e}\n")
    sys.stderr.write(f"[sinan] DONE total emitted={total}\n")


if __name__ == '__main__':
    main()
