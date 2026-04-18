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
# Extract prisma version for the runner stage
RUN node -e "process.stdout.write(require('./node_modules/prisma/package.json').version)" > /tmp/prisma-version

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

# Install prisma CLI in an isolated dir (no package.json = no dependency conflicts)
COPY --from=builder /tmp/prisma-version /tmp/prisma-version
RUN npm install prisma@$(cat /tmp/prisma-version) --prefix /tmp/prisma-install --no-package-lock \
    && cp -r /tmp/prisma-install/node_modules/prisma ./node_modules/prisma \
    && cp -r /tmp/prisma-install/node_modules/@prisma ./node_modules/@prisma \
    && rm -rf /tmp/prisma-install /tmp/prisma-version

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
