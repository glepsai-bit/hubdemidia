# Coordenação entre Agentes

> **Por que este arquivo existe:** três agentes de IA trabalham nesta pasta ao mesmo tempo.
> Eles **não se enxergam em tempo real** — só sabem o que o outro fez ao ler este arquivo e o `git log`.
> Este é o "quadro de tarefas" compartilhado. **Leia antes de começar qualquer tarefa e atualize ao terminar.**

## Papéis

| Agente | Papel | Responsabilidade |
|--------|-------|------------------|
| **Implementador** | Construção | Escreve features novas, cria/edita código, faz as implementações do Roadmap. |
| **QA / Correção** | Revisão e conserto | Após cada implementação, busca erros (build, types, lint, lógica, runtime) e **corrige**. Não inventa features novas. |
| **Front-end / UI** | Evolução visual | Após o Implementador entregar telas básicas (e em conjunto com o QA), evolui a camada visual: design system, componentes presentacionais, responsividade, acessibilidade, UX e estados de UI. **Não altera regra de negócio.** |

### Fronteira de arquivos (evita colisão entre os 3 agentes)

| Agente | **Mexe em** | **Não toca** |
|--------|-------------|--------------|
| Implementador / QA | `**/actions.ts` (server actions), `src/lib/**` (auth, access, db, tenant, ai, crypto, storage), `prisma/**`, rotas de API | — |
| Front-end / UI | `src/components/**` (presentacional), `src/app/**/*.tsx` (markup/JSX de render), `src/app/globals.css`, layout/estilo | `**/actions.ts`, `src/lib/**`, `prisma/**`, regras de RBAC |

> Quando uma tela exige tocar lógica **e** visual no mesmo arquivo, combinar no quadro quem entra primeiro.
> **Direção visual definida:** SaaS limpo e neutro (estilo Linear/Vercel — claro, muito espaço em branco, cinza/preto, tipografia forte).

## Protocolo (os três agentes seguem)

1. **Antes de editar:** ler este arquivo + rodar `git status` / `git log --oneline -5`.
2. **Reivindicar:** anotar em "Em andamento" os arquivos que você vai tocar, com hora. Não mexer em arquivo que o outro reivindicou.
3. **Não sobrepor:** se precisar de um arquivo reivindicado pelo outro, anotar em "Fila" e esperar liberar.
4. **Ao terminar uma frente:** commitar (`git commit`) — o commit é o recado para o outro agente — e mover o item para "Concluído".
5. **Handoff Implementador → QA:** ao terminar uma implementação, o Implementador adiciona o item em **"Fila de revisão (QA)"**. O QA pega dali, revisa, conserta e registra em "Erros encontrados".

## Em andamento (locks ativos)

<!-- formato: - [Agente] arquivo/área — desde HH:MM -->
- [Implementador] **Fase 6 — Camada pública profissional — LOCK LIBERADO** (commit `fa030d5`).
  Portal editorial completo: schema +Category/Tag/PostTag, queries de capa/categoria/relacionados/mais-lidas/busca,
  SEO (metadata + JSON-LD NewsArticle/Breadcrumb/WebSite) + sitemap.xml/feed.xml/robots.txt, 13 componentes
  editoriais (Header/Footer/Hero/Cards/Strip/MostRead/Breadcrumb/Share/Article/Related), painel com CRUD de
  editorias + tema do site + PostForm estendido (categoria/featured/autor/heroAlt/tags). Review adversarial
  multi-agente confirmou 48 achados; **17 corrigidos imediatamente** (1 blocker + 6 high + 10 med — ver lista no commit).
  - **Para QA:** revisar `src/app/tenants/**`, `src/lib/portal/**`, `src/lib/seo/**`, `src/components/portal/**`,
    `dashboard/sites/[siteId]/categories|theme/actions.ts` e hardenings multi-tenant em `posts/actions.ts`.
  - **Para Front-end:** componentes do portal são estética EDITORIAL própria (NÃO usar `@/components/ui`).
    Achados não-bloqueantes do review pra refinar: dek opcional no hero, overlay no PostCardGrid,
    busca com cor do tema, paginação numerada, escala tipográfica modular — ficam por sua conta em `src/components/portal/**`.
  Tudo liberado. **Front-end:** telas básicas novas p/ evoluir: `dashboard/analytics/page.tsx` (+ link no `layout.tsx`).
  Tracking de analytics nas páginas de tenant é só 1 linha de lógica (`recordView`) — o visual delas é seu.
- [Implementador] **Fase 3 (monitoramento de tendências) — LOCK LIBERADO ~17:55** (commits `b84a6af` + `.gitignore`).
  Tudo liberado. **Front-end:** o `layout.tsx` está livre (2 links novos: Fontes, Tendências) e há 4 telas
  básicas novas p/ evoluir o visual: `sources/page.tsx`, `trends/page.tsx`, `SourceForm.tsx`, `CollectTrendsButton.tsx`.
- [Front-end/UI] **EVOLUÇÃO VISUAL COMPLETA — LOCK LIBERADO.** Design system aplicado em todas as telas
  (typecheck + lint + build limpos, 15 rotas). Tudo liberado. **Para os outros agentes:** existe agora um
  design system em `src/components/ui/**` (Button, Field/Input/Textarea/Select, Card, Badge, PageHeader,
  EmptyState, Stat, TextLink, FormError/FormSuccess, cn) — **reusem esses primitivos** em telas novas;
  importem de `@/components/ui`. Tokens/acento da marca em `src/app/globals.css` (`bg-brand`, `text-brand`).
  Telas novas: não recriar inputs/botões à mão. **Eu não toquei** `actions.ts` nem `src/lib/**`.
- [QA] Fases 1-5 ✅ aprovadas (MVP completo). **LOCK LIBERADO ~21:45.** Itens 8 (timing-safe compare em `automation.ts`)
  e 9 (clamp 0-100 do score em `trends/index.ts`) aplicados e validados (tsc+lint+build). Tudo liberado.
- [Implementador] **Fase 2 (IA nativa BYOK) — LOCK LIBERADO ~02:15** (commit `321fd9b`).
  `dashboard/settings/`, `dashboard/generate/`, `src/lib/storage.ts`, `AiKeyForm.tsx`, `GenerateForm.tsx`
  e `dashboard/layout.tsx` **liberados**. **Front-end:** o `layout.tsx` que você aguardava está livre;
  e há 4 telas básicas novas (settings, generate + 2 forms) prontas para evolução visual.
- [Implementador] **Fase 2 — fechamento (pesquisa real de palavras-chave) — LOCK LIBERADO ~02:05** (commit `cfa70ce`).
  `src/lib/keywords/**`, `src/lib/ai/pipeline.ts`, `src/app/dashboard/generate/actions.ts` **liberados**.
  **Front-end:** ✅ pendência cosmética em `GenerateForm.tsx` resolvida — campo renomeado para
  "Palavras-chave / sementes (opcional — a IA pesquisa o resto)".

## Fila de revisão (QA)

<!-- Implementador adiciona aqui o que terminou e precisa ser revisado pelo QA -->
- ✅ **[Fase 1 — commit `927b9ef`] REVISADA E APROVADA pelo QA** (ver "Erros encontrados / correções"). 0 bugs bloqueantes.
- ✅ **[Fase 2 — commits `321fd9b` + `cfa70ce`] REVISADA E APROVADA pelo QA** (ver "Erros encontrados / correções"). 0 bugs bloqueantes.
- ✅ **[Fase 4 — commit `fd0695d`] REVISADA E APROVADA pelo QA** (ver "Erros encontrados / correções"). 0 bugs bloqueantes.
- [Fase 6 — commit `fa030d5`] Revisar portal editorial. 17 achados já corrigidos no commit; QA atenção:
  - **Multi-tenant**: hardening em `posts/actions.ts` (assertPostBelongsToSite + revalidateTenantPublic) e
    `categories/actions.ts` (assertCategoryBelongsToSite em delete; ownership check em update).
  - **Stretched-link** em `FeaturedHero` e `PostCardGrid/Horizontal/Compact` (CategoryBadge fora do Link
    com `relative z-10`; Link do título com `after:absolute after:inset-0`). Confirmar 0 nested anchors.
  - **SEO**: NewsArticle.image como ImageObject (1200x630), og:image na home com dimensões, canonical
    paginada na categoria. Conferir com Rich Results Test (Google).
  - **Acessibilidade**: h1 sr-only na home; breadcrumb contraste neutral-500; aria-current/aria-label nos
    navs; safeImageUrl bloqueia javascript:/data:; ShareButtons com "abre em nova janela".
  - **WCAG contrast em CategoryBadge**: usa `bestTextColor` por luminância (preto/branco automático). Validar
    com cores extremas (#ffffff, #000000).
  - **Revalidação**: ao publicar/despublicar/editar/excluir post, revalidatePath de `/tenants/[host]`
    (layout) + sitemap/feed. Smoke: editar post no painel, ver capa atualizar em < 1s.
  - **Performance** (não-bloqueantes, low/medium): N+1 em categoryBlocks (mitigado por revalidate=60),
    getMostRead pega take*2 (poderia usar notIn no groupBy), searchPosts sem FTS (ok p/ MVP).
  - **Demo**: `npx tsx prisma/seed-demo.ts` cria 2 sites, 8 editorias, 14 matérias com tema/destaques.
  - `recordView` roda no render de Server Component (tenant pages) — efeito colateral em GET; aceitável em rota
    dinâmica, ignora bots por UA e nunca lança. Validar se não conta prefetch/duplo-render indevido.
  - `getSiteStats` usa `$queryRaw` (date_trunc) p/ séries por dia — conferir binding seguro (usa template tag, ok).
  - RBAC: página `/dashboard/analytics` filtra por `accessibleSiteIds`; sem site → mensagem. Smoke de agregação OK.
- ✅ **[Fases 3+5 — commits `b84a6af` + `796d63f`] REVISADAS E APROVADAS pelo QA** (ver "Erros encontrados / correções"). 0 bugs bloqueantes.
- [Fase 5 — commit `796d63f`] Revisar automação n8n. Atenção:
  - Auth dos webhooks via `isAuthorizedAutomation` (x-cron-secret OU admin). Smoke: 401 sem segredo, 200/400 com.
  - `/api/generate` usa as chaves BYOK de `AUTOMATION_USER_EMAIL` (fallback 1º admin) — sem chave → 500 com mensagem.
  - `notifyN8n` é fire-and-forget (timeout 5s, try/catch) — sem `N8N_WEBHOOK_URL` vira no-op. Não bloqueia publish/coleta.
  - `src/lib/ai/generate.ts` duplica levemente a lógica de `generate/actions.ts` (slug único etc.) — possível DRY futuro
    (a action do painel ficou intacta de propósito p/ não desfazer o hardening do QA).
  - **RBAC**: fonte/pauta global = ADMIN; por site = `canAccessSite` (`sources/actions.ts`, `trends/actions.ts`).
    `collectNow` é ADMIN-only; a página `trends` filtra por `accessibleSiteIds` (global + sites do usuário).
  - **Rota `POST /api/trends/collect`**: autoriza por `x-cron-secret` (== `CRON_SECRET`) OU sessão admin.
    Conferir: sem `CRON_SECRET` definido e sem sessão admin → 401 (não coleta).
  - **Coleta** (`src/lib/trends/`): fetch com timeout 8s + `try/catch` por fonte (uma fonte ruim não derruba o lote);
    dedup por escopo+título (smoke test: 35 itens, 2ª coleta inseriu 0). Parsing RSS e Google Trends (ns `ht:`).
  - **Scoring "fora da curva"** é heurístico (tráfego do Trends / posição no feed) — validar se faz sentido p/ o produto.
  - Idempotência: re-coletar não duplica; mas títulos iguais com o tempo não "reanimam" (status fica NEW até ação). OK p/ V1.
  - Possível melhoria (não-bloqueante): cron real (node-cron/n8n agendado) chamando a rota; hoje o trigger é manual/externo.

## Erros encontrados / correções (QA)

<!-- formato: - [arquivo:linha] descrição do erro → correção aplicada (commit) -->
### Fase 1 (commit `927b9ef`) — revisado em 21/05 ~02:10. **VEREDITO: aprovado, 0 bugs bloqueantes.**
- ✅ `tsc` + `eslint` + `next build` limpos. 7 rotas geradas.
- ✅ **RBAC** correto: `createSite/updateSite/deleteSite` exigem ADMIN (`requireAdmin`); posts usam
  `assertSiteAccess` (editor só nos sites permitidos); listagens filtram por `accessibleSiteIds`;
  `publishToAll` e a página `/dashboard/publish` são ADMIN-only (defesa em 3 camadas).
- ✅ **Proxy/Prisma NÃO é bug nesta versão**: no Next 16 o Proxy roda em **Node.js runtime por padrão**
  (docs `node_modules/next/dist/docs/.../proxy.md` §Runtime), então importar `@/lib/auth` (Prisma) no
  `proxy.ts` funciona. Não precisa do split `auth.config.ts`. Suspeita do Implementador = falso-positivo.
- ✅ **Cascade** ok: `Post`/`Source`/`UserSiteAccess` com `onDelete: Cascade` → apagar site não dá erro de FK.
- ✅ **Validação** slug/domínio (zod) e checagem de colisão unique em create/update de site e post.
- ✅ **Smoke test runtime** (servidor dev do Implementador, porta 3000): `/dashboard`→307 `/login`;
  `Host: demo.localhost` → 200 "Site Demo" + post; `/ola-mundo` → 200; host inexistente → 404; `/`→`/dashboard`.
- ⚠️ **Recomendações (não-bloqueantes, opcionais — aguardando OK do usuário p/ aplicar):**
  1. Colisão de slug é check-then-create (não atômico): em concorrência rara o `create` lança P2002 → página
     de erro 500 em vez de mensagem amigável. Hardening: `try/catch` do P2002 nas actions.
  2. Markdown renderiza como texto pré-formatado (`whitespace-pre-wrap`) — escopo, não bug. Anotar p/ depois.
  3. Guard de `/dashboard` no proxy roda também em host de tenant (mostra login do painel no domínio público).
     Cosmético; tratar quando provisionar domínios reais.

### Fase 2 (commits `321fd9b` + `cfa70ce`) — revisado em 21/05 ~02:35. **VEREDITO: aprovado, 0 bugs bloqueantes.**
- ✅ `tsc` + `eslint` + `next build` limpos (13 rotas).
- ✅ **Cripto BYOK** (`settings/actions.ts`): valida provider + tamanho mínimo, `try/catch` em `encrypt`
  (ENCRYPTION_KEY ausente → erro amigável), upsert sem texto puro. Round-trip já validado na fundação.
- ✅ **RBAC generate** (`generate/actions.ts`): `canAccessSite` antes de gerar; pipeline em `try/catch`.
- ✅ **Keywords** (`src/lib/keywords/**`): smoke test runtime — chamada **REAL** ao Google Suggest pt-BR
  retornou termos reais; fallback offline (extração + stopwords) funciona; timeout 5s + abort + degradação.
- ✅ **Camada AI** (`src/lib/ai/**`): model IDs válidos (`claude-sonnet-4-6`, `gpt-4o`, `gpt-image-1`, `grok-4`);
  parsing de JSON tolerante; chave ausente lança erro claro (testado) → capturado no form, sem 500 cru.
- ✅ **Auth gating**: `/dashboard/settings` e `/dashboard/generate` → 307 `/login`.
- **Recomendações:**
  4. ✅ **CORRIGIDO pelo QA:** `generate/actions.ts` — `persistGeneratedImage` + `db.post.create` agora dentro de
     `try/catch` (redirect fora). Falha → mensagem amigável, sem 500 cru.
  5. ✅ **CORRIGIDO pelo QA:** colisão de slug (P2002) tratada com mensagem amigável no mesmo `try/catch`.
  6. ⚠️ (não-bloqueante) `storage.ts` grava em `/public/uploads` — ok no VPS; em FS read-only de prod falharia. Trocar por MinIO ao escalar (já no Roadmap).
  7. ✅ **RESOLVIDO pelo Front-end:** `GenerateForm.tsx` agora documenta sob o checkbox que a imagem é sempre
     gerada pela OpenAI (mesmo com texto em outro provedor) e exige chave OpenAI em Configurações.

### Fases 3 + 4 + 5 (commits `b84a6af`, `fd0695d`, `796d63f`) — revisado em 21/05 ~21:30. **VEREDITO: aprovado, 0 bugs bloqueantes.** (MVP completo)
- ✅ `tsc` + `eslint` + `next build` limpos (15 rotas, 2 API novas).
- ✅ **SEGURANÇA — webhooks fail-closed** (`automation.ts`): smoke test runtime confirmou
  `/api/generate` e `/api/trends/collect` → **401** sem segredo, **401** com segredo errado, **200** com `CRON_SECRET` correto.
  Sem `CRON_SECRET` definido, o header não autoriza (só sessão admin). Comportamento seguro por padrão.
- ✅ **SEGURANÇA — analytics SQL** (`analytics.ts`): `$queryRaw` usa **tagged template parametrizado** (bind vars),
  não `$queryRawUnsafe` → sem injection. `recordView` nunca lança (try/catch), ignora bots por UA.
- ✅ **RBAC Fase 3** (`sources/actions.ts`, `trends/actions.ts`): fonte/pauta global = ADMIN; por site = `canAccessSite`;
  `collectNow` ADMIN-only; páginas filtram por `accessibleSiteIds`. Páginas novas → 307 /login (testado).
- ✅ **Robustez de rede** (`trends/rss.ts`, `trends/index.ts`): fetch com timeout 8s + abort; `try/catch` por fonte
  (uma fonte ruim não derruba o lote); parsing RSS/Atom + Google Trends (ns `ht:`) degrada para vazio sem crash.
- ✅ **n8n** (`n8n.ts`): fire-and-forget, timeout 5s, try/catch, no-op sem `N8N_WEBHOOK_URL`; nunca bloqueia publish/coleta.
  Hooks (`notifyN8n`) em `publishPost`/`publishToAll`/coleta são `await`ed mas a função nunca lança → seguros.
- ✅ **Automação** (`ai/generate.ts` + `/api/generate`): `generatePostForSite` lança em erro, mas o route envolve
  em `try/catch` → 500 tratado com mensagem (sem crash). `resolveAutomationUserId` usa `AUTOMATION_USER_EMAIL` ou 1º admin.
- ⚠️ **Recomendações (não-bloqueantes):**
  8. ✅ **CORRIGIDO pelo QA:** `automation.ts` — comparação de segredo agora usa `crypto.timingSafeEqual`
     (com checagem de tamanho), constant-time. Auth dos webhooks já validada por smoke test antes da troca.
  9. ✅ **CORRIGIDO pelo QA:** `trends/index.ts` `scoreItem` — score do Google Trends agora com `Math.max(0, …)` (clamp 0-100).
  10. `Trend` não tem unique constraint (dedup é em app, check-then-insert): coleta concorrente poderia duplicar.
      Baixo risco (trigger manual/serial). Unique do Postgres não cobriria pautas globais (siteId null), então dedup em app é a escolha pragmática.
  11. `recordView` grava `country` de `x-vercel-ip-country` — no deploy VPS (escolhido) esse header não existe → sempre null. Trocar pelo header do proxy do VPS quando provisionar.

## Fila (próximas tarefas, sem dono ainda)

- _(ver docs/ROADMAP.md para o escopo por fase)_

## Concluído

- [Implementador] Fundação: Next.js 16 + Prisma + Auth.js + camada de IA (commit `fd2c53d`)
- [Implementador] **Fase 1**: CRUD sites/posts, publicação manual e geral, multi-tenant (commit `927b9ef`).
  Build + typecheck + lint + smoke test OK. **Revisada e aprovada pelo QA (0 bugs).**
- [Implementador] **Fase 2**: IA nativa BYOK — config de chaves criptografadas + geração de rascunho
  via pipeline (Leitor→SEO→Imagem) (commit `321fd9b`). Build + typecheck + lint + smoke test (cripto) OK.
- [Implementador] **Fase 2 (fechamento)**: pesquisa real de palavras-chave (Google Suggest + fallback)
  alimentando o agente SEO (commit `cfa70ce`). Fase 2 **100% completa**. Build + typecheck + lint + smoke test OK.
- [Implementador] **Fase 3**: monitoramento de tendências — fontes (RSS/Google Trends) + coleta + scoring
  "fora da curva" + pautas + rota p/ n8n/cron (commit `b84a6af`). Build + typecheck + lint + smoke test (feeds reais) OK.
- [Implementador] **Fase 4**: analytics first-party por site (PageView + tracking + /dashboard/analytics)
  (commit `fd0695d`). Build + typecheck + lint + smoke (agregação) OK.
- [Implementador] **Fase 5**: automação n8n — webhooks de entrada (`/api/generate`, `/api/trends/collect`)
  e saída (`notifyN8n`) + docs (commit `796d63f`). Build + typecheck + lint + smoke (auth) OK.
  **MVP do Roadmap (Fases 0–5) completo** — pronto para a revisão final do QA.
- [Front-end/UI] Ajustes de texto/UX em `GenerateForm.tsx`: campo de palavras-chave renomeado p/ "sementes
  (opcional)" com dica, e nota de que a imagem sempre usa OpenAI (itens 5 e 7 do handoff). typecheck + lint OK.
- [Implementador] **Fase 6**: camada pública profissional — portal editorial estilo G1/InfoMoney com
  capa/categoria/matéria/busca, SEO completo (sitemap/feed/JSON-LD/metadata), tema por site (CSS var),
  CRUD de editorias e tema no painel, multi-tenant hardening, WCAG/contraste, stretched-link (zero nested anchors)
  (commit `fa030d5`). Review adversarial multi-agente (5 dimensões, 48 achados): 17 corrigidos no commit.
  Build + typecheck + lint + smoke OK.
- [Front-end/UI] **Evolução visual completa do painel (design system).** Estilo SaaS limpo/neutro (Linear/Vercel):
  - **Novo design system** em `src/components/ui/**`: `cn`, `Button`/`buttonClass`, `Field`/`Input`/`Textarea`/`Select`,
    `Card`, `Badge`, `PageHeader`, `EmptyState`, `Stat`, `TextLink`/`linkClass`, `FormError`/`FormSuccess`.
  - **Tokens** em `globals.css` (fundo neutro, acento `brand`, foco) + correção fonte (Geist) e `lang="pt-BR"`.
  - **Nav responsiva** com item ativo e menu mobile (`DashboardNav.tsx`); casca em `dashboard/layout.tsx`.
  - **Todas as telas refatoradas** sobre os primitivos: login, dashboard, sites (lista/detalhe/post),
    publish, generate, settings, sources, trends, analytics + páginas públicas (tenants).
  - Apenas camada presentacional — `actions.ts`/`src/lib/**` intactos. typecheck + lint + build (15 rotas) OK.
