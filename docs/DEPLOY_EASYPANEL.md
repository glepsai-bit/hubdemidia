# Deploy no Easypanel (Hostinger VPS + Docker Compose)

> **Resumo:** um único deploy serve **o painel + todos os sites do hub**.
> O Easypanel/Traefik faz o roteamento por domínio. Você só precisa de DNS curinga.

---

## 0. Pré-requisitos

- **VPS** com Docker e Easypanel instalados (Hostinger KVM, Hetzner, DigitalOcean — qualquer um). Mínimo recomendado: **2 vCPU / 4 GB RAM / 40 GB SSD**.
- **Domínio próprio** (ex.: `hubdemidia.com.br`) com acesso ao painel do registrador (Registro.br, Cloudflare, etc.) para configurar DNS.

---

## 1. DNS — o pulo do gato do multi-tenant

Você precisa de **3 entradas** no DNS do seu domínio raiz. Substitua `SEU_IP_DA_VPS`.

| Tipo | Nome (host) | Conteúdo | TTL |
|---|---|---|---|
| A | `painel` | `SEU_IP_DA_VPS` | 300 |
| A | `*`     | `SEU_IP_DA_VPS` | 300 |
| A | `@` (raiz, opcional) | `SEU_IP_DA_VPS` | 300 |

- O **curinga `*`** faz `qualquer-coisa.hubdemidia.com.br` chegar no servidor — é o que permite criar site novo no painel e ele já ficar no ar em `meu-site.hubdemidia.com.br`.
- Em **Cloudflare**, deixe o curinga em **DNS only** (nuvem cinza) para o Easypanel poder emitir certificado próprio. Depois, se quiser, ligue o proxy.

### Domínios próprios por site (cliente com `meusite.com`)

Quando um cliente quiser usar o domínio dele em vez do subdomínio:
1. Você cadastra o domínio no painel do site (campo "Domínio" do Site).
2. O cliente cria um **registro A** no DNS dele apontando `meusite.com` (e `www`) para `SEU_IP_DA_VPS`.
3. No Easypanel, em **App → Domains**, adiciona `meusite.com` à app. O Easypanel emite o certificado automaticamente (Let's Encrypt HTTP-01).

---

## 2. Criar o app no Easypanel

### Opção A — pelo `docker-compose.yml` (recomendado)

1. **No Easypanel**, crie um projeto `hubdemidia`.
2. **Adicione um serviço Compose** apontando para este repositório. O Easypanel detecta o `docker-compose.yml`.
3. **Variáveis de ambiente** (Project → Environment): cole o conteúdo de [.env.production.example](../.env.production.example) e preencha:

```bash
POSTGRES_PASSWORD=<senha forte>
AUTH_SECRET=<openssl rand -base64 32>
ENCRYPTION_KEY=<node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
ROOT_DOMAIN=hubdemidia.com.br
CRON_SECRET=<openssl rand -hex 24>    # opcional, p/ n8n
```

4. **Domínios** (Service `app` → Domains):
   - `painel.hubdemidia.com.br` — o painel administrativo.
   - `*.hubdemidia.com.br` — curinga p/ os sites (precisa do Let's Encrypt **DNS-01**;
     em Easypanel: marcar "Wildcard" e seguir o assistente, que pede um token de DNS do
     seu provedor — Cloudflare é o mais simples). Se preferir, pode adicionar os subdomínios
     **um a um** conforme criar sites no painel — funciona igual, só dá mais trabalho.
5. **Deploy**. O Easypanel faz o build da imagem, sobe o `db`, espera health-check OK e sobe o `app`.
   O entrypoint roda `prisma migrate deploy` antes do servidor — banco fica pronto sozinho.

### Opção B — só o `app`, com Postgres gerenciado pelo Easypanel

Se preferir usar o template **PostgreSQL** do próprio Easypanel:
1. Crie um serviço **PostgreSQL** no Easypanel; copie a `DATABASE_URL` interna.
2. Remova o serviço `db` do `docker-compose.yml` (ou use o `Dockerfile` direto).
3. Defina `DATABASE_URL=postgresql://...` apontando para o Postgres do Easypanel.

---

## 3. Primeiro acesso

Depois do deploy concluído:

1. **Criar o admin inicial** rodando o seed dentro do container — pelo console do Easypanel ou via SSH:

```bash
docker compose exec app sh -c '
  export ADMIN_EMAIL="seu-email@dominio.com"
  export ADMIN_PASSWORD="trocar-na-primeira-sessao"
  npx tsx prisma/seed.ts
'
```

2. **Acessar** `https://painel.hubdemidia.com.br` com `seu-email` / `senha definida acima`.
3. **Trocar a senha** (gerencie usuários pelo painel — pós-V1 abre a tela de RBAC; por ora, troque direto no banco se quiser).
4. **Criar o 1º site** (Sites → Novo). Status `LIVE`, domínio próprio opcional.
5. **Cadastrar chave de IA** (Chaves IA → Claude/OpenAI/Grok).
6. **Cadastrar fontes** (Fontes → ex.: `https://trends.google.com/trending/rss?geo=BR`).
7. **Gerar conteúdo** (Tendências → Coletar agora → Gerar conteúdo).

---

## 4. Onde guardar o quê

| Coisa | Onde |
|---|---|
| Banco | volume Docker `db_data` (no compose) ou Postgres gerenciado |
| Imagens geradas pela IA | volume Docker `uploads` montado em `/app/public/uploads` |
| Logs | `docker logs hubdemidia-app-1` (ou pelo Easypanel) |
| Backups do banco | configurar `pg_dump` agendado no Easypanel ou cron externo |

---

## 5. Automação (n8n)

Sub o n8n como **outro serviço** no Easypanel (template pronto: "n8n").
- No n8n, crie um **Schedule** → **HTTP Request** com:
  - URL: `https://painel.hubdemidia.com.br/api/trends/collect`
  - Method: `POST`
  - Header: `x-cron-secret: <seu CRON_SECRET>`
- Encadeie com `/api/generate` para gerar rascunho automático.
- Detalhes dos payloads: [INTEGRACAO_N8N.md](INTEGRACAO_N8N.md).

---

## 6. Atualizar o app depois (deploy contínuo)

- **Easypanel + git**: configure o serviço com o repositório git; cada `git push` no branch dispara rebuild.
- **Manual**: `git pull && docker compose build app && docker compose up -d app`.
- **Migrations** rodam sozinhas no boot (`docker-entrypoint.sh`). Se uma migration falhar, o container não sobe — você vê o erro no log.

---

## 7. Troubleshooting rápido

| Sintoma | Provável causa | Como resolver |
|---|---|---|
| `painel.dominio.com` dá tela do nginx/Traefik | DNS ainda propagando | aguardar 5–60 min, testar com `dig` |
| Site novo (`slug.dominio.com`) dá 404 | curinga DNS não está configurado | criar registro A para `*` |
| Login falha com "JWT invalid" | `AUTH_SECRET` mudou entre boots | manter `AUTH_SECRET` fixo no env do projeto |
| 500 ao salvar chave de IA | `ENCRYPTION_KEY` ausente ou mudou | regerar e atualizar as chaves no painel |
| Cliente com domínio próprio dá "Not secure" | cert não emitido | esperar 1–2 min (HTTP-01) e confirmar DNS A apontando |

---

**Pronto. Em uma manhã, do nada ao no ar.**
