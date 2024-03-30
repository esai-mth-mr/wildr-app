# TODO: Adopt https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
FROM node:16.14-alpine AS BUILD_IMAGE

WORKDIR /usr/src/app

RUN apk --update add --no-cache make gcc g++ python3

COPY package.json yarn.lock ./
# https://stackoverflow.com/questions/65913706/how-do-i-make-yarn-cache-modules-when-building-containers
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn --frozen-lockfile
COPY . .
RUN yarn build
RUN npm prune --production

FROM node:16.14-alpine

WORKDIR /usr/src/app

# copy from build image
# COPY --from=BUILD_IMAGE /usr/src/app/package.json ./
COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules
COPY package.json yarn.lock tsconfig.json tsconfig-paths-bootstrap.js ./
COPY docker-server-entrypoint.sh ./

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
EXPOSE 6000

CMD ["yarn", "start:prod"]
