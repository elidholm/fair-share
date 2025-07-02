FROM node:20-alpine

WORKDIR /app
COPY package.json .
RUN npm isntall

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
