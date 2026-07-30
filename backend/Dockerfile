FROM node:24-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


FROM node:24-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules

COPY package.json package-lock.json ./
COPY migrations ./migrations
COPY src ./src

RUN chown -R node:node /app

USER node

EXPOSE 3000

CMD ["sh", "-c", "npm run migrate:up:container && npm start"]