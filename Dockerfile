################# Monolith Builder ##############
FROM rust:1-bookworm AS monolith_builder

RUN apt-get update \
    && apt-get install --no-install-recommends -y \
        libssl-dev \
        pkg-config \
    && rm -rf /var/lib/apt/lists/* \
    && cargo install monolith --locked

################# Base Builder ##############
FROM node:24.18.1-slim AS base

WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g corepack@latest && corepack enable pnpm

RUN apt-get update \
    && apt-get install --no-install-recommends -y \
        make \
        g++ \
        python3 \
        python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/cli/package.json ./apps/cli/
COPY apps/mcp/package.json ./apps/mcp/
COPY apps/web/package.json ./apps/web/
COPY apps/workers/package.json ./apps/workers/
COPY packages/api/package.json ./packages/api/
COPY packages/db/package.json ./packages/db/
COPY packages/open-api/package.json ./packages/open-api/
COPY packages/plugins/package.json ./packages/plugins/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/shared-react/package.json ./packages/shared-react/
COPY packages/shared-server/package.json ./packages/shared-server/
COPY packages/shared/package.json ./packages/shared/
COPY packages/trpc/package.json ./packages/trpc/
COPY tooling/github/package.json ./tooling/github/
COPY tooling/oxlint/package.json ./tooling/oxlint/
COPY tooling/prettier/package.json ./tooling/prettier/
COPY tooling/tailwind/package.json ./tooling/tailwind/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY ./patches ./patches

ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN pnpm install --frozen-lockfile

COPY . .

# Build db migration script
RUN cd packages/db && \
    pnpm exec ncc build migrate.ts -o /db_migrations && \
    cp -R drizzle /db_migrations

# Compile web app
RUN (cd apps/web && pnpm exec next build --experimental-build-mode compile)

# Build worker code
RUN (cd apps/workers && pnpm --config.verify-deps-before-run=false build)
RUN CI=true pnpm deploy --node-linker=isolated --legacy --filter @karakeep/workers --prod /prod/workers

################# All-In-One Builder ##############
FROM node:24.18.1-slim AS aio_builder
LABEL org.opencontainers.image.source="https://github.com/SidGajera/Link_Bookmark_Post"
WORKDIR /app

ARG SERVER_VERSION=release
ENV SERVER_VERSION=${SERVER_VERSION}
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

ARG S6_OVERLAY_VERSION=3.2.1.0
ARG TARGETARCH

RUN apt-get update \
    && apt-get install --no-install-recommends -y \
        ca-certificates \
        wget \
        xz-utils \
    && rm -rf /var/lib/apt/lists/*

ADD https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-noarch.tar.xz /tmp
RUN tar -C / -Jxpf /tmp/s6-overlay-noarch.tar.xz \
    && case "${TARGETARCH:-amd64}" in \
            "amd64")  S6_ARCH=x86_64   ;; \
            "arm64")  S6_ARCH=aarch64  ;; \
            *)        S6_ARCH=x86_64   ;; \
        esac \
    && wget https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-${S6_ARCH}.tar.xz -O /tmp/s6-overlay-${S6_ARCH}.tar.xz \
    && tar -C / -Jxpf /tmp/s6-overlay-${S6_ARCH}.tar.xz \
    && rm -f /tmp/s6-overlay-${S6_ARCH}.tar.xz

COPY --chmod=755 ./docker/root/etc/s6-overlay /etc/s6-overlay

RUN apt-get update \
    && apt-get install --no-install-recommends -y \
        curl \
        graphicsmagick \
        ghostscript \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN case "${TARGETARCH:-amd64}" in \
        "amd64")  YTDLP_FILE=yt-dlp_linux ;; \
        "arm64")  YTDLP_FILE=yt-dlp_linux_aarch64 ;; \
        *)        YTDLP_FILE=yt-dlp_linux ;; \
    esac \
    && curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/${YTDLP_FILE} -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

RUN echo "--js-runtimes node" > /etc/yt-dlp.conf

COPY --from=monolith_builder /usr/local/cargo/bin/monolith /usr/local/bin/monolith

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTAUTH_URL_INTERNAL=http://localhost:${PORT}

COPY --from=base --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /db_migrations /db_migrations
RUN mkdir -p ./apps/web/.next && chown node:node ./apps/web/.next
COPY --from=base --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=base /prod/workers /app/apps/workers

ENTRYPOINT ["/init"]

################# Final Default Target (AIO) ##############
FROM aio_builder AS aio

RUN touch /etc/s6-overlay/s6-rc.d/user/contents.d/init-db-migration \
    /etc/s6-overlay/s6-rc.d/user/contents.d/svc-web \
    /etc/s6-overlay/s6-rc.d/user/contents.d/svc-workers

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider "http://127.0.0.1:${PORT:-3000}/api/health" || exit 1
