# syntax=docker/dockerfile:1

# 1. Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build the app
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Placeholder env so build-time validation passes. The build never connects
# to a database; real values are provided to the runner at runtime.
ENV DATABASE_URL="mysql://build:build@127.0.0.1:3306/build" \
    NEXTAUTH_SECRET="build-time-placeholder-secret-32-characters" \
    NEXTAUTH_URL="http://localhost:3000"
RUN npx prisma generate
RUN npm run build

# 3. Production runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone server output (includes a minimal node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# The entrypoint runs `prisma migrate deploy` (and optional seed) at startup,
# which needs the FULL dependency tree — the Prisma 7 CLI is all-JS with many
# transitive deps and resolves wasm files relative to its real location, so
# cherry-picking packages breaks it. Overwrite the standalone's minimal
# node_modules (laid down above) with the complete builder tree; it's a
# superset, so the server keeps working. Also bring the generated Prisma
# client + schema/migrations the CLI and seed need.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/app/generated ./app/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
