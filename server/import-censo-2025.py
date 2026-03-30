#!/usr/bin/env python3
"""
Importador Censo Escolar 2025 — Python (mais rápido com CSVs grandes).
Uso: python3 server/import-censo-2025.py
"""
import sqlite3, csv, json, time, sys, os

DB_PATH = os.environ.get("SQLITE_DATABASE_URL", "dev.db").replace("file:", "")
DADOS_DIR = "Dados/Censo Escolar 2025"
ANO = 2025
BATCH = 5000

DEP = {"1": "Federal", "2": "Estadual", "3": "Municipal", "4": "Privada"}
LOC = {"1": "Urbana", "2": "Rural"}
SIT = {"1": "Em Atividade", "2": "Paralisada", "3": "Extinta", "4": "Atividade Encerrada"}

def num(v):
    if v is None or v == "": return None
    try: return int(v)
    except: return None

def bn(v):
    if v == "1": return 1
    if v == "0": return 0
    return None

def read_csv(filename):
    path = os.path.join(DADOS_DIR, filename)
    with open(path, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter=";")
        yield from reader

def main():
    print(f"\n=== IMPORTADOR CENSO ESCOLAR 2025 (Python) ===\n")
    t0 = time.time()

    con = sqlite3.connect(DB_PATH)
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA synchronous=NORMAL")
    con.execute("PRAGMA cache_size=-32000")

    # ── 1. Escola ────────────────────────────────────────────────────────────
    print("[1/5] Tabela_Escola_2025.csv — dados base + infraestrutura")
    upsert_sql = """
        INSERT INTO censo_escolar (inep, ano, nome, municipio, uf, dependencia, localizacao, situacao,
                                   matriculas, docentes, turmas, dados, updated_at)
        VALUES (?,?,?,?,?,?,?,?,0,0,0,?,?)
        ON CONFLICT(inep, ano) DO UPDATE SET
            nome=excluded.nome, municipio=excluded.municipio, uf=excluded.uf,
            dependencia=excluded.dependencia, localizacao=excluded.localizacao,
            situacao=excluded.situacao, dados=excluded.dados, updated_at=excluded.updated_at
    """
    batch, count = [], 0
    ts = int(time.time()*1000)

    for e in read_csv("Tabela_Escola_2025.csv"):
        inep = e.get("CO_ENTIDADE", "").strip()
        if not inep: continue
        dep, loc, sit = e.get("TP_DEPENDENCIA",""), e.get("TP_LOCALIZACAO",""), e.get("TP_SITUACAO_FUNCIONAMENTO","")
        dados = {
            "co_municipio": e.get("CO_MUNICIPIO") or None,
            "co_uf":        e.get("CO_UF") or None,
            "co_regiao":    e.get("CO_REGIAO") or None,
            "no_regiao":    e.get("NO_REGIAO") or None,
            "co_cep":       e.get("CO_CEP") or None,
            "ds_endereco":  e.get("DS_ENDERECO") or None,
            "no_bairro":    e.get("NO_BAIRRO") or None,
            "telefone":     e.get("NU_TELEFONE") or None,
            "qt_salas_utilizadas":             num(e.get("QT_SALAS_UTILIZADAS")),
            "qt_salas_utiliza_climatizadas":   num(e.get("QT_SALAS_UTILIZA_CLIMATIZADAS")),
            "qt_salas_utilizadas_acessiveis":  num(e.get("QT_SALAS_UTILIZADAS_ACESSIVEIS")),
            "in_agua_potavel":        bn(e.get("IN_AGUA_POTAVEL")),
            "in_agua_rede_publica":   bn(e.get("IN_AGUA_REDE_PUBLICA")),
            "in_agua_poco_artesiano": bn(e.get("IN_AGUA_POCO_ARTESIANO")),
            "in_agua_cacimba":        bn(e.get("IN_AGUA_CACIMBA")),
            "in_agua_fonte_rio":      bn(e.get("IN_AGUA_FONTE_RIO")),
            "in_agua_inexistente":    bn(e.get("IN_AGUA_INEXISTENTE")),
            "in_energia_rede_publica":   bn(e.get("IN_ENERGIA_REDE_PUBLICA")),
            "in_energia_gerador_fossil": bn(e.get("IN_ENERGIA_GERADOR_FOSSIL")),
            "in_energia_renovavel":      bn(e.get("IN_ENERGIA_RENOVAVEL")),
            "in_energia_inexistente":    bn(e.get("IN_ENERGIA_INEXISTENTE")),
            "in_esgoto_rede_publica":  bn(e.get("IN_ESGOTO_REDE_PUBLICA")),
            "in_esgoto_fossa_septica": bn(e.get("IN_ESGOTO_FOSSA_SEPTICA")),
            "in_esgoto_fossa_comum":   bn(e.get("IN_ESGOTO_FOSSA_COMUM")),
            "in_esgoto_fossa":         bn(e.get("IN_ESGOTO_FOSSA")),
            "in_esgoto_inexistente":   bn(e.get("IN_ESGOTO_INEXISTENTE")),
            "in_lixo_servico_coleta":        bn(e.get("IN_LIXO_SERVICO_COLETA")),
            "in_lixo_queima":                bn(e.get("IN_LIXO_QUEIMA")),
            "in_lixo_destino_final_publico": bn(e.get("IN_LIXO_DESTINO_FINAL_PUBLICO")),
            "in_biblioteca":               bn(e.get("IN_BIBLIOTECA")),
            "in_biblioteca_sala_leitura":  bn(e.get("IN_BIBLIOTECA_SALA_LEITURA")),
            "in_quadra_esportes":          bn(e.get("IN_QUADRA_ESPORTES")),
            "in_quadra_esportes_coberta":  bn(e.get("IN_QUADRA_ESPORTES_COBERTA")),
            "in_quadra_esportes_descoberta": bn(e.get("IN_QUADRA_ESPORTES_DESCOBERTA")),
            "in_laboratorio_informatica":  bn(e.get("IN_LABORATORIO_INFORMATICA")),
            "in_laboratorio_ciencias":     bn(e.get("IN_LABORATORIO_CIENCIAS")),
            "in_auditorio":                bn(e.get("IN_AUDITORIO")),
            "in_cozinha":                  bn(e.get("IN_COZINHA")),
            "in_almoxarifado":             bn(e.get("IN_ALMOXARIFADO")),
            "in_banheiro":                 bn(e.get("IN_BANHEIRO")),
            "in_banheiro_pne":             bn(e.get("IN_BANHEIRO_PNE")),
            "in_refeitorio":               bn(e.get("IN_REFEITORIO")),
            "in_parque_infantil":          bn(e.get("IN_PARQUE_INFANTIL")),
            "in_area_verde":               bn(e.get("IN_AREA_VERDE")),
            "in_internet":                bn(e.get("IN_INTERNET")),
            "in_internet_alunos":         bn(e.get("IN_INTERNET_ALUNOS")),
            "in_internet_administrativo": bn(e.get("IN_INTERNET_ADMINISTRATIVO")),
            "in_banda_larga":             bn(e.get("IN_BANDA_LARGA")),
            "in_alimentacao":             bn(e.get("IN_ALIMENTACAO")),
            "in_tempo_integral":          bn(e.get("IN_TEMPO_INTEGRAL")),
            "in_educacao_indigena":       bn(e.get("IN_EDUCACAO_INDIGENA")),
            "in_educacao_quilombola":     bn(e.get("IN_EDUCACAO_QUILOMBOLA")),
            "in_educacao_campo":          bn(e.get("IN_EDUCACAO_CAMPO")),
            "in_lingua_ingles":           bn(e.get("IN_LINGUA_INGLES")),
            "in_lingua_espanhol":         bn(e.get("IN_LINGUA_ESPANHOL")),
            "in_lingua_frances":          bn(e.get("IN_LINGUA_FRANCES")),
            "in_lingua_libras":           bn(e.get("IN_LINGUA_LIBRAS")),
            "in_lingua_indigena":         bn(e.get("IN_LINGUA_INDIGENA")),
            "in_lingua_outra_estrang":    bn(e.get("IN_LINGUA_OUTRA_ESTRANG")),
            "tp_dependencia": dep,
            "tp_localizacao": loc,
            "tp_situacao":    sit,
        }
        batch.append((inep, ANO, e.get("NO_ENTIDADE") or None, e.get("NO_MUNICIPIO") or None,
                      e.get("SG_UF") or None, DEP.get(dep), LOC.get(loc), SIT.get(sit),
                      json.dumps(dados, ensure_ascii=False), ts))
        count += 1
        if len(batch) >= BATCH:
            con.executemany(upsert_sql, batch); con.commit(); batch = []
            print(f"  {count} escolas...", end="\r")

    if batch: con.executemany(upsert_sql, batch); con.commit()
    print(f"  Escola: {count} registros inseridos/atualizados em {time.time()-t0:.1f}s")

    # ── 2. Matrículas ─────────────────────────────────────────────────────────
    print("[2/5] Tabela_Matricula_2025.csv")
    t1 = time.time(); batch, count = [], 0
    upd_mat = "UPDATE censo_escolar SET matriculas=?, dados=json_patch(dados,?), updated_at=? WHERE inep=? AND ano=2025"
    for m in read_csv("Tabela_Matricula_2025.csv"):
        inep = m.get("CO_ENTIDADE","").strip()
        if not inep: continue
        patch = {
            "qt_mat_bas": num(m.get("QT_MAT_BAS")), "qt_mat_inf": num(m.get("QT_MAT_INF")),
            "qt_mat_inf_cre": num(m.get("QT_MAT_INF_CRE")), "qt_mat_inf_pre": num(m.get("QT_MAT_INF_PRE")),
            "qt_mat_fund": num(m.get("QT_MAT_FUND")), "qt_mat_fund_ai": num(m.get("QT_MAT_FUND_AI")),
            "qt_mat_fund_af": num(m.get("QT_MAT_FUND_AF")), "qt_mat_med": num(m.get("QT_MAT_MED")),
            "qt_mat_eja": num(m.get("QT_MAT_EJA")), "qt_mat_esp": num(m.get("QT_MAT_ESP")),
            "qt_mat_bas_fem": num(m.get("QT_MAT_BAS_FEM")), "qt_mat_bas_masc": num(m.get("QT_MAT_BAS_MASC")),
            "qt_mat_zr_urba": num(m.get("QT_MAT_ZR_URB")),  "qt_mat_zr_rura": num(m.get("QT_MAT_ZR_RUR")),
            "qt_mat_bas_branca":   num(m.get("QT_MAT_BAS_BRANCA")),  "qt_mat_bas_preta":   num(m.get("QT_MAT_BAS_PRETA")),
            "qt_mat_bas_parda":    num(m.get("QT_MAT_BAS_PARDA")),   "qt_mat_bas_amarela": num(m.get("QT_MAT_BAS_AMARELA")),
            "qt_mat_bas_indigena": num(m.get("QT_MAT_BAS_INDIGENA")), "qt_mat_bas_nd":     num(m.get("QT_MAT_BAS_ND")),
            "qt_mat_eja_fund": num(m.get("QT_MAT_EJA_FUND")), "qt_mat_eja_med": num(m.get("QT_MAT_EJA_MED")),
            "qt_mat_esp_cc":   num(m.get("QT_MAT_ESP_CC")),  "qt_mat_esp_ce":  num(m.get("QT_MAT_ESP_CE")),
            "qt_mat_prof":     num(m.get("QT_MAT_PROF")),    "qt_mat_prof_tec": num(m.get("QT_MAT_PROF_TEC")),
            "qt_mat_int":      num(m.get("QT_MAT_BAS_INT")), "qt_mat_int_fund": num(m.get("QT_MAT_FUND_INT")),
            "qt_mat_int_med":  num(m.get("QT_MAT_MED_INT")),
        }
        batch.append((num(m.get("QT_MAT_BAS")) or 0, json.dumps(patch, ensure_ascii=False), ts, inep))
        count += 1
        if len(batch) >= BATCH:
            con.executemany(upd_mat, batch); con.commit(); batch = []
            print(f"  {count}...", end="\r")
    if batch: con.executemany(upd_mat, batch); con.commit()
    print(f"  Matriculas: {count} em {time.time()-t1:.1f}s")

    # ── 3. Docentes ───────────────────────────────────────────────────────────
    print("[3/5] Tabela_Docente_2025.csv")
    t1 = time.time(); batch, count = [], 0
    upd_doc = "UPDATE censo_escolar SET docentes=?, dados=json_patch(dados,?), updated_at=? WHERE inep=? AND ano=2025"
    for d in read_csv("Tabela_Docente_2025.csv"):
        inep = d.get("CO_ENTIDADE","").strip()
        if not inep: continue
        patch = {
            "qt_doc_bas": num(d.get("QT_DOC_BAS")), "qt_doc_fund": num(d.get("QT_DOC_FUND")),
            "qt_doc_fund_ai": num(d.get("QT_DOC_FUND_AI")), "qt_doc_fund_af": num(d.get("QT_DOC_FUND_AF")),
            "qt_doc_med": num(d.get("QT_DOC_MED")), "qt_doc_eja": num(d.get("QT_DOC_EJA")),
        }
        batch.append((num(d.get("QT_DOC_BAS")) or 0, json.dumps(patch, ensure_ascii=False), ts, inep))
        count += 1
        if len(batch) >= BATCH:
            con.executemany(upd_doc, batch); con.commit(); batch = []
            print(f"  {count}...", end="\r")
    if batch: con.executemany(upd_doc, batch); con.commit()
    print(f"  Docentes: {count} em {time.time()-t1:.1f}s")

    # ── 4. Turmas ─────────────────────────────────────────────────────────────
    print("[4/5] Tabela_Turma_2025.csv")
    t1 = time.time(); batch, count = [], 0
    upd_tur = "UPDATE censo_escolar SET turmas=?, dados=json_patch(dados,?), updated_at=? WHERE inep=? AND ano=2025"
    for t in read_csv("Tabela_Turma_2025.csv"):
        inep = t.get("CO_ENTIDADE","").strip()
        if not inep: continue
        patch = {
            "qt_tur_bas": num(t.get("QT_TUR_BAS")), "qt_tur_fund": num(t.get("QT_TUR_FUND")),
            "qt_tur_fund_ai": num(t.get("QT_TUR_FUND_AI")), "qt_tur_fund_af": num(t.get("QT_TUR_FUND_AF")),
            "qt_tur_med": num(t.get("QT_TUR_MED")), "qt_tur_bas_d": num(t.get("QT_TUR_BAS_D")),
            "qt_tur_bas_n": num(t.get("QT_TUR_BAS_N")),
        }
        batch.append((num(t.get("QT_TUR_BAS")) or 0, json.dumps(patch, ensure_ascii=False), ts, inep))
        count += 1
        if len(batch) >= BATCH:
            con.executemany(upd_tur, batch); con.commit(); batch = []
            print(f"  {count}...", end="\r")
    if batch: con.executemany(upd_tur, batch); con.commit()
    print(f"  Turmas: {count} em {time.time()-t1:.1f}s")

    # ── 5. Gestores ───────────────────────────────────────────────────────────
    print("[5/5] Tabela_Gestor_Escolar_2025.csv")
    t1 = time.time(); batch, count = [], 0
    upd_gest = "UPDATE censo_escolar SET dados=json_patch(dados,?), updated_at=? WHERE inep=? AND ano=2025"
    for g in read_csv("Tabela_Gestor_Escolar_2025.csv"):
        inep = g.get("CO_ENTIDADE","").strip()
        if not inep: continue
        patch = {"qt_gest_bas": num(g.get("QT_GEST_BAS"))}
        batch.append((json.dumps(patch, ensure_ascii=False), ts, inep))
        count += 1
        if len(batch) >= BATCH:
            con.executemany(upd_gest, batch); con.commit(); batch = []
            print(f"  {count}...", end="\r")
    if batch: con.executemany(upd_gest, batch); con.commit()
    print(f"  Gestores: {count} em {time.time()-t1:.1f}s")

    # ── Final ─────────────────────────────────────────────────────────────────
    cnt = con.execute("SELECT COUNT(*) FROM censo_escolar WHERE ano=2025").fetchone()[0]
    print(f"\n✅ {cnt} escolas 2025 no banco (total: {time.time()-t0:.0f}s)")
    con.close()

if __name__ == "__main__":
    main()
