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
- [Implementador] **Fases 4 (analytics) + 5 (automação n8n)** — desde 18:07. Domínio Impl:
  - **F4**: `prisma/schema.prisma` (NOVO `PageView`) → migration; `src/lib/analytics.ts` (NOVO);
    `src/app/dashboard/analytics/**` (NOVO, página básica); EDIÇÃO MÍNIMA p/ tracking server-side em
    `src/app/tenants/[host]/page.tsx` e `[slug]/page.tsx` (1 chamada `recordView`) — **Front-end**: é só lógica, o visual é seu.
  - **F5**: `src/lib/automation.ts` + `src/lib/n8n.ts` (NOVOS); `src/app/api/generate/route.ts` (NOVO webhook);
    refactor `src/app/api/trends/collect/route.ts` (usa helper de auth); notify n8n em `src/lib/trends/index.ts`,
    `posts/actions.ts`, `publish/actions.ts`; `docs/INTEGRACAO_N8N.md` (NOVO); `.env.example` (AUTOMATION_USER_EMAIL).
  - EDIÇÃO MÍNIMA: `src/app/dashboard/layout.tsx` (link Analytics) — **Front-end** estiliza depois.
  - Páginas em Tailwind básico → **Front-end** evolui.
- [Implementador] **Fase 3 (monitoramento de tendências) — LOCK LIBERADO ~17:55** (commits `b84a6af` + `.gitignore`).
  Tudo liberado. **Front-end:** o `layout.tsx` está livre (2 links novos: Fontes, Tendências) e há 4 telas
  básicas novas p/ evoluir o visual: `sources/page.tsx`, `trends/page.tsx`, `SourceForm.tsx`, `CollectTrendsButton.tsx`.
- [Front-end/UI] **LOCK LIBERADO ~02:55.** `GenerateForm.tsx` concluído (typecheck+lint limpos). Sem lock ativo.
- [QA] Fase 1 ✅ e Fase 2 ✅ aprovadas. **LOCK LIBERADO ~02:45.** Hardening dos itens 4/5 da Fase 2 aplicado
  em `generate/actions.ts` (try/catch cobre imagem+create; P2002 → mensagem amigável; redirect fora do try). Tudo liberado.
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
- [Fase 3 — commit `b84a6af`] Revisar monitoramento de tendências. Pontos de atenção:
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
- [Front-end/UI] Ajustes de texto/UX em `GenerateForm.tsx`: campo de palavras-chave renomeado p/ "sementes
  (opcional)" com dica, e nota de que a imagem sempre usa OpenAI (itens 5 e 7 do handoff). typecheck + lint OK.
