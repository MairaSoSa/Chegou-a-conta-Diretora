FROM node:20-slim

RUN apt-get update && apt-get install -y \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN bash scripts/deploy-build.sh

COPY start.sh /start.sh
RUN chmod +x /start.sh

ENV NODE_ENV=production

CMD ["/start.sh"]
