# syntax=docker/dockerfile:1

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

WORKDIR /app

COPY ./package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5173

# Run the application.
CMD [ "npm", "run", "start" ]
