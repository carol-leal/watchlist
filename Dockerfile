FROM node:20-alpine AS base
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
# Dereference pnpm symlinks so Prisma can be copied to the runner
RUN cp -rL node_modules/prisma /tmp/prisma-pkg && \
    cp -rL node_modules/@prisma /tmp/prisma-at-pkg

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma for migrations (real files, not pnpm symlinks)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated
COPY --from=builder /tmp/prisma-pkg ./node_modules/prisma
COPY --from=builder /tmp/prisma-at-pkg ./node_modules/@prisma

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
