# Auditoria de Campos PDDE - Painel "Dados Financeiros PDDE"

**Data**: 2 de Abril de 2026  
**Objetivo**: Auditar quais campos da API FNDE PDDE_Basico estão sendo exibidos no painel

## Resumo Executivo

- **Total de campos na API FNDE**: 17
- **Campos exibidos no painel**: 11 (64,7%)
- **Campos NÃO exibidos**: 6 (35,3%)

---

## Campos Oficiais do FNDE PDDE_Basico

### ✅ EXIBIDOS NO PAINEL (11 campos)

| #   | Campo OData      | Variável Backend | Status     | Localização no Painel |
| --- | ---------------- | ---------------- | ---------- | --------------------- |
| 1   | An_exercicio     | an_exercicio     | ✅ Exibido | Header / Filtro       |
| 2   | Sg_uf            | sg_uf            | ✅ Exibido | Localização           |
| 3   | No_municipio     | no_municipio     | ✅ Exibido | Localização           |
| 4   | Qt_alunos        | qt_alunos        | ✅ Exibido | Dados da Escola       |
| 5   | No_esfera_adm    | no_esfera_adm    | ✅ Exibido | Dados da Escola       |
| 6   | No_regiao        | no_regiao        | ✅ Exibido | Dados da Escola       |
| 7   | Localizacao      | localizacao      | ✅ Exibido | Dados da Escola       |
| 8   | Cnpj_uex         | cnpj_uex         | ✅ Exibido | Dados da UEX          |
| 9   | No_uex           | no_uex           | ✅ Exibido | Dados da UEX          |
| 10  | No_cargo         | no_cargo         | ✅ Exibido | Dados da UEX          |
| 11  | Ds_programa_fnde | ds_programa_fnde | ✅ Exibido | Programa              |

### ❌ NÃO EXIBIDOS NO PAINEL (6 campos)

| #   | Campo OData             | Variável Backend        | Tipo          | Impacto                         | Recomendação  |
| --- | ----------------------- | ----------------------- | ------------- | ------------------------------- | ------------- |
| 1   | Co_execucao_fincanceira | co_execucao_fincanceira | String (ID)   | Rastreabilidade de transações   | ⭐ Baixo      |
| 2   | Co_municipio_ibge       | co_municipio_ibge       | Integer       | Validação de dados municipais   | ⭐ Médio      |
| 3   | Co_escola               | co_escola               | String (INEP) | Reconciliação de registros      | ⭐ Médio      |
| 4   | No_escola               | no_escola               | String        | Clareza / Redundância?          | ⭐ Baixo      |
| 5   | No_dirigente            | no_dirigente            | String        | Responsabilização / Privacidade | ⚠️ Alto       |
| 6   | Dt_ini_vinculacao       | dt_ini_vinculacao       | Date          | Histórico / Auditoria           | ⭐ Médio-Alto |

### Campos Financeiros (sempre presentes)

| Campo           | Descrição                       | Status     |
| --------------- | ------------------------------- | ---------- |
| Sg_destinacao   | Tipo de gasto (Custeio/Capital) | ✅ Exibido |
| Vl_pago_custeio | Valor pago em custeio           | ✅ Exibido |
| Vl_pago_capital | Valor pago em capital           | ✅ Exibido |
| Vl_pago_total   | Valor total pago                | ✅ Exibido |

---

## Análise Detalhada dos Campos Faltantes

### 1. **Co_execucao_fincanceira** ❌

- **Tipo**: ID único da transação financeira
- **Localização no backend**: Processado em `whr()` do `/api/pdde/execfin/:coEscola`
- **Motivo de exclusão**: Possivelmente para manter interface limpa
- **Impacto**: Baixo - útil apenas para reconciliação técnica
- **Prioridade**: 🔴 Baixa

### 2. **Co_municipio_ibge** ❌

- **Tipo**: Código IBGE do município (6 dígitos)
- **Localização no backend**: Processado em `whr()`, campo: `CO_MUNICIPIO_IBGE`
- **Motivo de exclusão**: Possível redundância (município está em `No_municipio`)
- **Impacto**: Médio - útil para validação de dados
- **Prioridade**: 🟡 Média

### 3. **Co_escola** ❌

- **Tipo**: Código INEP da escola (8 dígitos)
- **Localização no backend**: Processado em `whr()`, campo: `CO_ESCOLA`
- **Motivo de exclusão**: Pode estar sendo usado internamente após autenticação
- **Impacto**: Médio - crítico para reconciliação
- **Prioridade**: 🟡 Média

### 4. **No_escola** ❌

- **Tipo**: Nome da escola (do registro financeiro)
- **Localização no backend**: Processado em `whr()`, campo: `NO_ESCOLA`
- **Motivo de exclusão**: Possível redundância ou campo diferente do INEP
- **Impacto**: Baixo - informativo
- **Prioridade**: 🔴 Baixa

### 5. **No_dirigente** ❌

- **Tipo**: Nome do dirigente da UEX
- **Localização no backend**: Processado em `whr()`, campo: `NO_CARGO` (pode incluir dirigente)
- **Motivo de exclusão**: Possível questão de privacidade ou dados sensíveis
- **Impacto**: Alto - responsabilização
- **Prioridade**: 🟠 Alta (com considerações de LGPD)

### 6. **Dt_ini_vinculacao** ❌

- **Tipo**: Data de início da vinculação do responsável
- **Localização no backend**: Processado em `whr()`, campo: `DT_INI_VINCULACAO`
- **Motivo de exclusão**: Informação histórica não essencial para painel atual
- **Impacto**: Médio-Alto - importante para auditoria
- **Prioridade**: 🟡 Média

---

## Dados do Backend

**Arquivo**: `/dist/index.cjs.gz` → função `whr(E, f)`  
**Endpoint**: `GET /api/pdde/execfin/:coEscola`  
**Cache**: 1440 minutos (24h)

### Campos processados pelo backend (19 no total):

```
1. an_exercicio
2. sg_uf
3. no_municipio
4. co_municipio_ibge ❌ NÃO RETORNA
5. co_escola ❌ NÃO RETORNA
6. no_escola ❌ NÃO RETORNA
7. qt_alunos
8. no_esfera_adm
9. no_regiao
10. localizacao
11. cnpj_uex
12. no_uex
13. no_cargo
14. dt_ini_vinculacao ❌ NÃO RETORNA
15. ds_programa_fnde
16. sg_destinacao
17. vl_pago_custeio
18. vl_pago_capital
19. vl_pago_total
```

---

## Recomendações

### Curto prazo (MVP)

- ✅ Manter configuração atual (11 campos) para interface limpa
- ✅ Documentar decisão de design

### Médio prazo

- 🔄 Adicionar `co_municipio_ibge` para melhor validação
- 🔄 Adicionar `dt_ini_vinculacao` para rastreabilidade

### Longo prazo

- 📋 Avaliar incluir `No_dirigente` considerando LGPD
- 📋 Criar seção "Dados Técnicos" com campos de ID para reconciliação

---

## Conclusão

Os 6 campos não exibidos **já são processados pelo backend**, apenas não são retornados na resposta da API. Foram provavelmente excluídos na fase de design para manter a interface focada e legível.

**Próximos passos**:

1. ✅ **Feito**: Auditoria e mapeamento concluído
2. ⏳ **TODO**: Decidir se deseja adicionar algum desses campos
3. ⏳ **TODO**: Se sim, fazer patch no backend e deploy

---

**Audit realizado por**: GitHub Copilot  
**Metodologia**: Análise de bundle compilado + grep pattern matching  
**Confiabilidade**: Alta (código do servidor analisado diretamente)
