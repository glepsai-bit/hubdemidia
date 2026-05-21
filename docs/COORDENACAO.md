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
- [Front-end/UI] **Registrado no time, sem lock ativo.** Aguardando o QA liberar `sites/`,`posts/`,`publish/` e o Implementador liberar `dashboard/layout.tsx` para iniciar o design system + refatoração visual. Vou tocar só camada presentacional (`src/components/**`, `*.tsx` de render, `globals.css`); não mexo em `actions.ts`/`src/lib/**`.
- [QA] **LOCK LIBERADO ~02:10.** Revisão da Fase 1 concluída (aprovada, 0 bugs). `sites/`, `posts/`, `publish/`, `proxy.ts`, `validation.ts`, `access.ts` **liberados** — Front-end pode iniciar o visual dessas telas.
- [Implementador] **Fase 2 (IA nativa BYOK) — LOCK LIBERADO ~02:15** (commit `321fd9b`).
  `dashboard/settings/`, `dashboard/generate/`, `src/lib/storage.ts`, `AiKeyForm.tsx`, `GenerateForm.tsx`
  e `dashboard/layout.tsx` **liberados**. **Front-end:** o `layout.tsx` que você aguardava está livre;
  e há 4 telas básicas novas (settings, generate + 2 forms) prontas para evolução visual.

## Fila de revisão (QA)

<!-- Implementador adiciona aqui o que terminou e precisa ser revisado pelo QA -->
- ✅ **[Fase 1 — commit `927b9ef`] REVISADA E APROVADA pelo QA** (ver "Erros encontrados / correções"). 0 bugs bloqueantes.
- [Fase 2 — commit `321fd9b`] Revisar IA nativa BYOK. Pontos de atenção:
  - **Cripto BYOK** (`src/lib/crypto.ts` consumido por `settings/actions.ts`): chave nunca em texto puro;
    smoke test de round-trip passou. Conferir que `ENCRYPTION_KEY` ausente dá erro tratado (não 500 cru).
  - **`generate/actions.ts`**: `canAccessSite` (RBAC) antes de gerar; `uniqueSlug` é check-then-create
    (mesmo P2002 não-atômico apontado na Fase 1 #1 — mesma decisão se aplica).
  - **`storage.ts`**: escreve em `/public/uploads` (ok em VPS; em FS read-only de prod falharia — trocar por MinIO).
  - Erro do pipeline (chave ausente / falha do provedor) é capturado e devolvido como mensagem amigável no form.
  - Não consegui testar a chamada real às APIs (sem chave BYOK) — validei wiring, cripto e caminho de erro.

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

## Fila (próximas tarefas, sem dono ainda)

- _(ver docs/ROADMAP.md para o escopo por fase)_

## Concluído

- [Implementador] Fundação: Next.js 16 + Prisma + Auth.js + camada de IA (commit `fd2c53d`)
- [Implementador] **Fase 1**: CRUD sites/posts, publicação manual e geral, multi-tenant (commit `927b9ef`).
  Build + typecheck + lint + smoke test OK. **Revisada e aprovada pelo QA (0 bugs).**
- [Implementador] **Fase 2**: IA nativa BYOK — config de chaves criptografadas + geração de rascunho
  via pipeline (Leitor→SEO→Imagem) (commit `321fd9b`). Build + typecheck + lint + smoke test (cripto) OK.
