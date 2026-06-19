# syntax=docker/dockerfile:1.7

# Alpine is smaller, but moon 2.3.x currently fails its WASM filesystem lookup
# on musl. Use the lean glibc image so container checks stay close to CI.
FROM node:24-bookworm-slim AS verify

ENV CI=true \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    PNPM_HOME=/pnpm

WORKDIR /workspace/repo

RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends ca-certificates git \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@11.8.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc .gitignore ./
COPY .moon ./.moon
RUN rm -rf .moon/cache
COPY packages ./packages
COPY scripts ./scripts
COPY tests ./tests
COPY eslint.config.cjs vitest.config.js ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Keep Docker focused on clean dependency/runtime isolation. Host and GitHub
# Actions validate moon's task graph against the real checkout history.
RUN pnpm run lint:fast \
    && pnpm -r --if-present lint \
    && pnpm -r --if-present typecheck \
    && pnpm -r --if-present build \
    && pnpm -r --if-present test \
    && pnpm exec vitest run \
    && pnpm run pack
