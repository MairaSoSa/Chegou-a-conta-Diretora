#!/usr/bin/env python3
"""SINASC ETL — downloads SINASC DBC via pysus, aggregates by município/ano,
emits JSONL records on stdout for the Node runner to insert into Postgres.

Usage:
    sinasc.py --states MG,SP --years 2018,2019,2020,2021,2022
    sinasc.py --states ALL --years 2018-2022
    sinasc.py --states MG --years 2022 --co-municipio 3151206   (filter to one)

Each output line is a JSON record:
    {"co_municipio":"3151206","ano":2022,"fonte":"SINASC","indicador":"...",
     "valor":123.45,"denominador":1000,"unidade":"...","metadata":{...}}
"""
import argparse, json, sys, os, time
from pysus.online_data import SINASC

UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
           "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]


def to_ibge7(code6):
    s = str(code6).strip().split('.')[0]
    if not s.isdigit() or len(s) > 6:
        return None
    s = s.zfill(6)
    weights = [1, 2, 1, 2, 1, 2]
    total = 0
    for d, w in zip(s, weights):
        p = int(d) * w
        if p > 9:
            p -= 9
        total += p
    chk = (10 - (total % 10)) % 10
    return s + str(chk)


def parse_states(arg):
    if arg.upper() == 'ALL':
        return UF_LIST
    return [s.strip().upper() for s in arg.split(',') if s.strip()]


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


def process_uf_year(uf, year, only_co=None):
    log = lambda m: sys.stderr.write(f"[sinasc {uf} {year}] {m}\n")
    log("downloading...")
    t0 = time.time()
    try:
        ps = SINASC.download(groups='DN', states=uf, years=year)
    except Exception as e:
        log(f"download failed: {e}")
        return 0
    try:
        df = ps.to_dataframe()
    except Exception as e:
        log(f"read failed: {e}")
        return 0
    if df is None or df.empty:
        log("empty df")
        return 0
    log(f"loaded {len(df)} rows in {time.time()-t0:.1f}s")

    # normalize types
    df['CODMUNRES'] = df['CODMUNRES'].astype(str).str.strip()
    df['ibge7'] = df['CODMUNRES'].map(to_ibge7)
    df = df[df['ibge7'].notna()]
    if only_co:
        df = df[df['ibge7'] == str(only_co)]
        if df.empty:
            log(f"no rows for co_municipio={only_co}")
            return 0

    # numeric coercion
    for col in ('PESO', 'IDADEMAE', 'SEMAGESTAC', 'CONSPRENAT'):
        if col in df.columns:
            df[col] = df[col].apply(lambda x: int(x) if str(x).strip().isdigit() else None)

    emitted = 0
    for ibge7, g in df.groupby('ibge7'):
        n = len(g)
        if n == 0:
            continue
        # 1) total nascidos vivos
        emit({"co_municipio": ibge7, "ano": int(year), "fonte": "SINASC",
              "indicador": "sinasc_nascidos_vivos_total", "valor": float(n),
              "unidade": "nascimentos"})

        # 2) % cesárea — PARTO: 1=vaginal, 2=cesárea
        cesareas = (g['PARTO'].astype(str) == '2').sum() if 'PARTO' in g.columns else 0
        validos_parto = g['PARTO'].astype(str).isin(['1', '2']).sum() if 'PARTO' in g.columns else 0
        if validos_parto > 0:
            emit({"co_municipio": ibge7, "ano": int(year), "fonte": "SINASC",
                  "indicador": "sinasc_pct_cesarea",
                  "valor": round(100.0 * cesareas / validos_parto, 2),
                  "denominador": float(validos_parto), "unidade": "%"})

        # 3) % 7+ consultas pré-natal — CONSULTAS == '4'
        c7 = (g['CONSULTAS'].astype(str) == '4').sum() if 'CONSULTAS' in g.columns else 0
        validos_c = g['CONSULTAS'].astype(str).isin(['1','2','3','4']).sum() if 'CONSULTAS' in g.columns else 0
        if validos_c > 0:
            emit({"co_municipio": ibge7, "ano": int(year), "fonte": "SINASC",
                  "indicador": "sinasc_pct_prenatal_7mais",
                  "valor": round(100.0 * c7 / validos_c, 2),
                  "denominador": float(validos_c), "unidade": "%"})

        # 4) % baixo peso (< 2500g)
        if 'PESO' in g.columns:
            peso_validos = g[g['PESO'].notna() & (g['PESO'] > 0)]
            if len(peso_validos) > 0:
                bp = (peso_validos['PESO'] < 2500).sum()
                emit({"co_municipio": ibge7, "ano": int(year), "fonte": "SINASC",
                      "indicador": "sinasc_pct_baixo_peso",
                      "valor": round(100.0 * bp / len(peso_validos), 2),
                      "denominador": float(len(peso_validos)), "unidade": "%"})

        # 5) % prematuro (< 37 semanas)
        if 'SEMAGESTAC' in g.columns:
            sem_validos = g[g['SEMAGESTAC'].notna() & (g['SEMAGESTAC'] > 0) & (g['SEMAGESTAC'] < 50)]
            if len(sem_validos) > 0:
                pre = (sem_validos['SEMAGESTAC'] < 37).sum()
                emit({"co_municipio": ibge7, "ano": int(year), "fonte": "SINASC",
                      "indicador": "sinasc_pct_prematuro",
                      "valor": round(100.0 * pre / len(sem_validos), 2),
                      "denominador": float(len(sem_validos)), "unidade": "%"})

        # 6) % mãe adolescente (< 20 anos)
        if 'IDADEMAE' in g.columns:
            id_validos = g[g['IDADEMAE'].notna() & (g['IDADEMAE'] > 0) & (g['IDADEMAE'] < 80)]
            if len(id_validos) > 0:
                ad = (id_validos['IDADEMAE'] < 20).sum()
                emit({"co_municipio": ibge7, "ano": int(year), "fonte": "SINASC",
                      "indicador": "sinasc_pct_mae_adolescente",
                      "valor": round(100.0 * ad / len(id_validos), 2),
                      "denominador": float(len(id_validos)), "unidade": "%"})

        # 7) % mãe sem escolaridade (ESCMAE == '1')
        if 'ESCMAE' in g.columns:
            esc_validos = g[g['ESCMAE'].astype(str).isin(['1','2','3','4','5'])]
            if len(esc_validos) > 0:
                ne = (esc_validos['ESCMAE'].astype(str) == '1').sum()
                emit({"co_municipio": ibge7, "ano": int(year), "fonte": "SINASC",
                      "indicador": "sinasc_pct_mae_sem_escolaridade",
                      "valor": round(100.0 * ne / len(esc_validos), 2),
                      "denominador": float(len(esc_validos)), "unidade": "%"})

        emitted += 7
    log(f"emitted ~{emitted} indicators for {df['ibge7'].nunique()} municípios")
    return emitted


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--states', required=True)
    ap.add_argument('--years', required=True)
    ap.add_argument('--co-municipio', default=None, help='filter to single 7-digit IBGE code')
    args = ap.parse_args()
    states = parse_states(args.states)
    years = parse_years(args.years)
    sys.stderr.write(f"[sinasc] states={states} years={years}\n")
    total = 0
    for uf in states:
        for y in years:
            try:
                total += process_uf_year(uf, y, only_co=args.co_municipio)
            except Exception as e:
                sys.stderr.write(f"[sinasc {uf} {y}] EXCEPTION {e}\n")
            sys.stdout.flush()
    sys.stderr.write(f"[sinasc] DONE total emitted={total}\n")


if __name__ == '__main__':
    main()
