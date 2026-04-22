FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# ====== Development stage ======
FROM base AS development
RUN npm install
COPY src ./src
EXPOSE 3002
CMD ["node", "--watch", "src/server.js"]

# ====== Production stage ======
FROM base AS production
# Chỉ cài production dependencies
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# Tạo non-root user để bảo mật
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs
USER nodeuser

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3002/health || exit 1

CMD ["node", "src/server.js"]
