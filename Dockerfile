#-------------
FROM node:18.20-alpine AS deps

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

#-------------
FROM node:18.20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

#-------------
FROM node:18.20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    MODE=prod \
    HOST=localhost \
    PORT=3000 \
    TOKEN_NAME=eth \
    TOKEN_DENOM=uknow \
    MY_STAKING_OVERVIEW=120000 \
    GLOBAL_STAKING_OVERVIEW=120000

RUN addgroup --system --gid 1001 nest && \
  adduser --system --uid 1001 nest

COPY --chown=nest:nest --from=builder /app/node_modules ./node_modules
COPY --chown=nest:nest --from=builder /app/dist ./dist

USER nest

ENV PORT 3000

CMD ["node", "dist/src/main.js"]
