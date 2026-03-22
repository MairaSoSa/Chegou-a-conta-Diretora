#!/usr/bin/env python3
"""Passos 4-5: turmas e gestores."""
import sqlite3, csv, json, time, os

DB_PATH = os.environ.get("SQLITE_DATABASE_URL", "dev.db").replace("file:", "")
DADOS_DIR = "Dados/Censo Escolar 2025"
BATCH = 5000

def num(v): return int(v) if v and v.strip().lstrip('-').isdigit() else None

con = sqlite3.connect(DB_PATH)
con.execute("PRAGMA journal_mode=WAL"); con.execute("PRAGMA synchronous=NORMAL")
con.execute("PRAGMA cache_size=-32000")
ts = int(time.time()*1000)

def run_update(label, filename, build_patch_fn, update_sql):
    print(f"\n[{label}] {filename}")
    t = time.time(); batch, count = [], 0
    with open(os.path.join(DADOS_DIR, filename), encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            inep = row.get("CO_ENTIDADE","").strip()
            if not inep: continue
            params = build_patch_fn(row, inep)
            if params is None: continue
            batch.append(params)
            count += 1
            if len(batch) >= BATCH:
                con.executemany(update_sql, batch); con.commit(); batch=[]
                print(f"  {count}...", end="\r")
    if batch: con.executemany(update_sql, batch); con.commit()
    print(f"  {count} atualizados em {time.time()-t:.1f}s")

# ── 4. Turmas ────────────────────────────────────────────────────────────────
upd_tur = "UPDATE censo_escolar SET turmas=?,dados=json_patch(dados,?),updated_at=? WHERE inep=? AND ano=2025"
def tur_patch(t, inep):
    patch = {
        "qt_tur_bas":num(t.get("QT_TUR_BAS")),"qt_tur_fund":num(t.get("QT_TUR_FUND")),
        "qt_tur_fund_ai":num(t.get("QT_TUR_FUND_AI")),"qt_tur_fund_af":num(t.get("QT_TUR_FUND_AF")),
        "qt_tur_med":num(t.get("QT_TUR_MED")),"qt_tur_bas_d":num(t.get("QT_TUR_BAS_D")),
        "qt_tur_bas_n":num(t.get("QT_TUR_BAS_N")),
    }
    return (num(t.get("QT_TUR_BAS")) or 0, json.dumps(patch,ensure_ascii=False), ts, inep)

run_update("4/5","Tabela_Turma_2025.csv", tur_patch, upd_tur)

# ── 5. Gestores ──────────────────────────────────────────────────────────────
upd_gest = "UPDATE censo_escolar SET dados=json_patch(dados,?),updated_at=? WHERE inep=? AND ano=2025"
def gest_patch(g, inep):
    patch = {"qt_gest_bas":num(g.get("QT_GEST_BAS"))}
    return (json.dumps(patch,ensure_ascii=False), ts, inep)

run_update("5/5","Tabela_Gestor_Escolar_2025.csv", gest_patch, upd_gest)

cnt = con.execute("SELECT COUNT(*) FROM censo_escolar WHERE ano=2025").fetchone()[0]
with_tur = con.execute("SELECT COUNT(*) FROM censo_escolar WHERE ano=2025 AND json_extract(dados,'$.qt_tur_bas') IS NOT NULL").fetchone()[0]
print(f"\n✅ Total 2025: {cnt} escolas | {with_tur} com turmas")
con.close()
