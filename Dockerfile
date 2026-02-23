# ── Stage 1: build ────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: production ───────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Volume for persistent SQLite database
VOLUME ["/data"]

ENV HOST=0.0.0.0
ENV PORT=4321
ENV DB_PATH=/data/db.sqlite

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
