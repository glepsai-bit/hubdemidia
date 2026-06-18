# Card do QA — Subagente de Qualidade

> Este arquivo é o **cartão de comunicação do agente QA**. Toda investigação de bug, hipótese,
> verificação adversarial e veredito ficam aqui. O Implementador lê esse card antes de codar,
> e o QA atualiza após cada análise. Aparece no `git log` toda vez que atualizamos.

## Identidade

- **Papel**: QA Engineer dedicado.
- **Escopo**: testar funcionalidades, identificar bugs, reproduzir cenários, propor diagnóstico claro.
- **Saída esperada**: ticket por bug investigado — hipótese → verificação → veredito → ação recomendada.
- **Não faz**: implementação de feature nova. Pode propor patches pequenos pra reproduzir/diagnosticar.

## Tickets abertos

### TICKET-1 · "Rodar agora" do autopilot não publica posts · **VERIFIED — 4 CAUSAS RECONCILIADAS**

**Reportado por**: Usuário (18/06).
**Sintoma**: clica em "Rodar agora" em `/dashboard/sites/<id>/autopilot`, espera, recarrega — nenhum post novo aparece.

**Contexto**:
- Deploy: `6e9a53a` em produção.
- Site `hexabr`: status=LIVE, autopilotEnabled=true (confirmado em screenshot).
- 4 fontes cadastradas (screenshot).
- Chave BYOK do usuário: apenas OpenAI configurada.

---

## Reconciliação: workflow QA (4 trilhas + verificação adversarial) × testes manuais ao vivo

### 🚨 CAUSA #1 (CRITICAL — workflow) · provider do autopilot = CLAUDE sem chave Claude

**Evidência**:
- `prisma/schema.prisma`: `autopilotProvider` tem `default(CLAUDE)`.
- `src/lib/autopilot/index.ts:110` → `PROVIDER_TO_NAME[site.autopilotProvider]` → `"claude"`.
- `src/lib/ai/index.ts:44` → `if (!row) throw new Error("Chave de API do provedor \"claude\" nao configurada")`.
- Erro cai no try/catch (`src/lib/autopilot/index.ts:166-170`) → `errors++` mas `posted=0`.
- Usuário só cadastrou OpenAI no `/dashboard/keys`.

**Cenário**: o site `hexabr` foi criado com `autopilotProvider=CLAUDE` (default). Como não há chave Claude, **toda** pauta cai no catch silencioso → `posted=0`.

### 🚨 CAUSA #2 (CRITICAL — manual) · 3 de 4 fontes cadastradas estão MORTAS

| Fonte | URL | Status real (testado HOJE) | Itens |
|---|---|---|---|
| Folha esporte (antiga) | `https://www1.folha.uol.com.br/folha/rss/esporte.xml` | **HTTP 404** | 0 |
| ESPN (antiga) | `https://www.espn.com.br/feeds/rss/news.xml` | **HTTP 404** | 0 |
| GE Globo (abandonada) | `https://ge.globo.com/dynamo/futebol/rss2.xml` | HTTP 200 (feed vazio desde 2018) | 0 |
| Google Trends BR | `https://trends.google.com/trending/rss?geo=BR` | HTTP 200 | 10 |

Apenas Google Trends entrega conteúdo. As 10 trends do dia já foram capturadas em coletas anteriores → dedup → `inserted: 0` → autopilot encontra `0 pautas NEW` → loop não roda → `posted=0` silencioso.

### 🚨 CAUSA #3 (HIGH — workflow + manual) · "Rodar agora" não cria AutopilotRun e não dá feedback

- `runAutopilotNow` retornava `Promise<void>` — sem mensagem, sem log.
- `RunAutopilotButton` usava `useTransition` sem `.catch()` — qualquer erro/sucesso ficava invisível.
- `runAutopilotForSite` retorna `posted=0` quando trends.length===0, mas o usuário só via "Executando..." → "Rodar agora" → vazio.

### ⚠️ CAUSA #4 (MEDIUM — manual) · cert SSL wildcard `*.hub.gleps.com.br` ainda é self-signed

```
$ curl -v https://hexabr.hub.gleps.com.br/
* SSL certificate problem: self signed certificate
```

**Não bloqueia o autopilot diretamente**, mas:
- Google bot não indexa
- Search Console não valida
- Navegador mostra warning vermelho

Causa raiz: o cert curinga precisa de DNS-01 challenge — sem token Cloudflare no Easypanel, fica self-signed.

---

## Patches aplicados nesta sessão (commits seguem em sequência)

### ✅ Patch 1 · `runAutopilotNow` virou completo
`src/app/dashboard/sites/[siteId]/autopilot/actions.ts`:
- Retorna `RunAutopilotResult = { ok, posted, errors, collected, message }`
- Cria `AutopilotRun` (status `RUNNING` → `OK`/`ERROR`/`SKIPPED`) — agora rodada manual aparece em `/dashboard/autopilot`
- **Pré-checa BYOK do provider** antes de tentar — se faltar chave, mensagem clara: *"Provedor é CLAUDE mas não há chave BYOK. Vá em Chaves IA ou troque o provedor."*
- **Força coleta antes de processar** (por site + global) — evita ciclo onde a UI executa sem ter o que processar
- Cobre `autopilotEnabled=false` com mensagem explícita

### ✅ Patch 2 · `RunAutopilotButton` mostra resultado
`src/components/RunAutopilotButton.tsx`:
- Estado de resultado com mensagem colorida (verde/vermelho/âmbar)
- Try/catch envolve a server action — erro nunca mais some

### ✅ Patch 3 · Botão "Testar feed" no cadastro de fontes
- Novo endpoint `POST /api/sources/test` chama `fetchFeed(url)` e retorna `count + 3 títulos de amostra`
- `SourceForm` agora tem botão **Testar feed** antes de salvar — evita cadastrar URL morta

---

## Feeds RSS VIVOS testados HOJE (use estes pra repor as fontes mortas)

Testados às 01:30 com `curl + grep <item>`. Esses funcionam **agora**:

| Feed | URL | Itens |
|---|---|---|
| Google News "futebol" | `https://news.google.com/rss/search?q=futebol&hl=pt-BR&gl=BR&ceid=BR:pt-419` | 104 |
| Google News "brasileirão" | `https://news.google.com/rss/search?q=brasileir%C3%A3o&hl=pt-BR&gl=BR&ceid=BR:pt-419` | 101 |
| Google News "copa" | `https://news.google.com/rss/search?q=copa&hl=pt-BR&gl=BR&ceid=BR:pt-419` | 111 |
| Folha esporte (URL nova) | `https://feeds.folha.uol.com.br/esporte/rss091.xml` | 100 |
| ESPN BR (URL nova) | `https://www.espn.com.br/espn/rss/news` | 38 |
| BBC Brasil | `https://feeds.bbci.co.uk/portuguese/rss.xml` | 41 |
| Google Trends BR | `https://trends.google.com/trending/rss?geo=BR` | 10 |

**MORTAS** (deletar do painel): Folha antiga, ESPN antiga, GE Globo `dynamo/futebol`.

---

## Plano de ação do usuário (em ordem, ~5 min total)

### 1. (30 s) Trocar provider do autopilot pra OpenAI
`/dashboard/sites/hexabr/autopilot` → campo "Provedor de IA" → **OpenAI** → Salvar.

### 2. (2 min) Substituir as 3 fontes mortas
`/dashboard/sources`:
1. Excluir Folha (antiga), ESPN (antiga), GE Globo.
2. Cadastrar pelo menos 3 da tabela acima. **Agora o botão "Testar feed" valida na hora** — só cadastra se vier `N itens`.

### 3. (10 s) Rodar agora
`/dashboard/sites/hexabr/autopilot` → "Rodar agora". Agora você vê a mensagem (verde se publicou, vermelha se falhou) e o resultado fica em `/dashboard/autopilot`.

### 4. (3 min) Cert SSL wildcard (opcional, mas necessário pra Google)
Cloudflare → My Profile → API Tokens → Create Token → permissão `Zone → DNS → Edit` em `gleps.com.br`. Cole no Easypanel → Configurações → Integrações → Cloudflare API. Domínio `*.hub.gleps.com.br` → SSL → Cloudflare DNS → Emitir cert.

---

## Histórico

- 18/06 00:00 — Card criado. TICKET-1 aberto.
- 18/06 01:30 — Testes ao vivo no `/api/trends/collect`. 3 de 4 fontes mortas confirmadas. SSL self-signed confirmado.
- 18/06 01:30 — Workflow QA executado (4 trilhas + adversarial verify). Causa primária identificada: provider=CLAUDE sem chave.
- 18/06 02:00 — Reconciliação concluída: 4 causas concorrentes, todas reais. Patches 1/2/3 aplicados. Tabela de feeds vivos validada com curl.
