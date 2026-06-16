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

## 2026-05-21 — Fase 2 100% completa (pesquisa real de palavras-chave)
- Fechado o gap da Fase 2: o agente **SEO agora usa dados reais de pesquisa de palavras-chave**.
- Nova camada `src/lib/keywords/` provider-agnóstica: **Google Suggest** (autocomplete, gratuito, sem chave,
  retorna buscas reais) + **fallback offline** por extração de termos (quando sem rede). Dedup + limite.
- **Pipeline** pesquisa keywords a partir do **título** (gerado pelo Leitor) + sementes manuais, ANTES do SEO,
  e devolve `keywords` usadas. Palavras-chave deixaram de ser manuais → viram sementes opcionais.
- Commit `cfa70ce`. typecheck + lint + build + smoke test (chamada real PT-BR + fallback) OK.
- **Decisão**: fonte gratuita (Google Suggest) em vez de API paga; não dá volume absoluto, mas dá termos reais.
  Volume/dificuldade reais (DataForSEO/SEMrush) ficam como provider BYOK opcional futuro (exigiria modelo de chave).

## 2026-05-21 — Fase 3 (monitoramento de tendências)
- Novo modelo **Trend** (+ enum `TrendStatus`, relação em `Site`) — migration `trends`.
- Camada `src/lib/trends/`: coleta **RSS/Atom** e **Google Trends RSS** (via `fast-xml-parser`, namespace `ht:`),
  scoring "fora da curva" (tráfego do Trends / posição no feed), dedup por escopo+título.
- **Fontes** (`/dashboard/sources`): CRUD global (admin) e por site (RBAC), ativar/desativar.
- **Tendências** (`/dashboard/trends`): pautas por relevância; coletar agora (admin); usar/descartar.
- **Automação**: `POST /api/trends/collect` (auth por `x-cron-secret`==`CRON_SECRET` OU sessão admin) p/ n8n/cron.
- Smoke test com feeds REAIS (G1 + Google Trends BR): 35 itens captados, dedup confirmado (2ª coleta = 0). Commit `b84a6af`.
- Infra: `.env.example` passou a ser versionado (exceção no `.gitignore`); `.env` segue ignorado.
- **Pendente/decisão**: scoring é heurístico; encadear pauta→pipeline 100% automático fica p/ a fase de automação (n8n)/cron real.

## 2026-05-21 — Fases 4 e 5 (MVP Roadmap completo)
- **Fase 4 (Analytics)**: analytics **first-party** (custo zero, sem GA4/Plausible). Modelo `PageView`
  (migration `analytics`); `recordView` server-side nas páginas públicas (ignora bots, nunca quebra);
  `getSiteStats` (totais, série por dia via `date_trunc`, top posts). Página `/dashboard/analytics`. Commit `fd0695d`.
- **Fase 5 (Automação n8n)**: webhooks de **entrada** `POST /api/generate` (dispara pipeline → rascunho/publica)
  e `POST /api/trends/collect`, autorizados por `isAuthorizedAutomation` (x-cron-secret OU admin).
  **Saída** `notifyN8n` (fire-and-forget) nos eventos trends.collected/post.generated/post.published/posts.published_all.
  `AUTOMATION_USER_EMAIL` define a chave BYOK da automação. Helper `src/lib/ai/generate.ts`. Docs `INTEGRACAO_N8N.md`. Commit `796d63f`.
- **MVP (Fases 0–5) completo.** Tudo com build+typecheck+lint+smoke OK. Aguardando revisão final do QA.
- **Decisões**: analytics próprio em vez de serviço externo (custo/privacidade); cron real fica a cargo do n8n (Schedule);
  geração via automação cria DRAFT por padrão (autoPublish opcional) para controlar custo de IA e revisão.

## 2026-06-16 — Fase 6 (camada pública profissional — portal editorial)
- **Objetivo do usuário**: portal de qualidade G1/InfoMoney/GE — "não quero que o resultado seja porcaria".
- Schema: `Category`, `Tag`, `PostTag`; Post +categoryId/featured/authorName/heroAlt/readingMinutes;
  Site +primaryColor/logoUrl/tagline/language. Migration `portal`.
- **`src/lib/portal/`**: queries (capa/categoria/relacionados/mais-lidas/busca), readtime (200ppm),
  contrast (luminância WCAG -> bestTextColor preto/branco), safe-url (bloqueia javascript:/data: em img).
- **`src/lib/seo/`**: metadata (per-page title/desc/OG/Twitter/canonical) + JSON-LD
  NewsArticle/BreadcrumbList/WebSite/NewsMediaOrganization. ImageObject com 1200x630.
- **`src/lib/markdown.tsx`**: react-markdown + remark-gfm com sanitização de href/src.
- **`src/components/portal/`** (13 componentes editoriais): Header (client component p/ aria-current),
  Footer, FeaturedHero (stretched-link com CategoryBadge fora do Link), PostCard 3 variantes,
  CategoryStrip, MostReadList, Breadcrumb, ShareButtons, ArticleBody, RelatedPosts, SectionTitle, PostMeta.
- **`src/app/tenants/[host]/`**: layout (tema via CSS var --portal-primary + JSON-LD raiz + lang),
  capa editorial (h1 sr-only), matéria padrão portal, categoria com paginação rel=prev/next + canonical,
  busca, sitemap.xml/feed.xml/robots.txt por tenant. `revalidate=60`.
- **Painel**: CRUD de editorias + tema do site (ThemeForm), PostForm estendido com categoria/featured/autor/tags,
  toggleFeatured action. Site detail com link "Ver site público" + Editorias + Tema + Analytics.
- **Demo seed** (`prisma/seed-demo.ts`): 2 sites (Tech Hoje + Esporte Já) com tema (cores #0ea5e9 e #c8102e),
  8 editorias, 14 matérias realistas com autor/categoria/destaques/data simulada.
- **Review adversarial via Workflow** (5 dimensões, 72 subagents, 48 achados confirmados):
  - **17 correções aplicadas no commit**: 1 blocker (deleteCategory cross-tenant) + 6 high
    (multi-tenant publishPost/unpublishPost/deletePost/updatePost ownership; breadcrumb WCAG contrast;
    h1 ausente na home; NewsArticle.image string -> ImageObject; og:image na home; revalidatePath tenant;
    nested anchors no Hero/PostCard) + 10 medium (aria-current, aria-label paginação/share, safe-url,
    contrast no Badge, feed RSS `<image>`, canonical paginada, etc.).
  - **Restantes (não-bloqueantes)**: refinos visuais (dek no hero, overlay em PostCardGrid, busca temática,
    paginação numerada, escala tipográfica modular) — handoff para Front-end. Performance (N+1 mitigado por
    revalidate=60, getMostRead take*2, searchPosts FTS) — handoff para QA (não-bloqueantes em MVP).
- **Commit `fa030d5`** (Fase 6). Build + typecheck + lint OK; 20 rotas. Smoke test confirma:
  capa com h1, JSON-LD NewsArticle com ImageObject, sitemap/feed/robots respondendo, canonical paginada,
  zero nested anchors (43 anchors no DOM, 0 aninhados).
- **Decisão de escopo**: tema multi-tenant + temas configuráveis (caminho A da discussão estratégica),
  não criação de código por site. Próximo passo (Fase 7?) é deploy em VPS com Caddy/HTTPS + DNS curinga.

<!-- Adicione novas entradas abaixo, mais recentes no topo de cada data. -->
