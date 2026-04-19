# Stage 1: Build & Install dependencies
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production Run
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# We run as a non-root user for security (Zero Trust principle at OS level)
RUN addgroup -S gatewaygroup && adduser -S gatewayuser -G gatewaygroup
USER gatewayuser

EXPOSE 3000

CMD ["node", "src/server.js"]
