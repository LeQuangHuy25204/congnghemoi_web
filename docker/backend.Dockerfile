FROM node:20-alpine

ARG SERVICE_PATH
ARG NPM_REGISTRY=https://registry.npmjs.org/

WORKDIR /app

COPY . .

WORKDIR /app/${SERVICE_PATH}

RUN npm config set registry ${NPM_REGISTRY} \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 2 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set fetch-timeout 300000

RUN npm ci --omit=dev

EXPOSE 5000

CMD ["npm", "start"]
