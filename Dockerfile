FROM node:22-alpine AS build

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginxinc/nginx-unprivileged:1.31.7-alpine

LABEL org.opencontainers.image.title="SmartPot Web Solid" \
      org.opencontainers.image.description="PWA de SmartPot en SolidJS servida con nginx sin privilegios" \
      org.opencontainers.image.source="https://github.com/SmartPotTech/SmartPot-Web-Solid" \
      org.opencontainers.image.licenses="MIT"

ENV API_URL=http://localhost:8091 \
    NGINX_ENVSUBST_FILTER="^(API_ORIGIN|CSP_UPGRADE)$"

COPY nginx/default.conf.template nginx/security-headers.inc.template /etc/nginx/templates/
COPY --chmod=755 nginx/15-smartpot-config.envsh /docker-entrypoint.d/15-smartpot-config.envsh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
