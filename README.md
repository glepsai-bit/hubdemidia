# HubDeMidia

Painel de administração de um **hub de múltiplos sites**, com um "time de IA" por trás de cada site
monitorando o nicho, captando notícias, gerando/otimizando conteúdo e publicando.

> Contexto completo do projeto: [CLAUDE.md](CLAUDE.md) · Arquitetura: [docs/ARQUITETURA.md](docs/ARQUITETURA.md)
> · Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md) · Log de decisões: [docs/MEMORIA.md](docs/MEMORIA.md)

## Stack

Next.js 16 (App Router) + TypeScript · PostgreSQL + Prisma · Auth.js (NextAuth v5) · Tailwind CSS
· IA multi-provedor BYOK (Claude/GPT/Grok) · n8n (automação).

## Pré-requisitos

- Node.js 20+
- PostgreSQL rodando localmente (ou uma `DATABASE_URL` acessível)

## Setup

```bash
# 1. Variáveis de ambiente
cp .env.example .env
# preencha DATABASE_URL, AUTH_SECRET e ENCRYPTION_KEY (instruções no próprio arquivo)

# 2. Dependências
npm install

# 3. Banco
npm run db:generate      # gera o Prisma Client
npm run db:migrate       # aplica as migrations
npm run db:seed          # cria o usuário admin inicial

# 4. Rodar
npm run dev              # http://localhost:3000
```

**Login inicial (dev):** `admin@hubdemidia.local` / `admin123` — troque em produção
(defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` antes do seed).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e produção |
| `npm run typecheck` | Checagem de tipos |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Migrations (Prisma) |
| `npm run db:studio` | Prisma Studio (UI do banco) |
| `npm run db:seed` | Cria/atualiza o admin |

## Estrutura

```
src/
  app/
    login/            # tela de login
    dashboard/        # painel (protegido)
    api/auth/         # rota do Auth.js
  lib/
    db.ts             # Prisma client (singleton)
    auth.ts           # config Auth.js + RBAC
    access.ts         # helpers de permissão (ADMIN/EDITOR)
    tenant.ts         # resolução multi-tenant por domínio
    crypto.ts         # criptografia das chaves BYOK
    ai/
      types.ts        # contratos (agnóstico de provedor)
      index.ts        # factory: resolve chave BYOK -> provedor
      providers/      # claude.ts, openai.ts, grok.ts
      agents/         # reader.ts, image.ts, seo.ts
      pipeline.ts     # encadeia Leitor -> Imagem -> SEO
  proxy.ts            # protege /dashboard
prisma/
  schema.prisma       # modelo de dados
  seed.ts             # admin inicial
```
