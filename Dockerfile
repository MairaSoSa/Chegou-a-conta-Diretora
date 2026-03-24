FROM node:20-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    curl \
    && pip3 install gdown --break-system-packages \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Artefatos para o bootstrap (addon nativo do SQLite) ──────────────────────
RUN gzip -9 -c node_modules/better-sqlite3/build/Release/better_sqlite3.node \
      > dist/better_sqlite3.gz \
    && gzip -9 dist/index.cjs \
    && cp scripts/bootstrap-template.cjs dist/bootstrap.cjs

RUN npm prune --production

COPY start.sh /start.sh
RUN chmod +x /start.sh

ENV NODE_ENV=production

CMD ["/start.sh"]
