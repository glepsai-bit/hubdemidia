# Roadmap — HubDeMidia

Objetivo: **pôr no ar o mais rápido possível** com bom custo-benefício. MVP primeiro, redes sociais depois.

## Fase 0 — Fundação (setup)
- [ ] Inicializar projeto Next.js + TypeScript.
- [ ] Configurar Supabase (DB + Auth + Storage).
- [ ] Prisma + schema inicial (`users`, `roles`, `sites`, `user_site_access`).
- [ ] Auth básica + RBAC (admin/editor).
- [ ] Deploy inicial (Vercel/Railway) "hello world" no ar.

## Fase 1 — MVP de gestão de sites
- [x] CRUD de sites no painel (admin), com RBAC.
- [x] Modelo de conteúdo: `posts` (pages/media ficam para depois).
- [x] Renderização multi-tenant (rota por domínio/subdomínio via proxy).
- [~] Conectar domínio customizado: campo `domain` no site + resolução por host pronta;
      provisionamento real do domínio (DNS/cert) é etapa de deploy.
- [x] Editor de conteúdo + **publicação manual** (site individual e "geral/todos").

## Fase 2 — IA nativa (BYOK) ✅
- [x] Tela de configuração de chaves (Claude/GPT/Grok), criptografadas (`/dashboard/settings`).
- [x] Adapter `AIProvider` agnóstico (`src/lib/ai/`).
- [x] Agente **Leitor** (lê/reescreve notícia).
- [x] Agente **Imagem** (gera/refaz imagem) + storage local da imagem gerada.
- [x] Agente **SEO** (otimiza com palavras-chave).
- [x] Pipeline encadeado: notícia → leitor → pesquisa de palavras-chave → SEO → imagem → rascunho (`/dashboard/generate`).
- [x] **Pesquisa real de palavras-chave** (Google Suggest, gratuita) alimentando o agente SEO; sementes
      manuais viram opcionais. Camada `src/lib/keywords/` é provider-agnóstica.
      _Evolução opcional futura: provider BYOK de volume/dificuldade absolutos (DataForSEO/SEMrush)._

## Fase 3 — Monitoramento de tendências ✅
- [x] Cadastro de fontes (Google Trends, RSS, sites) globais e por site (`/dashboard/sources`).
- [x] Coleta + detecção de "fora da curva" (scoring por tráfego/posição); dedup. `src/lib/trends/`.
- [x] Fila de pautas (`/dashboard/trends`) ordenada por relevância; ações usar/descartar.
- [x] Trigger de coleta: manual (admin) + rota `POST /api/trends/collect` para n8n/cron (CRON_SECRET).
- [~] **Disparo automático do pipeline a partir da pauta**: hoje é semi-automático (pauta → "Gerar conteúdo").
      Encadear pauta→pipeline 100% no automático fica para a fase de automação (n8n) / agendamento real.

## Fase 4 — Analytics ✅
- [x] Analytics **first-party** por site (self-host, custo zero — sem GA4/Plausible). Modelo `PageView` +
      tracking server-side nas páginas públicas. `src/lib/analytics.ts`.
- [x] Dashboard de acessos/métricas por site (`/dashboard/analytics`): totais, por dia, posts mais vistos.
      _Evolução opcional: trocar/empilhar com Umami/Plausible se quiser métricas mais ricas._

## Fase 5 — Automação n8n ✅
- [x] Webhooks de **entrada** (`POST /api/generate`, `POST /api/trends/collect`) e **saída** (`notifyN8n`).
- [x] Disparar o pipeline via n8n (`/api/generate` cria rascunho ou publica). Docs: `docs/INTEGRACAO_N8N.md`.
- [~] **Cron real**: hoje o disparo é externo (n8n Schedule chamando os webhooks). Agendador interno fica opcional.

## Pós-V1 — Redes sociais
- [ ] API por site para postar/publicar (Instagram etc.).
- [ ] Agendamento e publicação multi-rede.

## Fase 6 — Camada pública profissional (portal estilo G1/InfoMoney) ✅
- [x] Modelo editorial: `Category`, `Tag`, `PostTag`; Post recebe `categoryId`, `featured`, `authorName`,
      `heroAlt`, `readingMinutes`; Site recebe `primaryColor`, `logoUrl`, `tagline`, `language`. Migration `portal`.
- [x] Capa editorial (manchete + 3 destaques, mais lidas, blocos por editoria, últimas) com cache ISR (60s).
- [x] Página de matéria padrão portal: breadcrumb, autor/data/leitura, hero, body markdown, share, relacionados.
- [x] Página de editoria com paginação + página de busca textual.
- [x] **SEO**: per-page `generateMetadata` (title/desc/OG/Twitter/canonical), JSON-LD NewsArticle (ImageObject),
      BreadcrumbList, WebSite (SearchAction), NewsMediaOrganization; **sitemap.xml**, **feed.xml**, **robots.txt** por tenant.
- [x] **Tema por site**: `primaryColor` aplicada via CSS var `--portal-primary`; helper `bestTextColor` (luminância WCAG).
- [x] **Painel**: CRUD de editorias (`/dashboard/sites/[siteId]/categories`), tema do site (`/theme`),
      PostForm estendido (categoria/featured/autor/heroAlt/tags), `toggleFeatured`.
- [x] **Hardenings**: multi-tenant ownership em todas as ações de post/categoria;
      revalidatePath das rotas tenant ao publicar/editar/excluir; `safeImageUrl` bloqueia `javascript:`/`data:`.
- [x] **A11y**: h1 sr-only na home; breadcrumb WCAG; aria-current/aria-label nos navs; share com "abre em nova janela";
      `bestTextColor` no badge; stretched-link (zero nested anchors).
- [~] Refinos visuais opcionais (Front-end): dek no hero, overlay no PostCardGrid, busca temática, paginação numerada.

---
**Regra de priorização:** nada da V1 depende de redes sociais. Entregar Fases 0–1 já dá um produto utilizável.
