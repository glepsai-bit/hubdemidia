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

## Fase 2 — IA nativa (BYOK)
- [ ] Tela de configuração de chaves (Claude/GPT/Grok), criptografadas.
- [ ] Adapter `AIProvider` agnóstico.
- [ ] Agente **Leitor** (lê/reescreve notícia).
- [ ] Agente **Imagem** (gera/refaz imagem).
- [ ] Agente **SEO** (otimiza com dados de palavras-chave).
- [ ] Pipeline encadeado: notícia → leitor → imagem → SEO → rascunho.

## Fase 3 — Monitoramento de tendências
- [ ] Cadastro de fontes (Google Trends, RSS, sites escolhidos) globais e por site.
- [ ] Worker/cron de coleta + detecção de "fora da curva".
- [ ] Fila de pautas → dispara pipeline de IA automaticamente.

## Fase 4 — Analytics
- [ ] Integração de analytics por site (Umami/Plausible ou GA4).
- [ ] Dashboard de acessos/métricas por site no painel.

## Fase 5 — Automação n8n
- [ ] Webhooks de entrada/saída para o n8n.
- [ ] Disparar pipelines via n8n.

## Pós-V1 — Redes sociais
- [ ] API por site para postar/publicar (Instagram etc.).
- [ ] Agendamento e publicação multi-rede.

---
**Regra de priorização:** nada da V1 depende de redes sociais. Entregar Fases 0–1 já dá um produto utilizável.
