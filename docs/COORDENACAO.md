# Coordenação entre Agentes

> **Por que este arquivo existe:** dois agentes de IA trabalham nesta pasta ao mesmo tempo.
> Eles **não se enxergam em tempo real** — só sabem o que o outro fez ao ler este arquivo e o `git log`.
> Este é o "quadro de tarefas" compartilhado. **Leia antes de começar qualquer tarefa e atualize ao terminar.**

## Papéis

| Agente | Papel | Responsabilidade |
|--------|-------|------------------|
| **Implementador** | Construção | Escreve features novas, cria/edita código, faz as implementações do Roadmap. |
| **QA / Correção** | Revisão e conserto | Após cada implementação, busca erros (build, types, lint, lógica, runtime) e **corrige**. Não inventa features novas. |

## Protocolo (os dois agentes seguem)

1. **Antes de editar:** ler este arquivo + rodar `git status` / `git log --oneline -5`.
2. **Reivindicar:** anotar em "Em andamento" os arquivos que você vai tocar, com hora. Não mexer em arquivo que o outro reivindicou.
3. **Não sobrepor:** se precisar de um arquivo reivindicado pelo outro, anotar em "Fila" e esperar liberar.
4. **Ao terminar uma frente:** commitar (`git commit`) — o commit é o recado para o outro agente — e mover o item para "Concluído".
5. **Handoff Implementador → QA:** ao terminar uma implementação, o Implementador adiciona o item em **"Fila de revisão (QA)"**. O QA pega dali, revisa, conserta e registra em "Erros encontrados".

## Em andamento (locks ativos)

<!-- formato: - [Agente] arquivo/área — desde HH:MM -->
- [Implementador] **Fase 1** — desde 01:07. Arquivos/áreas:
  - `src/app/dashboard/**` (layout, sites CRUD, posts CRUD, publicação geral) — edita `dashboard/page.tsx`
  - `src/app/tenants/**` (renderização pública multi-tenant)
  - `src/proxy.ts` (adiciona rewrite por host para tenants)
  - `src/lib/validation.ts`, `src/components/**` (novos)
  - NÃO toco em: `prisma/schema.prisma` exceto se necessário (avisarei), `CLAUDE.md`.

## Fila de revisão (QA)

<!-- Implementador adiciona aqui o que terminou e precisa ser revisado pelo QA -->
- _(vazio)_

## Erros encontrados / correções (QA)

<!-- formato: - [arquivo:linha] descrição do erro → correção aplicada (commit) -->
- _(vazio)_

## Fila (próximas tarefas, sem dono ainda)

- _(ver docs/ROADMAP.md para o escopo por fase)_

## Concluído

- [Implementador] Fundação: Next.js 16 + Prisma + Auth.js + camada de IA (commit `fd2c53d`)
