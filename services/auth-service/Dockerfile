# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install only production dependencies first for better layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate the client
COPY prisma ./prisma/
RUN npx prisma generate

# ─── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Create a non-root user/group for runtime security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built artifacts from builder stage
COPY --from=builder /app/node_modules        ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy application source
COPY src  ./src
COPY prisma ./prisma
COPY package.json ./

# Transfer ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

# Health check — K8s liveness / readiness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "\
    const h = require('http'); \
    h.get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)) \
     .on('error', () => process.exit(1));"

CMD ["node", "src/server.js"]
