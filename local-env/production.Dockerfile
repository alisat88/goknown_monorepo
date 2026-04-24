# Build stage for frontend
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy frontend source code
COPY frontend/ .

# Build frontend
RUN yarn build

# Build stage for backend
FROM node:18-alpine AS backend-builder

# Set working directory
WORKDIR /app/backend

# Copy backend package files
COPY backend/package.json backend/yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy backend source code
COPY backend/ .

# Build backend
RUN yarn build

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy environment files and merge them
COPY local-env/backend.env .env
COPY local-env/frontend.env .env.frontend
RUN echo "" >> .env && cat .env.frontend >> .env && rm .env.frontend

# Copy built frontend
COPY --from=frontend-builder /app/frontend/build ./public

# Copy backend files
COPY --from=backend-builder /app/backend/package.json ./
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/ormconfig.js ./

# Install only production dependencies
RUN cd /app && yarn install --production

# Expose ports
EXPOSE 3333 3000

# Start command
CMD ["yarn", "start"] 