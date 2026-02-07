# Integração API SIGPC/FNDE - Prestação de Contas

## Implementação Completa ✅

A API do SIGPC/FNDE foi integrada ao Dashboard para consultar prestações de contas por CNPJ da UEx (Unidade Executora).

## Arquivos Criados/Modificados

### Backend

1. **`server/scraper/sigpc.ts`** (NOVO)
   - Funções para consultar a API do FNDE/SIGPC
   - `consultarPrestacoesCnpj()` - Busca prestações por CNPJ
   - `consultarProgramasPorAno()` - Lista programas disponíveis
   - `consultarAnosDisponiveis()` - Anos disponíveis na API
   - `consultarSituacoesPc()` - Situações de prestação de contas
   - `exportarDetalheOpc()` - Gera URL de exportação

2. **`server/routes.ts`** (MODIFICADO)
   - Novas rotas disponíveis:
     - `GET /api/sigpc/prestacoes/:cnpj` - Consulta por CNPJ
     - `GET /api/sigpc/programas/:ano` - Programas do ano
     - `GET /api/sigpc/anos` - Anos disponíveis
     - `GET /api/sigpc/situacoes` - Situações PC
     - `GET /api/sigpc/exportar/:concessaoId` - URL de exportação

### Frontend

3. **`client/src/hooks/use-sigpc.ts`** (NOVO)
   - Hooks React Query para consumir a API:
     - `useSigpcPrestacoes()` - Consulta prestações por CNPJ
     - `useSigpcProgramas()` - Lista programas
     - `useSigpcAnos()` - Anos disponíveis
     - `useSigpcSituacoes()` - Situações

4. **`client/src/pages/Dashboard.tsx`** (MODIFICADO)
   - Integração automática com dados do PDDE
   - Extrai CNPJ da UEx automaticamente
   - Exibe card de Prestações de Contas no modo completo
   - Mostra status com cores (aprovado, pendente, irregular)
   - Link direto para SIGPC para ver detalhes completos

## Como Funciona

### Fluxo de Dados

```
1. Usuário busca escola pelo código INEP
↓
2. Sistema consulta dados do PDDE (já existente)
↓
3. Se UEx tem CNPJ, consulta automática no SIGPC
↓
4. Exibe prestações de contas no Dashboard
```

### Exemplo de Uso no Código

```typescript
// Extração automática do CNPJ da UEx
const cnpjUex = pddeData?.ok && pddeData.uex?.cnpj ? pddeData.uex.cnpj : null;

// Consulta automática das prestações
const { data: sigpcData } = useSigpcPrestacoes(cnpjUex, {
  anoConcessao: 2024,
});

// Dados disponíveis em sigpcData.prestacoes[]
```

## Informações Exibidas no Dashboard

Quando há prestações de contas, o Dashboard mostra:

- ✅ **Nome do programa**
- ✅ **Status da prestação** (com cores: verde/amarelo/vermelho)
- ✅ **Ano da concessão**
- ✅ **Número do convênio** (se disponível)
- ✅ **Valor da concessão**
- ✅ **Fase atual**
- ✅ **Data limite** (se disponível)
- ✅ **Link direto** para detalhes completos no portal SIGPC

## Parâmetros de Consulta Suportados

### Rota Principal: `/api/sigpc/prestacoes/:cnpj`

**Query params opcionais:**
- `programaId` - Filtrar por programa específico
- `anoConcessao` - Filtrar por ano
- `municipioId` - Filtrar por município

**Exemplo:**
```
GET /api/sigpc/prestacoes/12345678000190?anoConcessao=2024&programaId=16
```

## Status de Prestação de Contas

O sistema identifica automaticamente e aplica cores:

- 🟢 **Verde**: Aprovado, Regular
- 🟡 **Amarelo**: Pendente, Em Análise  
- 🔴 **Vermelho**: Irregular, Rejeitado
- ⚪ **Cinza**: Status não informado

## Rotas da API Disponíveis

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/sigpc/prestacoes/:cnpj` | GET | Consulta prestações por CNPJ |
| `/api/sigpc/programas/:ano` | GET | Lista programas do ano |
| `/api/sigpc/anos` | GET | Anos disponíveis |
| `/api/sigpc/situacoes` | GET | Lista de situações possíveis |
| `/api/sigpc/exportar/:concessaoId` | GET | URL para exportação de detalhes |

## Link para Portal Oficial

Cada prestação de contas exibe um link que leva ao portal oficial:

```
https://www.fnde.gov.br/sigpcadm/exportarLocalizar.pu?operation=exportarDetalheOPC&concessaoId=12345
```

## Observações

- ⚡ **Cache**: Dados são cacheados por 5 minutos (prestações) a 24 horas (listas)
- 🔄 **Retry**: Tentativas automáticas em caso de falha
- 🎯 **Enabled**: Consulta só é feita se CNPJ estiver disponível
- 📊 **Loading**: Indicadores visuais durante carregamento
- ⚠️ **Error handling**: Mensagens amigáveis em caso de erro

## Próximos Passos Possíveis

- [ ] Adicionar filtros avançados (programa, situação)
- [ ] Gráficos de histórico de prestações
- [ ] Alertas de prazos próximos ao vencimento
- [ ] Download de relatórios consolidados
- [ ] Notificações de mudança de status

## Base URL da API FNDE

```
https://www.fnde.gov.br/sigpcadm
```

Toda a documentação dos endpoints está baseada no arquivo fornecido pelo usuário.
