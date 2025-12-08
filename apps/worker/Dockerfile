FROM node:18-alpine

WORKDIR /app

COPY package.json ./

RUN apk add --no-cache pnpm && pnpm install

COPY . .

CMD ["pnpm", "run", "start:worker"]
