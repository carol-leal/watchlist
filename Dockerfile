FROM node:22-alpine AS base
RUN npm install -g pnpm@10.32.1

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
ENV SKIP_ENV_VALIDATION=1
RUN pnpm build

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

# Install prisma CLI with npm (clean install, no pnpm symlink issues)
COPY --from=builder /app/package.json ./package.json
RUN PRISMA_VERSION=$(node -e "const p=require('./package.json'); console.log((p.dependencies?.prisma ?? p.devDependencies?.prisma ?? '').replace(/[\\^~]/g,''))") \
    && npm install prisma@${PRISMA_VERSION} --no-save --no-package-lock \
    && rm package.json

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
