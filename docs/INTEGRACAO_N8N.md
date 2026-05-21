# Integração com n8n (automação)

O painel conversa com o n8n nos dois sentidos. Configure no `.env`:

```bash
N8N_WEBHOOK_URL="https://seu-n8n/webhook/hubdemidia"   # saída: painel -> n8n
CRON_SECRET="<openssl rand -hex 24>"                    # entrada: autoriza webhooks
AUTOMATION_USER_EMAIL="admin@seu-dominio"               # de quem são as chaves BYOK na automação
```

## Entrada (n8n → painel)

Autorize com o header `x-cron-secret: <CRON_SECRET>` (ou esteja logado como admin).

### 1. Coletar tendências
```
POST /api/trends/collect
x-cron-secret: <CRON_SECRET>
```
Lê as fontes ativas, detecta "fora da curva" e grava pautas novas. Responde com um resumo
(`{ sources, fetched, inserted, errors }`). Use um nó **Schedule** do n8n para rodar de tempos em tempos.

### 2. Gerar conteúdo (dispara o pipeline Leitor→SEO→Imagem)
```
POST /api/generate
x-cron-secret: <CRON_SECRET>
Content-Type: application/json

{
  "siteId": "ckxxx",            // obrigatório
  "raw": "texto da notícia...",  // obrigatório (mín. ~20 chars)
  "provider": "claude",          // claude | openai | grok (default claude)
  "niche": "tecnologia",         // opcional
  "sourceUrl": "https://...",    // opcional
  "keywords": ["ia", "startups"],// opcional (sementes; o resto é pesquisado)
  "withImage": false,             // opcional (requer chave OpenAI)
  "autoPublish": false            // opcional (true publica direto; default = rascunho)
}
```
Resposta `201`: `{ postId, title, status, seoScore }`. As chaves de IA usadas são as do
`AUTOMATION_USER_EMAIL` (ou do primeiro admin).

> **Fluxo típico no n8n:** Schedule → `POST /api/trends/collect` → (no painel você revisa as pautas)
> ou Schedule → HTTP Request lê a matéria de origem → `POST /api/generate` com o texto → rascunho criado.

## Saída (painel → n8n)

Se `N8N_WEBHOOK_URL` estiver definido, o painel faz `POST` nessa URL (fire-and-forget) com:
```json
{ "event": "<nome>", "payload": { ... }, "at": "ISO-8601" }
```
Eventos:
| event | quando | payload |
|-------|--------|---------|
| `trends.collected` | coleta gerou pautas novas | `{ inserted, fetched, sources }` |
| `post.generated` | geração via `/api/generate` | `{ siteId, postId, title, status, seoScore }` |
| `post.published` | post publicado no painel | `{ siteId, postId }` |
| `posts.published_all` | publicação geral | `{ count, sites, slug }` |

No n8n, crie um **Webhook** com essa URL para reagir aos eventos (ex.: postar em redes sociais — pós-V1).
