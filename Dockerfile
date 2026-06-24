FROM node:20-alpine AS builder
WORKDIR /app
COPY app/package*.json ./
RUN npm ci
COPY app/ .
RUN npm run build:all

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/healthz || exit 1
CMD ["node", "dist-server/index.js"]
