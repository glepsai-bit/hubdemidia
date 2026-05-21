# Arquitetura — HubDeMidia

## Visão geral

```
                         ┌─────────────────────────────┐
                         │      PAINEL (Next.js)        │
                         │  admin.hubdemidia.com        │
                         │  - Gestão de sites           │
                         │  - Dashboard analytics       │
                         │  - Editor de conteúdo        │
                         │  - Config de IA (BYOK)       │
                         │  - Monitor de tendências     │
                         │  - RBAC (admin/editor)       │
                         └──────────────┬──────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
┌───────▼────────┐            ┌─────────▼─────────┐           ┌─────────▼─────────┐
│  PostgreSQL    │            │   Camada de IA     │           │   Integrações      │
│  (self-host)   │            │  (adapter BYOK)    │           │                    │
│  - users/roles │            │  - Claude          │           │  - n8n (webhooks)  │
│  - sites       │            │  - GPT             │           │  - Google Trends   │
│  - posts/pages │            │  - Grok            │           │  - Fontes/RSS      │
│  - sources     │            │  Agentes:          │           │  - Keyword API     │
│  - ai_keys 🔒  │            │   Leitor/Imagem/SEO│           │  - (Redes sociais) │
└────────────────┘            └────────────────────┘           └────────────────────┘
        ▲
        │  renderização por domínio (multi-tenant)
┌───────┴──────────────────────────────────────────────┐
│  SITES PÚBLICOS (mesma app Next.js, rota por host)     │
│  site-a.com  •  site-b.com  •  site-c.com ...          │
└────────────────────────────────────────────────────────┘
```

## Multi-tenancy (chave para o custo-benefício)

- **Um único deploy** serve o painel **e** todos os sites públicos.
- Roteamento por **host** (middleware do Next.js lê o domínio/subdomínio → resolve o `site` no banco).
- Domínios customizados: adicionados via plataforma de deploy (ex.: Vercel Domains) ou proxy reverso.
- Conteúdo de cada site vem do banco (modelo de conteúdo: `posts`, `pages`, `media`).

## Camada de IA (adapter agnóstico)

Interface única `AIProvider` com implementações para Claude, OpenAI e Grok. Cada usuário cadastra
sua própria chave (BYOK), **criptografada no banco**. O painel só orquestra os agentes:

| Agente   | Entrada            | Saída                                  |
|----------|--------------------|----------------------------------------|
| Leitor   | URL/texto notícia  | resumo + reescrita pronta para publicar |
| Imagem   | contexto da notícia| nova imagem (gerada/refeita)            |
| SEO      | rascunho + keywords| versão otimizada + score/sugestões      |

Pipelines pesados podem ser delegados ao **n8n** via webhook (o painel dispara, o n8n executa).

## Monitoramento de tendências

- Fontes configuráveis por site/globais: Google Trends, RSS, sites escolhidos.
- Workers/cron detectam conteúdo "fora da curva" (picos de volume/engajamento).
- Resultado alimenta a fila de pauta → dispara o pipeline de agentes.

## RBAC

- `admin`: acesso total (todos os sites, usuários, config).
- `editor`: acesso **apenas aos sites permitidos** (relação `user_site_access`).
- Verificação em middleware + nas rotas de API.

## Publicação

- **Individual**: publica em um site.
- **Geral**: publica em todos os sites (ou seleção).
- **Manual**: editor escreve/edita à mão e publica.
- **(Pós-V1)** Disparo para redes sociais via API por site.

## Segurança

- Segredos em env vars; chaves de IA dos usuários criptografadas (ex.: AES com chave do ambiente).
- Isolamento de dados por `site_id` em todas as queries multi-tenant.
