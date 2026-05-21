# HubDeMidia — Contexto do Projeto (Memória)

> Este arquivo é a **memória principal do projeto**. É carregado automaticamente pelo Claude Code
> a cada sessão. Mantenha-o atualizado conforme decisões forem tomadas.
> Histórico de decisões e progresso fica em [docs/MEMORIA.md](docs/MEMORIA.md).

## ⚠️ Trabalho em paralelo (dois agentes)

Dois agentes atuam nesta pasta ao mesmo tempo e **não se enxergam em tempo real**.
**Antes de editar qualquer arquivo**, consulte [docs/COORDENACAO.md](docs/COORDENACAO.md),
reivindique os arquivos que vai tocar e atualize o quadro ao terminar. Papéis:
- **Implementador** — escreve features novas (Roadmap).
- **QA / Correção** — após cada implementação, busca erros e corrige; não cria features novas.

## O que é

Painel de administração de um **hub de sites** (e, num segundo momento, redes sociais como Instagram).
Por trás de cada site existe um **"time de IA"** que monitora o nicho, capta notícias em primeira mão,
gera/otimiza conteúdo e publica — de forma automática ou manual.

## Objetivos centrais

1. **Gerenciar múltiplos sites** a partir de um único painel (criar site → design/código → conectar domínio → no ar).
2. **Monitorar tendências e notícias** (Google Trends, sites/fontes escolhidos, conteúdo "fora da curva") para ter a notícia em primeira mão.
3. **IA nativa, multi-provedor** (Claude, GPT, Grok) usando a **chave de API do próprio usuário (BYOK)**.
4. **Pipeline de agentes de IA** por notícia:
   - Agente **Leitor**: lê e resume/reescreve a notícia.
   - Agente **Imagem**: refaz/gera a imagem.
   - Agente **SEO**: avalia e melhora o SEO com base em **dados reais de pesquisa de palavras-chave**.
5. **Publicação**: por site individual, por "campo geral" (publicar em todos os sites) e **manual** também.
6. **Dashboard de analytics** por site (acessos, métricas).
7. **Controle de acesso (RBAC)**: admin (acesso total) vs. usuários com acesso **apenas aos sites permitidos**.
8. **Automação via n8n**: integrações por webhook para montar fluxos à parte.
9. **(Pós-V1)** API por site para postar/publicar em redes sociais.

## Stack escolhida

- **Linguagem**: TypeScript (Node.js).
- **Framework**: Next.js (App Router) — painel + API no mesmo projeto, multi-tenant.
- **Banco**: **PostgreSQL self-hosted** — sem custo de serviço gerenciado (já instalado localmente via Homebrew; Docker disponível).
- **ORM**: Prisma.
- **Auth + RBAC**: **Auth.js (NextAuth v5)** com adapter Prisma (papéis: `admin`, `editor` por site).
- **Storage de mídia**: filesystem local na V1; MinIO (S3-compatível, self-host) ao escalar.
- **IA**: camada **adapter agnóstica de provedor** (Claude / OpenAI / Grok), BYOK.
- **Automação**: n8n via webhooks.
- **Analytics**: solução self-host barata (Umami/Plausible) ou GA4.
- **Deploy**: VPS próprio (Postgres + app juntos) — custo mínimo.

> Decisão de stack registrada em [docs/MEMORIA.md](docs/MEMORIA.md). Arquitetura detalhada em
> [docs/ARQUITETURA.md](docs/ARQUITETURA.md). Escopo por fase em [docs/ROADMAP.md](docs/ROADMAP.md).

## Princípios para "pôr no ar rápido com bom custo-benefício"

- **MVP primeiro**: entregar V1 funcional antes de features avançadas (redes sociais ficam para depois).
- **Multi-tenant em um deploy só**: todos os sites servidos pela mesma app, roteando por domínio/subdomínio.
- **BYOK**: o custo de IA é do usuário; o painel só orquestra. Nunca embutir chaves no código.
- **Reaproveitar serviços gerenciados** (Supabase, n8n) em vez de construir do zero.

## Convenções (a definir conforme o código nascer)

- Idioma do código: nomes em inglês; comentários/documentação em PT-BR.
- Segredos sempre em variáveis de ambiente (`.env.local`), nunca commitados.
- Chaves de API de IA dos usuários: **criptografadas no banco**, nunca em texto puro.

## Estado atual

**Fase 0 (fundação) concluída.** O esqueleto roda: Next.js 16 + Prisma + Auth.js, banco Postgres
local migrado, login funcionando e dashboard protegido. Estrutura de pastas em [README.md](README.md#estrutura).

Já existe:
- Schema do banco (`prisma/schema.prisma`): User/Role, Site, UserSiteAccess, Post, Source, AiKey + modelos Auth.js.
- Auth.js (Credentials + JWT) com RBAC; helpers em `src/lib/access.ts`; multi-tenant em `src/lib/tenant.ts`.
- Camada de IA agnóstica (`src/lib/ai/`): provedores Claude/OpenAI/Grok, agentes Leitor/Imagem/SEO, e `pipeline.ts`.
- Criptografia BYOK em `src/lib/crypto.ts`. Login dev: `admin@hubdemidia.local` / `admin123`.

**Próximo passo (Fase 1):** CRUD de sites no painel + modelo de conteúdo (posts) + publicação manual.
Ver [docs/ROADMAP.md](docs/ROADMAP.md).
