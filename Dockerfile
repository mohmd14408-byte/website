# Multi-stage Dockerfile for complete Node/Express/Vite app
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/data ./data
COPY --from=builder /app/public ./public
RUN npm install -g tsx

EXPOSE 3000
CMD ["tsx", "server.ts"]
