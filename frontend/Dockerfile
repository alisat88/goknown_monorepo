# NODE IMAGE
FROM node:alpine

# PUBLISH PROJECT INSIDE CONTAINER
WORKDIR /app

# COPY PACKAGE.JSON AND YARN.LOCK to workdir
COPY package.json yarn.lock ./

# EXEC PROJECT TO DOWNLOAD DEPENDENCIES
RUN yarn install --frozen-lockfile

# COPY EVERYTHING FROM PROJECT TO ROOT
# .env.production is included here and used by CRA during build
COPY . .

# Allow overriding API URL at Docker build time via --build-arg
ARG REACT_APP_PRODUCTION_API
ARG REACT_APP_ENVIRONMENT
ENV REACT_APP_PRODUCTION_API=${REACT_APP_PRODUCTION_API}
ENV REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT}

# build project
RUN yarn build

# port to listen
EXPOSE 3000

# COMMAND TO EXECUTE
CMD ["yarn", "start"] 
