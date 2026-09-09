# Independent stages let Railway cache each report and its dependencies.
FROM node:24-bookworm-slim AS dior
WORKDIR /build
COPY app/package*.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY app/ ./
RUN npm run build

FROM node:24-bookworm-slim AS norway
WORKDIR /build
COPY app-political/package*.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY app-political/ ./
RUN npm run build

FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json server.mjs ./
COPY --from=dior /build/dist ./app/dist
COPY --from=norway /build/dist ./app-political/dist
USER node
EXPOSE 3001
CMD ["node", "server.mjs"]
