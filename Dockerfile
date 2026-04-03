FROM node:20-slim

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && pip3 install --break-system-packages --quiet gdown \
    && rm -rf /var/lib/apt/lists/*

RUN npm install

ENV NODE_ENV=production

CMD ["bash", "start.sh"]
