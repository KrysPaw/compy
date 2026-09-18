# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

RUN npm ci

FROM deps AS build
WORKDIR /app

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN npm run build -w @compy/shared \
  && npm run prisma:generate -w @compy/api \
  && npm run build -w @compy/api

FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

# Keep lockfile valid (web package.json present) but only install API + shared prod deps.
RUN npm ci --omit=dev --workspace=@compy/api --workspace=@compy/shared --include-workspace-root \
  && npm cache clean --force

COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/apps/api/prisma.config.ts apps/api/prisma.config.ts

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["npm", "run", "start:migrate"]
