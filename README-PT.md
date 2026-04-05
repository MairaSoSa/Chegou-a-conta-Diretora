# Chegou a Conta, Diretora 📊

Dashboard de gestão financeira para escolas públicas brasileiras.

## 🚀 Quick Start

### Instalação

```bash
# 1. Clone e dependências
git clone https://github.com/MairaSoSa/Chegou-a-conta-Diretora.git
cd Chegou-a-conta-Diretora
npm install

# 2. Configure .env
cp .env.example .env
# Edite .env com suas credenciais do Railway PostgreSQL

# 3. Inicie
npm run dev
# Acesse http://localhost:5000
```

### Validação Antes de Mudanças

```bash
# Sempre rodar antes de commit
npm run preflight

# Detecção automática de problemas
node scripts/validate-build.mjs
```

## 📁 Estrutura

```
dist/
├── bootstrap.cjs              # Entrypoint do servidor
├── index.cjs                  # Bundle principal
├── pdde-fields-extension.cjs  # Extensão PDDE
└── public/
    ├── index.html             # Frontend
    └── assets/                # JS/CSS compilado
scripts/
├── validate-build.mjs         # Validação automática
└── cleanup-legacy.sh          # Remove arquivos antigos

.env                           # Configuração (gitignored)
.env.example                   # Template de .env
STABILITY.md                   # Guia de estabilidade
```

## 🔧 Configuração

### .env Obrigatória

```bash
# Railway PostgreSQL (em produção)
DATABASE_URL=postgresql://postgres:pass@host:port/railway

# Admin
ADMIN_PASSWORD=senha-forte

# App
NODE_ENV=production
PORT=5000
```

### Variáveis Opcionais

```bash
# OpenAI (para IA)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## 📡 API Endpoints

### Escolas

- `GET  /api/censo-escolar/:inep` - Dados da escola
- `GET  /api/censo-escolar/insights/:scope` - Análise de infraestrutura

### Financeiro (PDDE)

- `GET  /api/pdde/execfin/:coEscola` - Execução financeira
- `GET  /api/pdde/residual/:coEscola` - Resíduos de execução

### Admin

- `POST /api/admin/login` - Autenticação com ADMIN_PASSWORD
- `GET  /api/admin/stats` - Estatísticas do sistema

## ✅ Checklist de Deploy

- [ ] `npm run preflight` passou
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` usa Railway PostgreSQL
- [ ] `ADMIN_PASSWORD` é forte (20+ chars)
- [ ] Testar endpoints críticos
- [ ] Monitorar logs após deploy

## 🛡️ Segurança

### Antes de Fazer Mudanças

1. Leia [STABILITY.md](./STABILITY.md)
2. Use Zod para validar inputs
3. Verifique com `npm run preflight`
4. Rode pré-commit: `bash pre-commit-checklist.sh`

### Red Flags 🔴

- Múltiplas versões de um arquivo (`-v2.js`, `-v3.js`)
- Arquivos `.bak` em dist/
- Sem validação de input
- Estrutura retornada diferente do esperado

### Green Flags 🟢

- Validação Zod em endpoints
- Erro tratado com try/catch
- Tests para casos edge
- Assets limpos (sem versões antigas)

## 📊 Tech Stack

- **Backend**: Node.js + Express 5
- **Database**: Railway PostgreSQL + Drizzle ORM
- **Frontend**: React + TanStack Query + Wouter
- **Bundler**: esbuild (custom)
- **Validation**: Zod
- **Styling**: Tailwind CSS
- **Data**: INEP Censo Escolar + FNDE PDDE

## 🎨 Padrão Visual de Destaques (Cards Informativos)

Para manter consistência nos cards "Bilhete da Diretora" e "Situação das Escolas", use o padrão semântico abaixo para palavras/frases destacadas:

- **Informação importante**: `#2d5a88` (azul)
- **Frase auxiliar/contextual**: `#0b8f6a` (verde)

Regra prática:

- Destaque em azul para termos centrais da mensagem.
- Destaque em verde para termos de apoio, contexto ou orientação complementar.

## 🐛 Troubleshooting

### Build não passa validação

```bash
npm run validate:structure
# Mostrará que assets ou .env têm problemas
```

### DATABASE_URL está quebrada

```bash
# Verifique em .env
echo $DATABASE_URL
# Deve ser: postgresql://...
# NÃO deve ser: file:./dev.db
```

### Mudança quebrou tudo

```bash
# 1. Volte para a versão anterior
git revert <commit>

# 2. Rode diagnostics
npm run preflight

# 3. Leia STABILITY.md para entender melhor
```

## 📚 Referências

- [STABILITY.md](./STABILITY.md) - Guia completo de estabilidade
- [REFACTORING-SUMMARY-2026-04-03.md](./REFACTORING-SUMMARY-2026-04-03.md) - O que foi melhorado
- [.env.example](./.env.example) - Template de configuração
- [scripts/validate-build.mjs](./scripts/validate-build.mjs) - Validação automática

## 🤝 Contribuindo

1. Faça sua branch: `git checkout -b feature/sua-feature`
2. Faça suas mudanças
3. Valide: `npm run preflight`
4. Commit: `git commit -m "feat: descrição"`
5. Push: `git push origin feature/sua-feature`
6. Abra um PR

## 📝 License

MIT - Veja LICENSE

---

**Última atualização**: 2026-04-03  
**Status**: ✅ Refatorado e estabilizado  
**Dashboard**: http://localhost:5000 (desenvolvimento)
