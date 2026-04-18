#!/usr/bin/env python3
"""SIM ETL — downloads SIM (mortalidade) DBC via pysus, aggregates by município/ano,
emits JSONL records on stdout.

Indicators emitted:
  - sim_obitos_total                 (contagem)
  - sim_obitos_menor_1_ano           (contagem) -- usado p/ mortalidade infantil cruzando com SINASC
  - sim_obitos_maternos              (CID O00-O99)
  - sim_obitos_externos              (CID V01-Y98 = capítulo XX)
  - sim_obitos_covid                 (CID U07.1, B34.2)
  - sim_pct_obitos_evitaveis_5_74    (lista SVS — usamos proxy: capítulos II,IV,IX,X,XI,XX excluindo causas mal definidas R)
"""
import argparse, json, sys, time, re
from pysus.online_data import SIM

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
    return s + str((10 - (total % 10)) % 10)


def parse_states(arg):
    return UF_LIST if arg.upper() == 'ALL' else [s.strip().upper() for s in arg.split(',') if s.strip()]


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


def cid_chapter(cid):
    """CID-10 → letter+first 2 digits string for matching."""
    if not cid:
        return ''
    return str(cid).strip().upper()


def is_obito_externo(cid):
    if not cid: return False
    c = cid.strip().upper()
    if not c: return False
    letter = c[0]
    if letter not in ('V', 'W', 'X', 'Y'): return False
    try:
        n = int(c[1:3])
    except Exception:
        return False
    if letter == 'V': return 1 <= n <= 99
    if letter == 'W': return 0 <= n <= 99
    if letter == 'X': return 0 <= n <= 99
    if letter == 'Y': return 0 <= n <= 98
    return False


def is_obito_materno(cid):
    if not cid: return False
    c = cid.strip().upper()
    return c.startswith('O') and len(c) >= 3 and c[1:3].isdigit()


def is_obito_covid(cid):
    if not cid: return False
    c = cid.strip().upper().replace('.', '')
    return c.startswith('U071') or c.startswith('U072') or c.startswith('B342')


def parse_idade_sim(idade_raw):
    """Campo IDADE no SIM: 4 dígitos (UNIDADE + VALOR).
    1xxx = anos, 2xxx = meses, 3xxx = dias, 4xxx = horas, 5xxx = minutos.
    Retorna idade em anos (float)."""
    if idade_raw is None: return None
    s = str(idade_raw).strip()
    if not s.isdigit() or len(s) != 4: return None
    u = s[0]; v = int(s[1:])
    if u == '4': return v / 8760.0
    if u == '3': return v / 365.0
    if u == '2': return v / 12.0
    if u == '1': return float(v)
    if u == '5': return v / 525600.0
    return None


def process_uf_year(uf, year, only_co=None):
    log = lambda m: sys.stderr.write(f"[sim {uf} {year}] {m}\n")
    log("downloading...")
    t0 = time.time()
    try:
        ps = SIM.download(groups='CID10', states=uf, years=year)
    except Exception as e:
        log(f"download failed: {e}")
        return 0
    try:
        df = ps.to_dataframe() if hasattr(ps, 'to_dataframe') else ps
    except Exception as e:
        log(f"read failed: {e}")
        return 0
    if df is None or len(df) == 0:
        log("empty df")
        return 0
    log(f"loaded {len(df)} rows in {time.time()-t0:.1f}s")

    if 'CODMUNRES' not in df.columns:
        log(f"no CODMUNRES; cols={list(df.columns)[:15]}")
        return 0
    df['CODMUNRES'] = df['CODMUNRES'].astype(str).str.strip()
    df['ibge7'] = df['CODMUNRES'].map(to_ibge7)
    df = df[df['ibge7'].notna()]
    if only_co:
        df = df[df['ibge7'] == str(only_co)]
        if df.empty:
            log(f"no rows for co_municipio={only_co}")
            return 0

    # idade in years
    if 'IDADE' in df.columns:
        df['idade_anos'] = df['IDADE'].map(parse_idade_sim)
    else:
        df['idade_anos'] = None

    # CAUSABAS
    cb = df['CAUSABAS'] if 'CAUSABAS' in df.columns else df.get('CAUSABAS_O', None)
    if cb is None:
        cb = df.iloc[:, 0] * 0  # empty
    df['_cb'] = cb.astype(str).str.upper().str.strip()
    df['_externo'] = df['_cb'].map(is_obito_externo)
    df['_materno'] = df['_cb'].map(is_obito_materno)
    df['_covid']   = df['_cb'].map(is_obito_covid)

    emitted = 0
    for ibge7, g in df.groupby('ibge7'):
        n = len(g)
        if n == 0: continue
        emit({"co_municipio": ibge7, "ano": int(year), "fonte": "SIM",
              "indicador": "sim_obitos_total", "valor": float(n), "unidade": "óbitos"})

        menor1 = ((g['idade_anos'].notna()) & (g['idade_anos'] < 1.0)).sum()
        emit({"co_municipio": ibge7, "ano": int(year), "fonte": "SIM",
              "indicador": "sim_obitos_menor_1_ano", "valor": float(menor1), "unidade": "óbitos"})

        emit({"co_municipio": ibge7, "ano": int(year), "fonte": "SIM",
              "indicador": "sim_obitos_maternos", "valor": float(g['_materno'].sum()), "unidade": "óbitos"})

        emit({"co_municipio": ibge7, "ano": int(year), "fonte": "SIM",
              "indicador": "sim_obitos_externos", "valor": float(g['_externo'].sum()), "unidade": "óbitos"})

        emit({"co_municipio": ibge7, "ano": int(year), "fonte": "SIM",
              "indicador": "sim_obitos_covid", "valor": float(g['_covid'].sum()), "unidade": "óbitos"})

        # adultos 5-74
        adultos = g[g['idade_anos'].notna() & (g['idade_anos'] >= 5) & (g['idade_anos'] < 75)]
        if len(adultos) > 0:
            # proxy "evitáveis": externos + circulatório (I) + respiratório (J) + neoplasias (C, D00-D48)
            def evit(c):
                if not c: return False
                c0 = c[0]
                if c0 in ('V','W','X','Y','I','J'): return True
                if c0 == 'C': return True
                if c0 == 'D' and len(c) >= 3 and c[1:3].isdigit() and int(c[1:3]) <= 48: return True
                return False
            ev = adultos['_cb'].map(evit).sum()
            emit({"co_municipio": ibge7, "ano": int(year), "fonte": "SIM",
                  "indicador": "sim_pct_obitos_evitaveis_5_74",
                  "valor": round(100.0 * ev / len(adultos), 2),
                  "denominador": float(len(adultos)), "unidade": "%"})
        emitted += 6
    log(f"emitted ~{emitted} indicators for {df['ibge7'].nunique()} municípios")
    return emitted


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--states', required=True)
    ap.add_argument('--years', required=True)
    ap.add_argument('--co-municipio', default=None)
    args = ap.parse_args()
    states = parse_states(args.states)
    years = parse_years(args.years)
    sys.stderr.write(f"[sim] states={states} years={years}\n")
    total = 0
    for uf in states:
        for y in years:
            try:
                total += process_uf_year(uf, y, only_co=args.co_municipio)
            except Exception as e:
                sys.stderr.write(f"[sim {uf} {y}] EXCEPTION {e}\n")
            sys.stdout.flush()
    sys.stderr.write(f"[sim] DONE total emitted={total}\n")


if __name__ == '__main__':
    main()
