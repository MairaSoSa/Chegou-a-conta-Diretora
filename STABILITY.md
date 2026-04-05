# 🛡️ Guia de Estabilidade - Chegou a Conta, Diretora

> Documento criado em 3 de abril de 2026 após refatoração para prevenir regressões

## Problema Original

O projeto frequentemente quebrava quando mudanças eram feitas porque:

1. **Sem tipagem TypeScript** → Erros silenciosos em runtime
2. **Sem validação de dados** → Dados inconsistentes
3. **Assets legados multiplicados** → Versões conflitantes carregadas
4. **Sem testes automatizados** → Regressões não detectadas
5. **Código minificado sem fonte** → Impossível debugar ou refatorar

## Refatoração Realizada (2026-04-03)

### ✅ Limpeza Concluída

- Removidos **29 arquivos legados** de assets (Dashboard-v2/v3, index-v2/v3, etc.)
- Eliminados **2 arquivos de backup** (index.cjs.gz.bak2, index.html.bak)
- **Redução de 47 para 18 arquivos** em dist/public/assets
- `.gitignore` melhorado para **prevenir** novos acúmulos

### 📦 Dependências Adicionadas

- **Zod**: Validação de tipos em runtime (devDependency)
- Suporte para **Node.js 20+**

### 📋 Scripts de Validação

- `npm run preflight`: Valida config e estrutura de build
- `npm run validate:structure`: Detecta assets legados
- `npm run validate:config`: Verifica .env

## Como Evitar Quebras Futuras

### 1. Sempre Rodar Validação Após Mudanças

```bash
# Antes de fazer commit
npm run preflight

# Fará:
# ✓ Verificar que .env está correto
# ✓ Validar integridade do build (dist/)
# ✓ Avisar sobre assets legados ou danificados
```

### 2. Padrões de Segurança ao Editar Código

**❌ NUNCA FAÇA:**

```javascript
// Sem validação de dados
function processData(input) {
  return input.field.nested.value; // Pode quebrar se formato errado
}
```

**✅ SIM, FAÇA:**

```javascript
import { z } from "zod";

const InputSchema = z.object({
  field: z.object({
    nested: z.object({
      value: z.string(),
    }),
  }),
});

function processData(input) {
  const validated = InputSchema.parse(input); // Falha rápido se inválido
  return validated.field.nested.value;
}
```

### 3. Arquitetura Defensiva

**API Endpoints:**

- ✓ Use Zod para validar input/output
- ✓ Sempre retorne códigos HTTP corretos (200, 400, 500, etc.)
- ✓ Use try/catch com logging

**Database Queries:**

- ✓ Validar parâmetros antes de usar em SQL
- ✓ Usar prepared statements (Drizzle ORM)
- ✓ Testar com dados edge cases

**Frontend Components:**

- ✓ Validar props com TypeScript/Zod
- ✓ Usar React.memo para evitar re-renders desnecessários
- ✓ Adicionar error boundaries

### 3.1. Padrão Visual de Destaques (Cards Informativos)

Para manter consistência nos cards "Bilhete da Diretora" e "Situação das Escolas":

- ✓ **Informação importante**: usar `#2d5a88` (azul)
- ✓ **Frase auxiliar/contextual**: usar `#0b8f6a` (verde)

Regra de manutenção:

- ✓ Não criar novas cores para destaque sem necessidade
- ✓ Reaplicar o padrão ao editar textos longos nesses cards

### 4. Checklist Antes de Deploy

- [ ] `npm run preflight` passa
- [ ] Nenhum arquivo `.bak` em dist/
- [ ] DATABASE_URL usa Railway PostgreSQL
- [ ] NODE_ENV=production
- [ ] Testar endpoints críticos manualmente
- [ ] Verificar logs do servidor em deploy

### 5. Configuração Recomendada do .env

```bash
# Database - Railway PostgreSQL (obrigatório em produção)
DATABASE_URL=postgresql://user:pass@hopper.proxy.rlwy.net:PORT/railway

# Admin
ADMIN_PASSWORD=senha-forte-aqui

# OpenAI (opcional)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# App Settings
NODE_ENV=production   # ← CRÍTICO em produção
PORT=5000
```

## Estrutura de Diretórios (Esperada)

```
dist/
├── bootstrap.cjs              # Entrypoint
├── index.cjs                  # Bundle do servidor
├── index.cjs.gz              # Versão comprimida
├── pdde-fields-extension.cjs # Extensão PDDE
└── public/
    ├── index.html            # Frontend
    ├── favicon.svg/.png
    └── assets/
        ├── Dashboard-*.js    # APENAS v4 ou hashes
        ├── index-*.js        # APENAS v4 ou hashes
        └── vendor-*.js       # Bibliotecas (React, recharts, etc)
```

## O que Monitorar

### 🔴 Red Flags = Código Pode Quebrar

- [ ] Múltiplas versões de um arquivo (`-v2.js`, `-v3.js`, etc.)
- [ ] Arquivos `.bak` ou `.backup` em dist/
- [ ] Erros "Cannot read property X of undefined"
- [ ] Endpoints retornando status 200 com estrutura errada
- [ ] Sem validação de input em novos endpoints

### 🟢 Green Flags = Código Seguro

- [ ] Validação Zod em todos os endpoints
- [ ] Tipagem TypeScript completa (quando houver fonte)
- [ ] Erro tratado com try/catch e logging
- [ ] Tests automatizados para casos edge
- [ ] Assets em dist/ limpos (sem versões antigas)

## Próximos Passos Para Máxima Estabilidade

1. **Recuperar código-fonte TypeScript** do repositório (se existir em outro branch)
   - Isso permitiria compilation type-safe
   - Facilitaria refatoração com confiança

2. **Adicionar testes automatizados**

   ```bash
   npm install --save-dev vitest supertest
   ```

3. **Configurar GitHub Actions** para rodar validação em cada PR

   ```yaml
   - run: npm run preflight
   ```

4. **Documentar tipos de dados** que client/server trocam
   - Evita mismatch que quebra em runtime

5. **Monitorar logs do Railway PostgreSQL**
   - Alertar se conexão cai, índices corrompem, etc.

## Referências

- **.gitignore**: Evita acúmulo de versões antigas
- **validate-build.mjs**: Detecta problemas automaticamente
- **.env.example**: Template seguro de configuração
- **start.sh**: Inicializa com Railway PostgreSQL

---

**Último update**: 2026-04-03  
**Realizado por**: Copilot GitHub  
**Status**: ✅ Refatoração concluída, código limpo e estável
