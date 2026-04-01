FROM node:20-slim

WORKDIR /app

COPY . .

RUN chmod +x start.sh

ENV NODE_ENV=production

CMD ["node", "dist/bootstrap.cjs"]
