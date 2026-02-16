# Chegou a Conta, Diretora!

Plataforma web para apoiar diretoras de escolas públicas brasileiras na gestão financeira de programas educacionais (PDDE, PNAE, PNATE).

## Funcionalidades

- **Dados Educacionais** — Painel com dados de 215.000+ escolas do Censo INEP, 14 indicadores educacionais e gráficos interativos
- **Legislação** — Normas do MEC com busca, Diário Oficial da União, Diários Municipais e DOE Estaduais
- **Calendário** — 18 prazos recorrentes com alertas e notícias em tempo real do MEC, FNDE e INEP
- **Trilha de Aprendizagem** — Percurso temático de gestão financeira escolar
- **Programas** — Biblioteca de programas governamentais de financiamento
- **Ferramentas** — Templates, checklists e planilhas para gestão escolar
- **Caderno da Diretora** — Chat com IA (Folha de Pesquisa) e Editor de Documentos com templates, auto-preenchimento INEP e histórico de versões

## Requisitos

- **Node.js** 18+ (recomendado 20)
- **npm** 8+
- **OpenAI API Key** (opcional, necessário apenas para o chat com IA)

## Instalação Rápida

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd chegou-a-conta-diretora

# 2. Execute o script de setup
chmod +x setup.sh
./setup.sh

# 3. Edite o .env com suas configurações
#    (especialmente OPENAI_API_KEY se quiser usar o chat)

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O app estará disponível em **http://localhost:5000**

## Setup Manual

```bash
# Instalar dependências
npm install

# Copiar arquivo de variáveis de ambiente
cp .env.example .env

# Inicializar o banco de dados SQLite
npx drizzle-kit push

# Iniciar em modo desenvolvimento
npm run dev
```

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DATABASE_URL` | Caminho do SQLite | `file:./dev.db` |
| `ADMIN_PASSWORD` | Senha do painel admin | `admin2024` |
| `OPENAI_API_KEY` | Chave da API OpenAI (opcional) | — |
| `OPENAI_MODEL` | Modelo OpenAI | `gpt-4o-mini` |
| `PORT` | Porta do servidor | `5000` |
| `NODE_ENV` | Ambiente | `development` |

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Build de produção (frontend + backend) |
| `npm start` | Inicia o servidor de produção |
| `npm run db:push` | Sincroniza o schema do banco de dados |
| `npm run check` | Verifica tipos TypeScript |

## GitHub Codespaces

Este projeto inclui configuração para **GitHub Codespaces**. Ao abrir no Codespaces:

1. As dependências serão instaladas automaticamente
2. O banco de dados será inicializado
3. A porta 5000 será exposta automaticamente
4. Basta rodar `npm run dev` para iniciar

## Estrutura do Projeto

```
├── client/              # Frontend React + TypeScript
│   └── src/
│       ├── components/  # Componentes React (shadcn/ui)
│       ├── hooks/       # Custom hooks
│       ├── lib/         # Utilitários
│       └── pages/       # Páginas da aplicação
├── server/              # Backend Express + TypeScript
│   ├── integrations/    # Integrações externas (OpenAI, MEC)
│   ├── scraper/         # Scrapers FNDE
│   └── caderno-routes.ts
├── shared/              # Schema compartilhado (Drizzle + Zod)
├── script/              # Scripts de build
├── .devcontainer/       # Config GitHub Codespaces
├── .env.example         # Template de variáveis de ambiente
└── setup.sh             # Script de instalação
```

## Stack Técnica

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter, Framer Motion, Recharts
- **Backend**: Express 5, TypeScript, Drizzle ORM
- **Banco de Dados**: SQLite (better-sqlite3)
- **IA**: OpenAI API (GPT-4o-mini)
- **Editor**: TipTap (rich text)

## Painel Administrativo

Acesse `/admin` com a senha definida em `ADMIN_PASSWORD` para gerenciar:
- Base de conhecimento da IA
- Glossário, ferramentas, trilha, programas
- Configurações do site

## Build de Produção

```bash
npm run build
npm start
```

O build gera os arquivos em `dist/` com o frontend estático em `dist/public/` e o servidor em `dist/index.cjs`.

## Licença

MIT
