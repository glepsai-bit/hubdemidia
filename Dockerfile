# syntax=docker/dockerfile:1.7
#
# HubDeMidia — Dockerfile de produção (Next.js 16 standalone + Prisma).
# Multi-stage: deps → builder → runner. Imagem final ~250MB.
# Usa Bookworm Slim (glibc) para evitar dor com binários nativos do Prisma.

ARG NODE_VERSION=20-bookworm-slim

# ────────────────────────────────────────────────────────────────────────────────
# 1) deps — instala TODAS as deps (inclui devDependencies p/ build)
# ────────────────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
# openssl exigido pelo Prisma em runtime/queries.
# npm install (em vez de ci) porque deps opcionais de sharp variam por plataforma;
# o lockfile fica consistente após o build dentro da imagem.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g npm@11
COPY package.json package-lock.json ./
RUN npm install --include=dev --no-audit --no-fund

# ────────────────────────────────────────────────────────────────────────────────
# 2) builder — gera Prisma Client e faz next build
# ────────────────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Prisma Client (precisa estar disponível pro next build resolver tipos do banco).
RUN npx prisma generate
RUN npm run build

# ────────────────────────────────────────────────────────────────────────────────
# 3) runner — imagem final, só o necessário pra rodar
# ────────────────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# openssl exigido pelo Prisma; dumb-init para PID 1 limpo.
# Prisma CLI instalado global no runner — leve e self-contained (~30MB).
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates dumb-init \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs \
    && npm install -g prisma@6.19.3

# Standalone do Next traz o servidor mínimo e o subset de node_modules necessário.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma Client (runtime do app — usado pelas queries em runtime) + schema/migrations p/ deploy.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Dir de uploads persistente (volume)
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

# Entrypoint roda migrations antes do server (idempotente).
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

# Healthcheck básico: server responde algo na raiz (redirect 307 OK).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
