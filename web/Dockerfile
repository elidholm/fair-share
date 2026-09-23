FROM node:26-alpine3.24 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM deps AS source
COPY vite.config.js index.html ./
COPY public ./public
COPY src ./src

FROM source AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM source AS build
ENV NODE_ENV=production
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.31-alpine3.24 AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN nginx -t
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/bin/sh", "-c", "wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1"]
