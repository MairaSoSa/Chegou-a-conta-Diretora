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

RUN npm prune --production

COPY start.sh /start.sh
RUN chmod +x /start.sh

ENV NODE_ENV=production

CMD ["/start.sh"]
