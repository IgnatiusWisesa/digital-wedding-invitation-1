FROM node:22-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/artifacts/api-server/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
