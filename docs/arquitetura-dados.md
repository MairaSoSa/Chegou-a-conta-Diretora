# Arquitetura de Dados — Painel de Dados Educacionais

---

## FONTE 1 — Censo Escolar INEP (Microdados)

**Formato:** CSV dentro de ZIP  
**Como entra no sistema:** Download pelo painel admin → importação em lote no banco SQLite  
**URL de download:**
```
https://download.inep.gov.br/microdados/microdados_ed_basica_{ANO}.zip
```
Exemplo: `https://download.inep.gov.br/microdados/microdados_ed_basica_2024.zip`

**Anos disponíveis:** 2020, 2021, 2022, 2023, 2024

**Campos salvos no banco (tabela `censo_escolar`):**

| Campo no banco | Campo original INEP | O que é |
|---|---|---|
| `inep` | CO_ENTIDADE | Código único da escola (8 dígitos) |
| `nome` | NO_ENTIDADE | Nome da escola |
| `municipio` | NO_MUNICIPIO | Nome do município |
| `uf` | SG_UF | Sigla do estado (SP, MG, RS...) |
| `dependencia` | TP_DEPENDENCIA | Federal / Estadual / Municipal / Privada |
| `localizacao` | TP_LOCALIZACAO | Urbana / Rural |
| `situacao` | TP_SITUACAO_FUNCIONAMENTO | Em Atividade / Paralisada / Extinta |
| `matriculas` | QT_MAT_BAS | Total de matrículas |
| `docentes` | QT_DOC_BAS | Total de docentes |
| `turmas` | QT_TUR_BAS | Total de turmas |
| `dados` | (JSON com todo o resto) | Ver detalhes abaixo |

**Dentro do campo `dados` (JSON) — campos detalhados do CSV:**

- **Matrículas por etapa:** QT_MAT_INF, QT_MAT_FUND_AI, QT_MAT_FUND_AF, QT_MAT_MED, QT_MAT_EJA, QT_MAT_PROF
- **Matrículas por turno:** QT_MAT_DIURNO, QT_MAT_NOTURNO, QT_MAT_EAD
- **Matrículas por sexo:** QT_MAT_MASC, QT_MAT_FEM
- **Matrículas por raça/cor:** QT_MAT_BRANCA, QT_MAT_PRETA, QT_MAT_PARDA, QT_MAT_AMARELA, QT_MAT_INDIGENA, QT_MAT_ND
- **Docentes por etapa:** QT_DOC_INF, QT_DOC_FUND, QT_DOC_MED, QT_DOC_EJA
- **Funcionários:** QT_FUNCIONARIOS, QT_BIBLIOTECARIO, QT_PSICOLOGO, QT_ADMINISTRADOR
- **Salas:** QT_SALAS_UTILIZADAS, QT_SALAS_EXISTENTES
- **Tecnologia:** QT_COMP_ALUNO, QT_TABLET_ALUNO, QT_DESKTOP_ALUNO, IN_INTERNET, IN_BANDA_LARGA
- **Infraestrutura:** IN_BIBLIOTECA, IN_LAB_CIENCIAS, IN_LAB_INFORMATICA, IN_QUADRA_COBERTA, IN_QUADRA_DESCOBERTA, IN_COZINHA, IN_REFEITORIO, IN_AREA_VERDE
- **Acessibilidade:** IN_RAMPA, IN_ELEVADOR, IN_PISO_TATIL, IN_SANITARIO_PNE
- **Saneamento:** IN_AGUA_POTAVEL, IN_AGUA_REDE_PUBLICA, IN_ESGOTO_REDE_PUBLICA, IN_ENERGIA_RENOVAVEL, IN_LIXO_COLETA
- **Vida institucional:** IN_ORGAO_CONSELHO_ESCOLAR, IN_ORGAO_APM, IN_ORGAO_GREMIO, IN_REDES_SOCIAIS, IN_EDUCACAO_INDIGENA, IN_EDUCACAO_QUILOMBOLA, IN_AEE
- **Regulamentação:** IN_REGIMENTO_ESCOLAR, IN_PROJETO_POLITICO_PEDAGOGICO, IN_PREDIO_ESCOLAR

---

## FONTE 2 — Indicadores Educacionais INEP

**Formato:** XLSX dentro de ZIP  
**Como entra no sistema:** Download pelo painel admin → importação em lote  
**Base URL:**
```
https://download.inep.gov.br/informacoes_estatisticas/indicadores_educacionais/{ANO}/
```
**Tabela no banco:** `indicadores_educacionais` (campo `tipo` identifica cada indicador)

---

### 2a. TDI — Distorção Idade-Série

**Arquivo:** `TDI_{ANO}_ESCOLAS.zip`  
**Anos:** 2020, 2021, 2022, 2023, 2024  
**Campos:**

| Campo INEP | O que é |
|---|---|
| FUN_01_CAT_0 | TDI 1º ano do Fundamental |
| FUN_02_CAT_0 | TDI 2º ano do Fundamental |
| FUN_03_CAT_0 | ... até o 9º ano |
| MED_CAT_0 | TDI Ensino Médio |

---

### 2b. ATU — Média de Alunos por Turma

**Arquivo:** `ATU_{ANO}_ESCOLAS.zip`  
**Anos:** 2020, 2021, 2022, 2023, 2024  
**Campos:** média por etapa de ensino (Fundamental AI, AF, Médio, EJA)

---

### 2c. HAD — Horas-Aula Diárias

**Arquivo:** `HAD_{ANO}_ESCOLAS.zip`  
**Anos:** 2020, 2021, 2022, 2023, 2024  
**Campo principal:** horas-aula médias por dia

---

### 2d. DSU — Docentes com Nível Superior

**Arquivo:** `DSU_{ANO}_ESCOLAS.zip`  
**Anos:** 2020, 2021, 2022, 2023, 2024  
**Campo:** percentual de docentes com diploma de ensino superior

---

### 2e. ICG — Índice de Complexidade de Gestão

**Arquivo:** `ICG_{ANO}_ESCOLAS.zip`  
**Anos:** 2020, 2021, 2022, 2023, 2024  
**Campo:** índice de 1 a 6 que mede a dificuldade de gestão da escola

---

### 2f. IRD — Índice de Regularidade Docente

**Arquivo:** `IRD_{ANO}_ESCOLAS.zip`  
**Anos:** 2020, 2021, 2022, 2023, 2024  
**Campo:** regularidade do mesmo professor na mesma turma ao longo dos anos

---

### 2g. Taxas de Rendimento

**Arquivo:** `tx_rend_escolas_{ANO}.zip`  
**Anos:** 2020, 2021, 2022, 2023, 2024  
**Campos:**

| Campo | O que é |
|---|---|
| taxa_aprovacao | % de aprovação |
| taxa_reprovacao | % de reprovação |
| taxa_abandono | % de abandono escolar |

---

### 2h. AFD — Adequação da Formação Docente

**Arquivo:** `AFD_{ANO}_ESCOLAS.zip`  
**Anos:** 2020, 2021, 2022, 2023, 2024  
**Campos:** categorias 1–5 de adequação da formação dos professores à disciplina que lecionam

---

### 2i. IED — Esforço Docente

**Arquivo:** `IED_{ANO}_ESCOLAS.zip`  
**Anos:** 2020, 2021, 2022, 2023, 2024  
**Campos:** nível de esforço dos professores (turnos, escolas, disciplinas)

---

## FONTE 3 — IDEB

**Formato:** XLSX dentro de ZIP  
**Como entra:** Download automático ao acionar importação no admin  
**URL base:**
```
https://download.inep.gov.br/ideb/resultados/
```

| Arquivo | Etapa |
|---|---|
| `divulgacao_anos_iniciais_escolas_{ANO}.zip` | Ensino Fundamental — Anos Iniciais (1º–5º ano) |
| `divulgacao_anos_finais_escolas_{ANO}.zip` | Ensino Fundamental — Anos Finais (6º–9º ano) |
| `divulgacao_ensino_medio_escolas_{ANO}.zip` | Ensino Médio |

**Anos:** 2019, 2021, 2023 (IDEB é bienal)

**Campo principal:** `VL_OBSERVADO` — nota IDEB de 0 a 10

---

## FONTE 4 — INSE — Nível Socioeconômico

**Formato:** XLSX dentro de ZIP  
**URL:**
```
https://download.inep.gov.br/informacoes_estatisticas/indicadores_educacionais/{ANO}/INSE_{ANO}_ESCOLAS.zip
```
**Anos:** 2021, 2023  
**Campo:** classificação de nível socioeconômico dos alunos (Grupos I a VIII)

---

## FONTE 5 — FNDE PDDEInfo (Dados Financeiros em Tempo Real)

**Formato:** HTML — sistema web do FNDE, capturado via scraper  
**Tipo de acesso:** Tempo real (cache de 15 minutos no servidor)  
**Site oficial:** [https://www.fnde.gov.br/pddeinfo](https://www.fnde.gov.br/pddeinfo)

---

### 5a. Dados da Escola e da UEx

**Endpoint interno:** `GET /api/pdde/{inep}`  
**URL FNDE consultada:**
```
https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar?coEscola={inep}
```

**Campos retornados:**

| Campo | O que é |
|---|---|
| nome_escola | Nome da escola no cadastro FNDE |
| executora | Nome da Unidade Executora (UEx/APM) |
| cnpj | CNPJ da UEx |
| uf | Estado |
| municipio | Município |

---

### 5b. Saldos Bancários da UEx

**URL FNDE consultada:**
```
https://www.fnde.gov.br/pddeinfo/consultasaldoentidade/consultasaldoentidade/consultasaldoentidade?coEntidade={coEscola}&mes={MM}&ano={AAAA}
```
**Campos retornados por conta:**

| Campo | O que é |
|---|---|
| programa | Nome do programa (PDDE Básico, Escola Sustentável...) |
| banco | Nome do banco |
| agencia | Número da agência |
| conta | Número da conta corrente |
| saldo_conta | Saldo na conta corrente (R$) |
| saldo_fundos | Saldo em fundos de investimento (R$) |
| saldo_poupanca | Saldo na poupança (R$) |
| saldo_rdb_cdb | Saldo em RDB/CDB (R$) |
| saldo_total | Saldo total do programa (R$) |
| mes_ano | Mês/ano de referência |

---

### 5c. Situação Cadastral e Mandato

**URL FNDE consultada:**
```
https://www.fnde.gov.br/pddeinfo/situacaocadastroentidade/situacaocadastroentidade/situacaocadastroentidade?coEscola={inep}
```
**Campos retornados:**

| Campo | O que é |
|---|---|
| mandato_inicio | Data de início do mandato do dirigente |
| mandato_fim | Data de fim do mandato do dirigente |
| dados_cadastrais | Situação cadastral (Regular / Irregular) |
| prestacao_contas | Situação de prestação de contas geral |
| programas_pendentes | Lista de programas com PC pendente (programa + ano exercício) |

---

### 5d. Situação de Prestação de Contas por Programa

**URL FNDE consultada:**
```
https://www.fnde.gov.br/pddeinfo/situacaoprestacaoconta/...?coEscola={inep}
```
**Campos retornados (por programa):**

| Campo | O que é |
|---|---|
| programa | Nome do programa (ex.: PDDE Básico) |
| ano_exercicio | Ano do recurso |
| situacao | Adimplente / Com Pendência |

---

### 5e. Repasses por Programa

**URL FNDE consultada:**
```
https://www.fnde.gov.br/pddeinfo/situacaoatendimentoentidade/...?coEscola={inep}
```
**Campos retornados (por programa):**

| Campo | O que é |
|---|---|
| destinacao | Nome do programa |
| pago_custeio | Valor pago custeio (R$) |
| pago_capital | Valor pago capital (R$) |
| pago_total | Valor total pago (R$) |
| devido_total | Valor total devido (R$) |
| data_ordem_pgto | Data da ordem de pagamento |

---

## FONTE 6 — FNDE OLINDA API (Dados Abertos PDDE)

**Formato:** JSON — API REST pública do FNDE  
**Tipo de acesso:** Tempo real (cache de 15 minutos)

---

### 6a. Saldos PDDE Básico Histórico

**URL:**
```
https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_PDDE_BASICO/versao/v1/odata/SaldosPDDEBasico?$filter=coEscola eq '{coEscola}'&$format=json
```
**Campos:**

| Campo | O que é |
|---|---|
| coEscola | Código da escola |
| anoExercicio | Ano do exercício financeiro |
| saldoInicial | Saldo inicial do exercício (R$) |
| receita | Receitas do período (R$) |
| despesa | Despesas do período (R$) |
| saldoFinal | Saldo final (R$) |

---

### 6b. Execução Financeira PDDE

**URL:**
```
https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_PDDE_BASICO_3/versao/v1/odata/ExecucaoFinanceiraPDDE?$filter=coEscola eq '{coEscola}'&$format=json
```
**Campos:** valores de custeio e capital executados por ano e programa

---

## Resumo de Anos por Fonte

| Fonte | Anos disponíveis |
|---|---|
| Censo Escolar (microdados) | 2020, 2021, 2022, 2023, 2024 |
| TDI, ATU, HAD, DSU, ICG, IRD, AFD, IED, tx_rend | 2020, 2021, 2022, 2023, 2024 |
| IDEB | 2019, 2021, 2023 (bienal) |
| INSE | 2021, 2023 |
| PDDEInfo (saldos, PC, repasses) | Tempo real (ano corrente) |
| OLINDA Saldos PDDE Básico | Histórico por exercício |

---

## Como os dados chegam ao sistema

```
INEP / MEC
  └── CSV/XLSX via download manual no admin
        └── Importação em lote → SQLite (banco local do servidor)
              └── API REST interna → Dashboard (frontend React)

FNDE PDDEInfo
  └── Scraper HTML em tempo real (servidor Node.js)
        └── Cache 15min em memória
              └── API REST interna → Dashboard

FNDE OLINDA API
  └── Requisição JSON em tempo real (servidor Node.js)
        └── Cache 15min em memória
              └── API REST interna → Dashboard
```
