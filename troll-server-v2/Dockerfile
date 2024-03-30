# TODO: Adopt https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
# Adopted from https://gabnotes.org/lighten-your-python-image-docker-multi-stage-builds/
FROM node:16.15-bullseye-slim AS BUILD_IMAGE

WORKDIR /usr/src/app

RUN apt-get update && apt-get install --assume-yes python3-dev python3-pip
COPY package.json yarn.lock ./
# RUN --mount=type=cache,target=/root/.npm NPM_CONFIG_CACHE=/root/.npm npm rebuild @tensorflow/tfjs-node --build-from-source
# RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn --frozen-lockfile
RUN yarn --frozen-lockfile
RUN npm rebuild @tensorflow/tfjs-node --build-from-source
COPY . .
RUN yarn server:build:prod
RUN npm prune --production

FROM node:16.15-bullseye-slim AS PROD_IMAGE

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules
COPY package.json yarn.lock tsconfig.json tsconfig-paths-bootstrap.js docker-entrypoint.sh ./

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
EXPOSE 7070

CMD ["yarn", "server:start:prod"]
