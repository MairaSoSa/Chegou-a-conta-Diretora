#!/usr/bin/env python3
"""Patch DDD into telefone field for all 2025 escola records in SQLite."""
import sqlite3, json

DB = "/home/runner/workspace/dev.db"

SINGLE_DDD = {
    'AC': '68', 'AL': '82', 'AP': '96', 'DF': '61',
    'MS': '67', 'RO': '69', 'RR': '95', 'SE': '79',
    'TO': '63', 'RN': '84', 'PB': '83',
}

RANGE_DDD = {
    'AM': [(1301001,'92'),(1304062,'97'),(1304211,'92'),(9999999,'97')],
    'PA': [(1501907,'91'),(1502004,'91'),(1502103,'91'),(1502400,'91'),
           (1502756,'91'),(1503044,'91'),(1503903,'93'),(1504208,'94'),
           (1504422,'94'),(1504703,'91'),(1505064,'93'),(1506138,'91'),
           (1507961,'93'),(1508035,'94'),(9999999,'91')],
    'MA': [(2100055,'98'),(2102200,'99'),(2104800,'98'),(2104909,'99'),(2109700,'98'),(9999999,'99')],
    'PI': [(2200103,'86'),(2204600,'86'),(2205508,'89'),(9999999,'89')],
    'CE': [(2307650,'85'),(2307700,'88'),(9999999,'88')],
    'PE': [(2606804,'81'),(2607901,'87'),(9999999,'81')],
    'BA': [(2901809,'75'),(2905701,'73'),(2910800,'74'),(2919553,'77'),
           (2920205,'71'),(2924801,'73'),(2930105,'71'),(9999999,'77')],
    'MG': [(3101375,'37'),(3102605,'31'),(3107604,'38'),(3118601,'33'),
           (3120904,'35'),(3136702,'34'),(3143302,'31'),(3143402,'35'),
           (3152402,'35'),(3155504,'32'),(3160009,'37'),(3162500,'35'),
           (3170206,'38'),(9999999,'37')],
    'ES': [(3201902,'27'),(3204906,'28'),(9999999,'27')],
    'RJ': [(3300456,'21'),(3303401,'21'),(3303609,'21'),(3304557,'21'),
           (3305109,'21'),(3305307,'24'),(9999999,'24')],
    'SP': [(3502804,'11'),(3503208,'14'),(3509007,'13'),(3513801,'14'),
           (3518701,'12'),(3523107,'19'),(3530607,'11'),(3547809,'16'),
           (3548708,'17'),(3550308,'11'),(3552502,'15'),(9999999,'19')],
    'PR': [(4100103,'46'),(4103008,'42'),(4106902,'41'),(4108304,'43'),
           (4115200,'44'),(4116505,'45'),(4119152,'42'),(9999999,'43')],
    'SC': [(4202404,'47'),(4204202,'49'),(4205407,'48'),(4209102,'47'),
           (4215901,'48'),(9999999,'49')],
    'RS': [(4300034,'55'),(4302105,'53'),(4304606,'54'),(4306106,'51'),
           (4309209,'55'),(4311403,'54'),(4313409,'53'),(4314100,'51'),
           (4316907,'55'),(9999999,'51')],
    'MT': [(5101902,'65'),(5102702,'66'),(9999999,'65')],
    'GO': [(5200050,'62'),(5201405,'64'),(5204557,'61'),(5208004,'62'),(9999999,'64')],
}

def get_ddd(uf, co_municipio):
    if uf in SINGLE_DDD:
        return SINGLE_DDD[uf]
    if uf in RANGE_DDD and co_municipio:
        co_int = int(co_municipio)
        for max_code, ddd in RANGE_DDD[uf]:
            if co_int <= max_code:
                return ddd
    return None

conn = sqlite3.connect(DB)
conn.execute("PRAGMA journal_mode=WAL")
conn.execute("PRAGMA synchronous=NORMAL")
conn.execute("PRAGMA cache_size=10000")
cur = conn.cursor()

cur.execute("""SELECT rowid, uf, json_extract(dados,'$.co_municipio'), json_extract(dados,'$.telefone')
    FROM censo_escolar
    WHERE ano=2025 AND json_extract(dados,'$.telefone') IS NOT NULL""")
rows = cur.fetchall()
print(f"Escolas com telefone: {len(rows)}")

# Build list of (rowid, new_telefone_value) only for rows that need updating
updates = []
skipped = 0
for rowid, uf, co_mun, tel in rows:
    if not tel or '(' in str(tel):
        continue
    ddd = get_ddd(uf, co_mun)
    if ddd:
        updates.append((f"({ddd}) {tel}", rowid))
    else:
        skipped += 1

print(f"Para atualizar: {len(updates)} | Sem mapeamento: {skipped}")

# Use json_set for efficient SQL-level update
BATCH = 5000
conn.execute("BEGIN")
for i in range(0, len(updates), BATCH):
    batch = updates[i:i+BATCH]
    conn.executemany(
        "UPDATE censo_escolar SET dados=json_set(dados,'$.telefone',?) WHERE rowid=?",
        batch
    )
    if i % 20000 == 0:
        print(f"  {i}/{len(updates)}...")
conn.execute("COMMIT")
conn.close()
print(f"Atualizados: {len(updates)}")
