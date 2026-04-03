FROM node:20-slim

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

RUN npm ci

ENV NODE_ENV=production

CMD ["node", "dist/bootstrap.cjs"]
