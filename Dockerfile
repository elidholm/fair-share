# syntax=docker/dockerfile:1
ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine

LABEL org.opencontainers.image.source=https://github.com/elidholm/fair-share
LABEL org.opencontainers.image.description="A simple web app for splitting expenses between friends."
LABEL org.opencontainers.image.licenses=APACHE-2.0

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

EXPOSE 3000

# Run the application.
CMD [ "npm", "run", "dev ]
