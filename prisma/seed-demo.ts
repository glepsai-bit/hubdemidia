// Demo seed: configura 2 sites com tema, editorias e posts (1 hero, 3 destaques, etc.).
// Idempotente: pode rodar várias vezes.
import { PrismaClient } from "@prisma/client";
import readingTime from "reading-time";

const db = new PrismaClient();

const minutes = (text: string) =>
  Math.max(1, Math.round(readingTime(text, { wordsPerMinute: 200 }).minutes));

async function upsertSite(slug: string, name: string, opts: {
  description: string;
  tagline: string;
  primaryColor: string;
}) {
  return db.site.upsert({
    where: { slug },
    update: {
      name,
      status: "LIVE",
      description: opts.description,
      tagline: opts.tagline,
      primaryColor: opts.primaryColor,
      language: "pt-BR",
    },
    create: {
      slug,
      name,
      status: "LIVE",
      description: opts.description,
      tagline: opts.tagline,
      primaryColor: opts.primaryColor,
      language: "pt-BR",
    },
  });
}

async function upsertCategory(siteId: string, slug: string, name: string, color: string, order: number) {
  return db.category.upsert({
    where: { siteId_slug: { siteId, slug } },
    update: { name, color, order },
    create: { siteId, slug, name, color, order },
  });
}

interface PostSeed {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  categorySlug?: string;
  featured?: boolean;
  authorName?: string;
  imageUrl?: string;
  heroAlt?: string;
  hoursAgo?: number; // simula data de publicação
}

async function upsertPost(siteId: string, categoryBySlug: Map<string, string>, p: PostSeed) {
  const publishedAt = new Date(Date.now() - (p.hoursAgo ?? 0) * 3600 * 1000);
  const categoryId = p.categorySlug ? categoryBySlug.get(p.categorySlug) ?? null : null;
  await db.post.upsert({
    where: { siteId_slug: { siteId, slug: p.slug } },
    update: {
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      categoryId,
      featured: !!p.featured,
      authorName: p.authorName ?? null,
      imageUrl: p.imageUrl ?? null,
      heroAlt: p.heroAlt ?? null,
      readingMinutes: minutes(p.content),
      status: "PUBLISHED",
      publishedAt,
    },
    create: {
      siteId,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      categoryId,
      featured: !!p.featured,
      authorName: p.authorName ?? null,
      imageUrl: p.imageUrl ?? null,
      heroAlt: p.heroAlt ?? null,
      readingMinutes: minutes(p.content),
      status: "PUBLISHED",
      publishedAt,
    },
  });
}

async function main() {
  // ── TECH HOJE ──
  const tech = await upsertSite("tech-hoje", "Tech Hoje", {
    description: "Notícias de tecnologia em primeira mão.",
    tagline: "Tecnologia, IA e startups",
    primaryColor: "#0ea5e9", // azul
  });
  const techCats = new Map<string, string>();
  for (const c of [
    { slug: "ia", name: "Inteligência Artificial", color: "#0ea5e9", order: 1 },
    { slug: "startups", name: "Startups", color: "#10b981", order: 2 },
    { slug: "mercado", name: "Mercado", color: "#6366f1", order: 3 },
    { slug: "carreira", name: "Carreira", color: "#f59e0b", order: 4 },
  ]) {
    const cat = await upsertCategory(tech.id, c.slug, c.name, c.color, c.order);
    techCats.set(c.slug, cat.id);
  }

  const techPosts: PostSeed[] = [
    {
      slug: "ia-generativa-2026-mercado-trabalho",
      title: "IA generativa muda o mercado de trabalho em 2026 — veja os impactos",
      excerpt: "Levantamento mostra que 4 em cada 10 empresas já usam IA em pelo menos uma função estratégica; veja as áreas mais afetadas.",
      content: `Um novo levantamento mostra que **40% das empresas brasileiras** já integraram IA generativa em ao menos uma função estratégica no primeiro semestre de 2026.

## As áreas mais afetadas

O estudo aponta três frentes em que a adoção acelerou: **atendimento ao cliente**, **marketing/conteúdo** e **engenharia de software**. Em todas, a economia média de tempo passou de 30%.

## O que muda para quem trabalha

Para profissionais, a mensagem é dupla: ferramentas de IA são **multiplicadoras de produtividade**, mas exigem reaprender o fluxo. Especialistas recomendam priorizar habilidades de **revisão crítica**, **prompt design** e **integração de sistemas**.

> "Quem se adapta primeiro lidera. Quem espera é deixado para trás", afirma a pesquisadora Marina Lopes.

A próxima edição do estudo está prevista para outubro.`,
      categorySlug: "ia",
      featured: true,
      authorName: "Marina Costa",
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=750&fit=crop",
      heroAlt: "Tela com texto gerado por IA em ambiente de escritório",
      hoursAgo: 2,
    },
    {
      slug: "startups-fintechs-rodada-2026",
      title: "Fintechs brasileiras captam US$ 1,2 bi em rodada recorde",
      excerpt: "Apesar do cenário cauteloso, três fintechs lideram captações que somam US$ 1,2 bilhão no semestre.",
      content: `Três fintechs nacionais lideraram captações que somam **US$ 1,2 bilhão** no primeiro semestre de 2026, segundo dados da consultoria Distrito.

## Quem captou

- **Nubank Spin-off** — US$ 500 milhões
- **CloudBank** — US$ 420 milhões
- **PayFlow** — US$ 280 milhões

## O que isso significa

O mercado, antes retraído, voltou a olhar para o **B2B financeiro** e **crédito inteligente** como vetores de crescimento. Fundos americanos lideram as rodadas.`,
      categorySlug: "startups",
      featured: true,
      authorName: "Rafael Andrade",
      imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=750&fit=crop",
      heroAlt: "Gráficos financeiros em telas de monitor",
      hoursAgo: 4,
    },
    {
      slug: "google-anuncia-modelo-gemini-3",
      title: "Google anuncia Gemini 3 com foco em agentes autônomos",
      excerpt: "Nova geração do modelo promete planejamento multistep, acesso a ferramentas e raciocínio mais robusto.",
      content: `O Google apresentou hoje o **Gemini 3**, terceira geração do modelo. O foco é em **agentes autônomos**: a capacidade de planejar tarefas multistep, acessar ferramentas externas e raciocinar de forma mais robusta.

A empresa demonstrou um agente capaz de **fazer reservas, comparar preços e gerar relatórios** sem intervenção humana.`,
      categorySlug: "ia",
      featured: true,
      authorName: "Equipe Tech Hoje",
      imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=750&fit=crop",
      heroAlt: "Logo de IA em tela de smartphone",
      hoursAgo: 7,
    },
    {
      slug: "carreira-engenheiro-software-2026",
      title: "Vagas para engenheiros sêniors crescem 28% no setor de IA",
      excerpt: "Demanda por experiência em LLMs e infraestrutura empurra salários para faixa de R$ 30 mil a R$ 50 mil.",
      content: `Vagas para engenheiros sêniors no setor de IA cresceram **28%** no primeiro semestre, segundo a Revelo. A faixa salarial pago para perfis com experiência em **LLMs**, **infraestrutura distribuída** e **MLOps** está entre **R$ 30 mil e R$ 50 mil**.

Empresas oferecem benefícios extras como **equity** e **trabalho remoto internacional**.`,
      categorySlug: "carreira",
      authorName: "Patricia Silva",
      imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=750&fit=crop",
      heroAlt: "Desenvolvedores reunidos em frente a quadro branco",
      hoursAgo: 11,
    },
    {
      slug: "mercado-cripto-recuperacao",
      title: "Bitcoin volta a US$ 95 mil e mercado cripto retoma fôlego",
      excerpt: "Movimento é acompanhado por entrada institucional via ETFs e aprovação de novos produtos no exterior.",
      content: `O **Bitcoin** voltou a romper a marca de **US$ 95 mil** nesta semana, em movimento puxado por entrada institucional via ETFs e novas aprovações regulatórias no exterior.

O mercado segue volátil, mas analistas projetam estabilização na faixa de **US$ 90-100 mil** no curto prazo.`,
      categorySlug: "mercado",
      authorName: "Carlos Mendes",
      imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1200&h=750&fit=crop",
      heroAlt: "Moeda física de Bitcoin",
      hoursAgo: 14,
    },
    {
      slug: "framework-open-source-llm-brasileiro",
      title: "Pesquisadores brasileiros lançam framework open-source para LLMs",
      excerpt: "Projeto da Unicamp e USP simplifica fine-tuning e avaliação de modelos em português.",
      content: `Pesquisadores da **Unicamp** e da **USP** lançaram um framework open-source para facilitar o **fine-tuning** e a **avaliação** de modelos de linguagem em português.

O projeto, disponível no GitHub, inclui datasets curados, métricas locais e exemplos prontos. A primeira release recebeu mais de **1.500 estrelas** em uma semana.`,
      categorySlug: "ia",
      authorName: "Bruno Tavares",
      imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=750&fit=crop",
      heroAlt: "Código de programação na tela",
      hoursAgo: 20,
    },
    {
      slug: "startup-saude-tecnologica-serie-b",
      title: "HealthAI capta R$ 80 milhões em Série B para diagnóstico por imagem",
      excerpt: "Startup paulista usa visão computacional para acelerar leitura de exames; planeja expandir para América Latina.",
      content: `A startup paulista **HealthAI** captou **R$ 80 milhões** em rodada Série B liderada pelo fundo Kaszek. O dinheiro será usado para expandir operações na **América Latina** e investir em pesquisa de **detecção precoce de câncer** via imagens.

A solução, em uso em 30 hospitais brasileiros, reduz em **40%** o tempo de leitura de exames.`,
      categorySlug: "startups",
      authorName: "Equipe Tech Hoje",
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=750&fit=crop",
      heroAlt: "Médico examinando imagem em monitor",
      hoursAgo: 26,
    },
    {
      slug: "mercado-acoes-tech-2t26",
      title: "Ações de tech sobem 12% no 2º trimestre puxadas por IA",
      excerpt: "Setor de tecnologia lidera ganhos no índice ICONXT, com destaque para empresas com receita ligada a IA.",
      content: `O setor de **tecnologia** liderou os ganhos no índice ICONXT no segundo trimestre de 2026, com **alta de 12%**. O movimento foi puxado por empresas com receita diretamente ligada a **produtos de IA**.

Analistas apontam que o resultado supera a expectativa de **8%** projetada no início do ano.`,
      categorySlug: "mercado",
      authorName: "Carlos Mendes",
      imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=750&fit=crop",
      heroAlt: "Gráfico de bolsa em alta",
      hoursAgo: 32,
    },
  ];
  for (const p of techPosts) await upsertPost(tech.id, techCats, p);

  // ── ESPORTE JÁ ──
  const esporte = await upsertSite("esporte-ja", "Esporte Já", {
    description: "Tudo do esporte, na hora.",
    tagline: "Futebol, NBA e mais",
    primaryColor: "#c8102e", // vermelho
  });
  const espCats = new Map<string, string>();
  for (const c of [
    { slug: "futebol", name: "Futebol", color: "#c8102e", order: 1 },
    { slug: "basquete", name: "Basquete", color: "#f97316", order: 2 },
    { slug: "olimpiadas", name: "Olimpíadas", color: "#0ea5e9", order: 3 },
    { slug: "outros", name: "Outros Esportes", color: "#10b981", order: 4 },
  ]) {
    const cat = await upsertCategory(esporte.id, c.slug, c.name, c.color, c.order);
    espCats.set(c.slug, cat.id);
  }
  const espPosts: PostSeed[] = [
    {
      slug: "brasileirao-final-clube-x-classico",
      title: "Brasileirão tem clássico decisivo na 38ª rodada e definição do título",
      excerpt: "Líder e vice-líder se enfrentam neste domingo, em jogo que vale o título e vagas para a Libertadores.",
      content: `O **Brasileirão 2026** chega ao seu desfecho com um clássico inesperado: líder e vice-líder se enfrentam na **38ª rodada** valendo o título.

## Como chegam os times

O atual líder soma **76 pontos** e joga em casa. O vice tem **74** e precisa vencer fora para erguer a taça. Em caso de empate, o título fica com o mandante.

## Histórico recente

Nos últimos 5 confrontos diretos, são **2 vitórias** para cada lado e **1 empate**. O jogo de ida, há um mês, terminou 2 a 2.`,
      categorySlug: "futebol",
      featured: true,
      authorName: "João Pedro",
      imageUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&h=750&fit=crop",
      heroAlt: "Bola de futebol em campo gramado",
      hoursAgo: 1,
    },
    {
      slug: "nba-finals-game-7",
      title: "NBA: Finals vai a jogo 7 após virada espetacular no quarto período",
      excerpt: "Em 12 minutos finais sensacionais, time visitante reverte desvantagem de 18 pontos e força o sétimo jogo.",
      content: `Em **12 minutos finais inesquecíveis**, o time visitante reverteu uma desvantagem de **18 pontos** e levou as Finals da NBA a um decisivo jogo 7.

## O que aconteceu

O quarto período começou com vantagem confortável para o mandante. Mas uma sequência de **8 cestas de 3 seguidas** virou o jogo. O placar final: **108 a 105**.

## O que esperar do jogo 7

Será disputado na **quinta-feira**. Análise estatística aponta vantagem mínima para o mandante, mas o momento é todo do visitante.`,
      categorySlug: "basquete",
      featured: true,
      authorName: "Lucas Mendes",
      imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=750&fit=crop",
      heroAlt: "Bola de basquete passando pela cesta",
      hoursAgo: 3,
    },
    {
      slug: "selecao-brasileira-amistoso-historico",
      title: "Seleção brasileira vence amistoso por 4 a 0 e empolga torcida",
      excerpt: "Com elenco renovado, time mostra solidez e atinge melhor desempenho ofensivo em dois anos.",
      content: `A **Seleção Brasileira** venceu o amistoso por **4 a 0** no Maracanã, em jogo que mostrou solidez do elenco renovado.

## Os gols

O ataque marcou aos **12, 23, 67 e 89 minutos**. Destaque para o **camisa 10**, que deu duas assistências.

## Próximos compromissos

A equipe entra em campo novamente em **setembro**, pelas Eliminatórias da Copa do Mundo de 2030.`,
      categorySlug: "futebol",
      featured: true,
      authorName: "Equipe Esporte Já",
      imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=750&fit=crop",
      heroAlt: "Torcida brasileira no estádio",
      hoursAgo: 6,
    },
    {
      slug: "tenis-final-grand-slam",
      title: "Brasileiro chega à semifinal de Grand Slam pela primeira vez em 30 anos",
      excerpt: "Performance impressionante coloca o país de volta no mapa do tênis mundial.",
      content: `Um jogador brasileiro chegou à **semifinal de um Grand Slam** pela primeira vez em **30 anos**. A vitória nas quartas foi por **3 sets a 1**.

A semifinal será na **sexta-feira**. O adversário ainda não está definido.`,
      categorySlug: "outros",
      authorName: "Ana Beatriz",
      imageUrl: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1200&h=750&fit=crop",
      heroAlt: "Tenista comemorando vitória",
      hoursAgo: 10,
    },
    {
      slug: "olimpiadas-paris-2028-preparacao",
      title: "Comitê Olímpico Brasileiro detalha preparação para Paris 2028",
      excerpt: "Plano inclui investimento em 12 modalidades de alto rendimento e parceria com universidades.",
      content: `O **Comitê Olímpico Brasileiro (COB)** apresentou o plano de preparação para **Paris 2028**. A meta é alcançar **30 medalhas** — recorde nacional.

O plano inclui investimento em **12 modalidades** de alto rendimento e novas parcerias com **universidades** para apoio técnico e científico.`,
      categorySlug: "olimpiadas",
      authorName: "Equipe Esporte Já",
      imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&h=750&fit=crop",
      heroAlt: "Anel olímpico em estádio",
      hoursAgo: 18,
    },
    {
      slug: "libertadores-quartas-decisao",
      title: "Libertadores: quartas terão dois confrontos brasileiros",
      excerpt: "Sorteio definiu chaves com clima de revanche; jogos começam na próxima semana.",
      content: `O sorteio da **Libertadores** definiu as chaves das quartas. Dois confrontos serão entre **clubes brasileiros**, com clima de revanche após eliminações em fases anteriores.

Os jogos começam na **próxima terça-feira**.`,
      categorySlug: "futebol",
      authorName: "João Pedro",
      imageUrl: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&h=750&fit=crop",
      heroAlt: "Estádio cheio à noite",
      hoursAgo: 24,
    },
  ];
  for (const p of espPosts) await upsertPost(esporte.id, espCats, p);

  console.log(`✓ ${tech.name}: ${techPosts.length} posts em ${techCats.size} editorias.`);
  console.log(`✓ ${esporte.name}: ${espPosts.length} posts em ${espCats.size} editorias.`);
  console.log(`\nAcesse:`);
  console.log(`  http://tech-hoje.localhost:3000`);
  console.log(`  http://esporte-ja.localhost:3000`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
