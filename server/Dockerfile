# TODO: Adopt https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
FROM public.ecr.aws/i4u5z5o0/node-alpine:16.14.0 AS BUILD_IMAGE

WORKDIR /usr/src/app

RUN apk --update add --no-cache make gcc g++ python3

COPY package.json yarn.lock ./
# https://stackoverflow.com/questions/65913706/how-do-i-make-yarn-cache-modules-when-building-containers
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn --frozen-lockfile
COPY . .
RUN yarn server:build
RUN npm prune --production

FROM public.ecr.aws/i4u5z5o0/node-alpine:16.14.0
RUN apk --update add redis

WORKDIR /usr/src/app

# copy from build image
COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules
COPY package.json yarn.lock tsconfig.json dd-tracer.js tsconfig-paths-bootstrap.js ./
COPY docker*.sh ./

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
EXPOSE 5000

CMD ["yarn", "start:prod"]
