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
- [QA] Revisão da Fase 1 (somente leitura + correções pontuais) — desde 01:45. Implementador: evitar editar `sites/`, `posts/`, `publish/`, `proxy.ts`, `validation.ts`, `access.ts` até liberar.
- [Implementador] **Fase 2 (IA nativa BYOK)** — desde 01:46. Replanejada para NÃO colidir com o lock do QA:
  - `src/app/dashboard/settings/**` (novo: config de chaves BYOK)
  - `src/app/dashboard/generate/**` (novo: geração de rascunho via pipeline, com seletor de site — FORA de `sites/`)
  - `src/lib/storage.ts` (novo), `src/components/AiKeyForm.tsx`, `GenerateForm.tsx` (novos)
  - `src/app/dashboard/layout.tsx` (edição mínima: add links de menu)
  - Apenas CONSUMO (sem editar): `src/lib/access.ts`, `src/lib/ai/**`, `src/lib/crypto.ts`, `prisma` (modelo AiKey/Post).

## Fila de revisão (QA)

<!-- Implementador adiciona aqui o que terminou e precisa ser revisado pelo QA -->
- [Fase 1 — commit `927b9ef`] Revisar CRUD de sites/posts, publicação manual e geral, e multi-tenant.
  Pontos de atenção sugeridos:
  - **RBAC**: editor não-admin não deve criar/editar/excluir sites; só gerenciar posts de sites permitidos
    (`src/app/dashboard/sites/actions.ts`, `posts/actions.ts`, `access.ts`).
  - **Proxy edge vs Prisma**: `src/proxy.ts` importa `@/lib/auth` (puxa Prisma). Build passou, mas confirmar
    que não quebra em runtime de produção (edge). Se quebrar, separar `auth.config.ts` sem adapter p/ o proxy.
  - **Validação de slug/domínio** e colisões (unique) nas actions.
  - **Markdown**: posts renderizam como texto pré-formatado (sem parser). Não é bug, é escopo — anotar p/ depois.
  - Dados de teste no banco dev: site `demo` + post `ola-mundo` (criados no smoke test).

## Erros encontrados / correções (QA)

<!-- formato: - [arquivo:linha] descrição do erro → correção aplicada (commit) -->
- _(vazio)_

## Fila (próximas tarefas, sem dono ainda)

- _(ver docs/ROADMAP.md para o escopo por fase)_

## Concluído

- [Implementador] Fundação: Next.js 16 + Prisma + Auth.js + camada de IA (commit `fd2c53d`)
- [Implementador] **Fase 1**: CRUD sites/posts, publicação manual e geral, multi-tenant (commit `927b9ef`).
  Build + typecheck + lint + smoke test OK.
