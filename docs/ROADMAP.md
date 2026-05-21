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
