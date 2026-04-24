# NODE IMAGE
FROM node:alpine

# PUBLISH PROJECT INSIDE CONTAINER
WORKDIR /app

# COPY PACKAGE.JSON AND YARN.LOCK to workdir
COPY package.json yarn.lock ./

# EXEC PROJECT TO DOWNLOAD DEPENDENCIES
RUN yarn install --frozen-lockfile

# COPY EVERYTHING FROM PROJECT TO ROOT
COPY . .

# CREATE A EMPTY FILE .env for build
RUN touch .env

# install bash for Alpine
RUN apk add --no-cache bash

# remove dist folder if exists
RUN rm -rf dist || true

# build project
RUN yarn build

# port to listen
EXPOSE 3333

# COMMAND TO EXECUTE
CMD ["yarn", "start"]
