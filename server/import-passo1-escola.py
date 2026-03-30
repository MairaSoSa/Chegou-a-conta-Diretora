#!/usr/bin/env python3
"""Passo 1: importa Tabela_Escola_2025.csv, pula ineps já existentes."""
import sqlite3, csv, json, time, os

DB_PATH = os.environ.get("SQLITE_DATABASE_URL", "dev.db").replace("file:", "")
DADOS_DIR = "Dados/Censo Escolar 2025"
ANO = 2025; BATCH = 5000

DEP = {"1": "Federal", "2": "Estadual", "3": "Municipal", "4": "Privada"}
LOC = {"1": "Urbana", "2": "Rural"}
SIT = {"1": "Em Atividade", "2": "Paralisada", "3": "Extinta", "4": "Atividade Encerrada"}

def num(v): return int(v) if v and v.strip().lstrip('-').isdigit() else None
def bn(v): return 1 if v=="1" else (0 if v=="0" else None)

con = sqlite3.connect(DB_PATH)
con.execute("PRAGMA journal_mode=WAL"); con.execute("PRAGMA synchronous=NORMAL")
con.execute("PRAGMA cache_size=-32000")

# Carregar ineps já importados
existing = set(r[0] for r in con.execute("SELECT inep FROM censo_escolar WHERE ano=2025"))
print(f"Já importados: {len(existing)}")

upsert_sql = """
    INSERT INTO censo_escolar (inep,ano,nome,municipio,uf,dependencia,localizacao,situacao,matriculas,docentes,turmas,dados,updated_at)
    VALUES (?,?,?,?,?,?,?,?,0,0,0,?,?)
    ON CONFLICT(inep,ano) DO UPDATE SET
        nome=excluded.nome,municipio=excluded.municipio,uf=excluded.uf,
        dependencia=excluded.dependencia,localizacao=excluded.localizacao,
        situacao=excluded.situacao,dados=excluded.dados,updated_at=excluded.updated_at
"""
batch, count, skipped = [], 0, 0
ts = int(time.time()*1000)

with open(os.path.join(DADOS_DIR,"Tabela_Escola_2025.csv"), encoding="utf-8", errors="replace") as f:
    reader = csv.DictReader(f, delimiter=";")
    for e in reader:
        inep = e.get("CO_ENTIDADE","").strip()
        if not inep: continue
        if inep in existing: skipped += 1; continue
        dep,loc,sit = e.get("TP_DEPENDENCIA",""),e.get("TP_LOCALIZACAO",""),e.get("TP_SITUACAO_FUNCIONAMENTO","")
        dados = {
            "co_municipio":e.get("CO_MUNICIPIO") or None,"co_uf":e.get("CO_UF") or None,
            "co_regiao":e.get("CO_REGIAO") or None,"no_regiao":e.get("NO_REGIAO") or None,
            "co_cep":e.get("CO_CEP") or None,"ds_endereco":e.get("DS_ENDERECO") or None,
            "no_bairro":e.get("NO_BAIRRO") or None,"telefone":e.get("NU_TELEFONE") or None,
            "qt_salas_utilizadas":num(e.get("QT_SALAS_UTILIZADAS")),
            "qt_salas_utiliza_climatizadas":num(e.get("QT_SALAS_UTILIZA_CLIMATIZADAS")),
            "qt_salas_utilizadas_acessiveis":num(e.get("QT_SALAS_UTILIZADAS_ACESSIVEIS")),
            "in_agua_potavel":bn(e.get("IN_AGUA_POTAVEL")),"in_agua_rede_publica":bn(e.get("IN_AGUA_REDE_PUBLICA")),
            "in_agua_poco_artesiano":bn(e.get("IN_AGUA_POCO_ARTESIANO")),"in_agua_cacimba":bn(e.get("IN_AGUA_CACIMBA")),
            "in_agua_fonte_rio":bn(e.get("IN_AGUA_FONTE_RIO")),"in_agua_inexistente":bn(e.get("IN_AGUA_INEXISTENTE")),
            "in_energia_rede_publica":bn(e.get("IN_ENERGIA_REDE_PUBLICA")),"in_energia_gerador_fossil":bn(e.get("IN_ENERGIA_GERADOR_FOSSIL")),
            "in_energia_renovavel":bn(e.get("IN_ENERGIA_RENOVAVEL")),"in_energia_inexistente":bn(e.get("IN_ENERGIA_INEXISTENTE")),
            "in_esgoto_rede_publica":bn(e.get("IN_ESGOTO_REDE_PUBLICA")),"in_esgoto_fossa_septica":bn(e.get("IN_ESGOTO_FOSSA_SEPTICA")),
            "in_esgoto_fossa_comum":bn(e.get("IN_ESGOTO_FOSSA_COMUM")),"in_esgoto_fossa":bn(e.get("IN_ESGOTO_FOSSA")),
            "in_esgoto_inexistente":bn(e.get("IN_ESGOTO_INEXISTENTE")),
            "in_lixo_servico_coleta":bn(e.get("IN_LIXO_SERVICO_COLETA")),"in_lixo_queima":bn(e.get("IN_LIXO_QUEIMA")),
            "in_lixo_destino_final_publico":bn(e.get("IN_LIXO_DESTINO_FINAL_PUBLICO")),
            "in_biblioteca":bn(e.get("IN_BIBLIOTECA")),"in_biblioteca_sala_leitura":bn(e.get("IN_BIBLIOTECA_SALA_LEITURA")),
            "in_quadra_esportes":bn(e.get("IN_QUADRA_ESPORTES")),"in_quadra_esportes_coberta":bn(e.get("IN_QUADRA_ESPORTES_COBERTA")),
            "in_quadra_esportes_descoberta":bn(e.get("IN_QUADRA_ESPORTES_DESCOBERTA")),
            "in_laboratorio_informatica":bn(e.get("IN_LABORATORIO_INFORMATICA")),"in_laboratorio_ciencias":bn(e.get("IN_LABORATORIO_CIENCIAS")),
            "in_auditorio":bn(e.get("IN_AUDITORIO")),"in_cozinha":bn(e.get("IN_COZINHA")),
            "in_almoxarifado":bn(e.get("IN_ALMOXARIFADO")),"in_banheiro":bn(e.get("IN_BANHEIRO")),
            "in_banheiro_pne":bn(e.get("IN_BANHEIRO_PNE")),"in_refeitorio":bn(e.get("IN_REFEITORIO")),
            "in_parque_infantil":bn(e.get("IN_PARQUE_INFANTIL")),"in_area_verde":bn(e.get("IN_AREA_VERDE")),
            "in_internet":bn(e.get("IN_INTERNET")),"in_internet_alunos":bn(e.get("IN_INTERNET_ALUNOS")),
            "in_internet_administrativo":bn(e.get("IN_INTERNET_ADMINISTRATIVO")),"in_banda_larga":bn(e.get("IN_BANDA_LARGA")),
            "in_alimentacao":bn(e.get("IN_ALIMENTACAO")),
            "in_tempo_integral":bn(e.get("IN_TEMPO_INTEGRAL")),
            "in_educacao_indigena":bn(e.get("IN_EDUCACAO_INDIGENA")),
            "in_educacao_quilombola":bn(e.get("IN_EDUCACAO_QUILOMBOLA")),
            "in_educacao_campo":bn(e.get("IN_EDUCACAO_CAMPO")),
            "in_lingua_ingles":bn(e.get("IN_LINGUA_INGLES")),
            "in_lingua_espanhol":bn(e.get("IN_LINGUA_ESPANHOL")),
            "in_lingua_frances":bn(e.get("IN_LINGUA_FRANCES")),
            "in_lingua_libras":bn(e.get("IN_LINGUA_LIBRAS")),
            "in_lingua_indigena":bn(e.get("IN_LINGUA_INDIGENA")),
            "in_lingua_outra_estrang":bn(e.get("IN_LINGUA_OUTRA_ESTRANG")),
            "tp_dependencia":dep,"tp_localizacao":loc,"tp_situacao":sit,
        }
        batch.append((inep,ANO,e.get("NO_ENTIDADE") or None,e.get("NO_MUNICIPIO") or None,
                      e.get("SG_UF") or None,DEP.get(dep),LOC.get(loc),SIT.get(sit),
                      json.dumps(dados,ensure_ascii=False),ts))
        count += 1
        if len(batch) >= BATCH:
            con.executemany(upsert_sql,batch); con.commit(); batch=[]
            print(f"  +{count} inseridos (pulei {skipped} existentes)...", end="\r")

if batch: con.executemany(upsert_sql,batch); con.commit()
total = con.execute("SELECT COUNT(*) FROM censo_escolar WHERE ano=2025").fetchone()[0]
print(f"\n✅ Escola: +{count} novos | {skipped} pulados | Total no DB: {total}")
con.close()
