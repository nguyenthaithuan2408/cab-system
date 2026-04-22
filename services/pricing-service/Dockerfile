# syntax=docker/dockerfile:1

# â”€â”€ Stage 1: base â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# â”€â”€ Stage 2: install all deps (including devDeps for build) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
FROM base AS deps
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# â”€â”€ Stage 3: build (no-op á»Ÿ Ä‘Ã¢y vÃ¬ project thuáº§n Node.js, khÃ´ng transpile) â”€â”€â”€
FROM deps AS build
COPY . .
RUN npm run build --if-present

# â”€â”€ Stage 4: production runner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
FROM base AS runner

# Chá»‰ install production dependencies
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
    && npm cache clean --force

# Copy toÃ n bá»™ source tá»« build stage (bao gá»“m src/)
COPY --from=build /app/src ./src

# Cháº¡y vá»›i user node (non-root) Ä‘á»ƒ báº£o máº­t
USER node

EXPOSE 3004

CMD ["npm", "run", "start"]
