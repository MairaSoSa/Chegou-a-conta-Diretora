FROM node:20-slim

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm prune --production

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.cjs"]
