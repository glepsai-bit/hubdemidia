# Memória do Projeto — Log de Decisões e Progresso

> Registro cronológico de decisões, escolhas e progresso. O contexto "vivo" fica em [../CLAUDE.md](../CLAUDE.md).

## 2026-05-20 — Estruturação inicial
- **Definida a ideia**: painel admin de um hub de múltiplos sites, com "time de IA" por trás de cada site
  (monitora nicho, capta notícia em 1ª mão, reescreve, refaz imagem, otimiza SEO, publica).
- **Decisão de stack**: **Node.js + TypeScript + Next.js** (em vez de Python).
  - *Por quê:* uma linguagem só (front+back), Next.js cobre painel + API + multi-tenant,
    SDKs de IA first-class em Node, deploy barato/rápido. Python ficaria sobrando como 2ª linguagem.
- **Banco/infra**: Supabase (Postgres + Auth + Storage) + Prisma — bom custo-benefício e rápido de subir.
- **IA**: modelo **BYOK** (chave do próprio usuário), adapter agnóstico (Claude/GPT/Grok). Custo de IA é do usuário.
- **Escopo**: redes sociais ficam para **pós-V1**; MVP foca em gestão de sites + publicação + IA + tendências.
- **Arquivos de fundação criados**: `CLAUDE.md`, `docs/ARQUITETURA.md`, `docs/ROADMAP.md`, este `docs/MEMORIA.md`,
  `.claude/settings.json`, `.gitignore`.

## 2026-05-21 — Troca de banco/infra para custo zero
- **Removido o Supabase.** Decisão do usuário: usar **PostgreSQL self-hosted** para não ter custo de serviço gerenciado.
  - Ambiente já tem **psql 14 (Homebrew)** e **Docker** instalados → roda local sem custo.
- **Auth**: como saiu o Supabase Auth, adotado **Auth.js (NextAuth v5)** com adapter Prisma.
- **Storage de mídia**: filesystem local na V1; MinIO (self-host, S3-compatível) quando escalar.
- **Deploy**: VPS próprio (app + Postgres juntos) em vez de Vercel/Railway gerenciados.
- **GitHub**: conectar via `gh`/SSH depois (sem usar senha; senha exposta no chat deve ser trocada pelo usuário).
- **`.claude/settings.json`** criado (autorizado) com allowlist de comandos de dev para reduzir prompts.

## 2026-05-21 — Fase 0 (fundação) concluída
- Projeto **Next.js 16 + TypeScript + Tailwind** criado (App Router, src-dir).
- **Prisma** configurado com Postgres local (`hubdemidia`); migration `init` aplicada.
- Schema: User/Role, Site, UserSiteAccess, Post/PostStatus, Source/SourceType, AiKey/AiProvider + modelos Auth.js.
- **Auth.js v5** (Credentials + JWT) com RBAC; `proxy.ts` protege `/dashboard`; login e dashboard funcionando.
- **Camada de IA** agnóstica em `src/lib/ai/` (providers claude/openai/grok, agentes reader/image/seo, pipeline).
- **BYOK**: chaves criptografadas via `src/lib/crypto.ts` (AES-256-GCM, env `ENCRYPTION_KEY`).
- Seed cria admin `admin@hubdemidia.local` / `admin123` (trocar em prod).
- `next.config.ts`: fixado `turbopack.root` (havia lockfile solto na home). `middleware`→`proxy` (Next 16).
- Build e typecheck passando. **Próximo: Fase 1** (CRUD de sites + posts + publicação manual).

## 2026-05-21 — Fase 1 concluída (MVP de gestão de sites)
- **CRUD de sites** (admin) com RBAC; editores só veem sites permitidos. Server actions em `dashboard/sites/actions.ts`.
- **CRUD de posts** por site + **publicação manual** (publicar/despublicar). `dashboard/sites/[siteId]/posts/actions.ts`.
- **Publicação geral**: cria a mesma matéria (PUBLISHED) em todos os sites ou selecionados. `dashboard/publish/`.
- **Multi-tenant**: `proxy.ts` reescreve por host → `/tenants/[host]`; páginas públicas (home do site + post).
- Validações zod em `src/lib/validation.ts`; formulários client com `useActionState`.
- Build, typecheck, lint e smoke test (host routing + guard) OK. Commit `927b9ef`.
- Trabalho coordenado via `docs/COORDENACAO.md` (handoff p/ QA registrado). Dados de teste no dev: site `demo`.
- **Decisões de escopo**: pages/media e parser de markdown ficam para depois; provisionamento real de domínio é etapa de deploy.

## 2026-05-21 — Fase 2 concluída (IA nativa BYOK)
- **Config de chaves BYOK** em `/dashboard/settings`: cada usuário cadastra Claude/GPT/Grok; chaves
  criptografadas (AES-256-GCM via `crypto.ts`), nunca exibidas de volta. Actions: `settings/actions.ts`.
- **Geração de rascunho** em `/dashboard/generate` (FORA de `sites/` para não colidir com lock do QA):
  roda `runContentPipeline` (Leitor→SEO→Imagem) e cria Post DRAFT `createdByAi`. Action: `generate/actions.ts`.
- **`storage.ts`**: persiste imagem gerada (b64) em `/public/uploads`.
- Telas básicas (Tailwind mínimo) — o agente **Front-end/UI** evoluirá o visual depois.
- Commit `321fd9b`. typecheck+lint+build OK; smoke test de cripto e de erro de chave ausente OK.
- **Coordenação**: surgiu um 3º agente (Front-end/UI) e fronteira de arquivos (Impl/QA = `actions.ts`+`lib`+`prisma`;
  Front = `.tsx`+`components`+`css`). QA **aprovou a Fase 1 (0 bugs)** e confirmou que o Proxy importar Prisma
  NÃO é bug (Next 16 roda Proxy em Node runtime). Liberei o lock da Fase 2 e o `layout.tsx` p/ o Front-end.
- **Pendente da Fase 2**: integrar API real de keyword research (hoje as palavras-chave são manuais).

<!-- Adicione novas entradas abaixo, mais recentes no topo de cada data. -->
