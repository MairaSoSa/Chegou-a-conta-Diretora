# Mudanças Implementadas - Labels Editáveis no Dashboard

## Resumo
Agora você pode personalizar os nomes dos cards de dados CSV diretamente no painel Admin, em vez de estarem fixos no código.

## O que foi alterado

### 1. Schema do Banco de Dados
- Adicionado campo `label` (opcional) na tabela `dashboard_datasets`
- Permite armazenar nomes personalizados para cada categoria de dados

### 2. Interface Admin
- Adicionado botão de edição ao lado de cada nome de card
- Ao clicar no ícone de lápis, você pode editar o nome do card
- Botões de salvar (✓) e cancelar (✗) para confirmar ou descartar mudanças
- O label personalizado é salvo automaticamente ao enviar novos dados CSV

### 3. API Backend
- Nova rota PATCH `/api/admin/dashboard/:id/label` para atualizar apenas o label
- Rota POST `/api/admin/dashboard/upload/:category` atualizada para aceitar label opcional
- Funções de storage atualizadas para gerenciar labels personalizados

## Como usar

1. **Editar nome de card existente:**
   - Acesse o painel Admin
   - Na seção "Dashboard - Dados CSV"
   - Clique no ícone de lápis ao lado do nome do card
   - Digite o novo nome
   - Clique no ✓ para salvar

2. **Definir nome ao criar novo dataset:**
   - Edite o nome antes de fazer upload do CSV
   - O nome será salvo junto com os dados

## Próximos Passos

Para aplicar as mudanças ao banco de dados:

```bash
# 1. Configure a DATABASE_URL no arquivo .env
cp .env.example .env
# Edite o .env com suas credenciais do banco PostgreSQL

# 2. Aplique as mudanças do schema
npm run db:push

# 3. Inicie o servidor
npm run dev
```

## Arquivos Modificados

- `shared/schema.ts` - Adicionado campo `label` na tabela
- `client/src/pages/Admin.tsx` - Interface de edição de labels
- `server/routes.ts` - Nova rota e atualização da rota de upload
- `server/storage.ts` - Funções para gerenciar labels
- `.env.example` - Exemplo de configuração (criado)
