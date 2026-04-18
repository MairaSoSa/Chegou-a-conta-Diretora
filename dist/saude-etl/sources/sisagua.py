#!/usr/bin/env python3
"""SISAGUA bulk loader — qualidade da água por município/ano.

Fonte: API DEMAS pública (https://apidadosabertos.saude.gov.br/sisagua/...).
Acesso livre (sem autenticação). Endpoint principal:
  /sisagua/controle-mensal-parametros-basicos

Indicadores agregados por município/ano:
  sisagua_pct_amostras_conformes_coliformes  (ausência de coliformes totais)
  sisagua_pct_amostras_conformes_ecoli       (ausência de E. coli)
  sisagua_pct_cloro_conforme                 (>= 2,0 e <= 5,0 mg/L; portaria 888/2021)
  sisagua_pct_turbidez_conforme              (<= 5,0 uT)
  sisagua_total_amostras_analisadas          (soma anual)
  sisagua_meses_com_dados                    (proxy de cumprimento; 0..12)

Lê IBGE codes do Postgres (Railway) ou aceita lista via --co-municipio (csv).
"""
import sys, os, json, argparse, time
import urllib.request, urllib.parse, urllib.error
import psycopg2

BASE_URL = os.environ.get('SISAGUA_BASE_URL', 'https://apidadosabertos.saude.gov.br')
ENDPOINT = '/sisagua/controle-mensal-parametros-basicos'
PAGE_LIMIT = 1000


def _clean(v):
    if v is None: return None
    if isinstance(v, float) and v != v: return None
    if isinstance(v, dict): return {k: _clean(x) for k, x in v.items()}
    return v


def emit(rec):
    cleaned = {k: _clean(v) for k, v in rec.items()}
    sys.stdout.write(json.dumps(cleaned, ensure_ascii=False, allow_nan=False) + "\n")


def parse_years(arg):
    if '-' in arg:
        a, b = arg.split('-', 1)
        return list(range(int(a), int(b) + 1))
    return [int(y.strip()) for y in arg.split(',') if y.strip()]


def ibge7_to_ibge6(co7):
    s = str(co7).strip()
    return s[:6] if len(s) == 7 else s


def fetch_page(co6, ano, offset, retries=3):
    qs = urllib.parse.urlencode({
        'codigo_ibge': co6, 'ano_de_referencia': ano,
        'limit': PAGE_LIMIT, 'offset': offset,
    })
    url = f"{BASE_URL}{ENDPOINT}?{qs}"
    req = urllib.request.Request(url, headers={'accept': 'application/json'})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                items = data.get('parametros') if isinstance(data, dict) else data
                return items or []
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            if attempt == retries - 1:
                sys.stderr.write(f"[sisagua] fetch err {co6}/{ano} off={offset}: {e}\n")
                return []
            time.sleep(1.5 * (attempt + 1))
    return []


def aggregate(records, co7, ano):
    """Compute indicators from raw records for one município/ano."""
    if not records: return []
    coli_analisadas = coli_ausencia = 0
    ecoli_analisadas = ecoli_ausencia = 0
    cloro_total = cloro_conforme = 0
    turb_total = turb_conforme = 0
    total_analisadas = 0
    meses = set()
    for r in records:
        param = (r.get('parametro') or '').strip()
        campo = (r.get('campo') or '').strip()
        val = r.get('valor')
        try: vnum = float(val) if val is not None else 0.0
        except Exception: vnum = 0.0
        mes = r.get('mes_de_referencia')
        if mes: meses.add(int(mes))

        if campo == 'Número de amostras analisadas':
            total_analisadas += vnum
            if 'Coliformes totais' in param: coli_analisadas += vnum
            elif 'Escherichia coli' in param: ecoli_analisadas += vnum

        if 'Coliformes totais' in param and 'ausência de coliformes' in campo:
            coli_ausencia += vnum
        if 'Escherichia coli' in param and 'ausência para Escherichia coli' in campo:
            ecoli_ausencia += vnum

        # Cloro residual livre: conforme = entre 2,0 e 5,0 mg/L
        if 'Cloro Residual Livre' in param:
            if campo == 'Número de dados >= 2,0 mg/L e <= 5,0mg/L':
                cloro_conforme += vnum
            if campo == 'Número de amostras analisadas':
                cloro_total += vnum

        # Turbidez: conforme = <= 5,0 uT (sistema sem filtração) — proxy
        if 'Turbidez' in param:
            if campo == 'Número de dados <= 5,0 uT':
                turb_conforme += vnum
            if campo == 'Número de amostras analisadas':
                turb_total += vnum

    out = []
    base = {'co_municipio': co7, 'ano': ano, 'fonte': 'SISAGUA', 'recorte': None,
            'metadata': {'endpoint': 'controle-mensal-parametros-basicos'}}
    if coli_analisadas > 0:
        out.append({**base, 'indicador': 'sisagua_pct_amostras_conformes_coliformes',
                    'valor': round(coli_ausencia * 100.0 / coli_analisadas, 2),
                    'denominador': coli_analisadas, 'unidade': '%'})
    if ecoli_analisadas > 0:
        out.append({**base, 'indicador': 'sisagua_pct_amostras_conformes_ecoli',
                    'valor': round(ecoli_ausencia * 100.0 / ecoli_analisadas, 2),
                    'denominador': ecoli_analisadas, 'unidade': '%'})
    if cloro_total > 0:
        out.append({**base, 'indicador': 'sisagua_pct_cloro_conforme',
                    'valor': round(cloro_conforme * 100.0 / cloro_total, 2),
                    'denominador': cloro_total, 'unidade': '%'})
    if turb_total > 0:
        out.append({**base, 'indicador': 'sisagua_pct_turbidez_conforme',
                    'valor': round(turb_conforme * 100.0 / turb_total, 2),
                    'denominador': turb_total, 'unidade': '%'})
    if total_analisadas > 0:
        out.append({**base, 'indicador': 'sisagua_total_amostras_analisadas',
                    'valor': total_analisadas, 'denominador': None, 'unidade': 'amostras'})
    if meses:
        out.append({**base, 'indicador': 'sisagua_meses_com_dados',
                    'valor': len(meses), 'denominador': 12, 'unidade': 'meses'})
    return out


def process_municipio_year(co7, ano):
    co6 = ibge7_to_ibge6(co7)
    all_records = []
    offset = 0
    pages_fetched = 0
    MAX_PAGES = 50  # safety cap: 50 * PAGE_LIMIT = 50k unique rows
    while pages_fetched < MAX_PAGES:
        page = fetch_page(co6, ano, offset)
        pages_fetched += 1
        if not page: break  # may be end-of-data OR fetch error (after retries)
        all_records.extend(page)
        if len(page) < PAGE_LIMIT: break
        offset += PAGE_LIMIT  # offset is ROW-based per empirical test
    if pages_fetched >= MAX_PAGES:
        sys.stderr.write(f"[sisagua] {co7}/{ano} hit cap {MAX_PAGES} pages; partial data\n")
    indicators = aggregate(all_records, co7, ano)
    for ind in indicators: emit(ind)
    return len(indicators)


def list_municipios(states_arg, only_co=None):
    """Get list of IBGE7 codes from PG (saude_indicadores_municipio fonte=PNI ou IBGE table fallback)."""
    if only_co:
        # Accept CSV list; normalize to digit-only strings; reject invalid
        codes = []
        for raw in str(only_co).split(','):
            d = ''.join(ch for ch in raw.strip() if ch.isdigit())
            if len(d) == 7:
                codes.append(d)
            else:
                sys.stderr.write(f"[sisagua] ignorando código inválido (esperado IBGE7): {raw!r}\n")
        return codes
    db = os.environ.get('RAILWAY_DATABASE_URL') or os.environ.get('DATABASE_URL')
    if not db:
        sys.stderr.write("[sisagua] RAILWAY_DATABASE_URL não configurado\n")
        return []
    conn = psycopg2.connect(db)
    cur = conn.cursor()
    if states_arg and states_arg.upper() != 'ALL':
        ufs = [u.strip().upper() for u in states_arg.split(',')]
        # IBGE 7-digit: first 2 digits = código UF (MG=31, SP=35, etc.)
        UF_CODES = {'RO':'11','AC':'12','AM':'13','RR':'14','PA':'15','AP':'16','TO':'17',
                    'MA':'21','PI':'22','CE':'23','RN':'24','PB':'25','PE':'26','AL':'27','SE':'28','BA':'29',
                    'MG':'31','ES':'32','RJ':'33','SP':'35',
                    'PR':'41','SC':'42','RS':'43',
                    'MS':'50','MT':'51','GO':'52','DF':'53'}
        prefixes = [UF_CODES[u] for u in ufs if u in UF_CODES]
        if not prefixes:
            sys.stderr.write(f"[sisagua] UFs inválidas: {states_arg}\n")
            return []
        like_clauses = " OR ".join(["co_municipio LIKE %s" for _ in prefixes])
        cur.execute(
            f"SELECT DISTINCT co_municipio FROM saude_indicadores_municipio WHERE {like_clauses} ORDER BY co_municipio",
            tuple(p + '%' for p in prefixes))
    else:
        cur.execute("SELECT DISTINCT co_municipio FROM saude_indicadores_municipio ORDER BY co_municipio")
    rows = [r[0] for r in cur.fetchall()]
    cur.close(); conn.close()
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--years', required=True)
    ap.add_argument('--states', default='ALL')
    ap.add_argument('--co-municipio', default=None)
    args = ap.parse_args()

    years = parse_years(args.years)
    municipios = list_municipios(args.states, args.co_municipio)
    sys.stderr.write(f"[sisagua] {len(municipios)} municípios × {len(years)} anos = {len(municipios)*len(years)} pares\n")

    total = 0
    t0 = time.time()
    for i, co7 in enumerate(municipios):
        for ano in years:
            try:
                total += process_municipio_year(co7, ano)
            except Exception as e:
                sys.stderr.write(f"[sisagua] {co7}/{ano} ERR {e}\n")
        if (i + 1) % 50 == 0:
            elapsed = time.time() - t0
            rate = (i + 1) / elapsed
            eta = (len(municipios) - i - 1) / rate / 60
            sys.stderr.write(f"[sisagua] {i+1}/{len(municipios)} mun, total emitted={total}, eta={eta:.1f}min\n")
    sys.stderr.write(f"[sisagua] DONE total emitted={total} in {(time.time()-t0)/60:.1f}min\n")


if __name__ == '__main__':
    main()
