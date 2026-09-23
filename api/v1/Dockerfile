FROM node:26-alpine3.24 AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

FROM base AS dev-deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM base AS dev
ENV NODE_ENV=development
COPY --from=dev-deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY ./src ./src
EXPOSE 3001
CMD ["npm", "run", "dev"]

FROM base AS production
ENV NODE_ENV=production
RUN apk add --no-cache tini
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY ./src ./src
RUN mkdir -p /app/database && chown -R node:node /app
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/app.js"]
