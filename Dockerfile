# Stage 1: Build the application (only for production)
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install --production=false

# Copy the rest and build
COPY . .
RUN npm run build

# Stage 2: Runtime image
FROM node:18-alpine

# Install Redis in the final image
RUN apk add --no-cache redis

# Set the working directory
WORKDIR /app

# Define build argument and set as environment variable
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Copy package files
COPY package*.json ./

# Install dependencies based on environment
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm install --production; \
    else \
      npm install; \
    fi

# Copy the built application from the builder stage (for production)
COPY --from=builder /app/dist ./dist

# Copy source files for development mode
COPY . .

# Expose the application port
EXPOSE 8000

# Start Redis and the Node.js application
# In development, npm run dev will use ts-node with the mounted source
# In production, npm run start will use the built dist files
CMD ["sh", "-c", "redis-server --daemonize yes && if [ \"$NODE_ENV\" = \"development\" ]; then npm run dev; else npm run start; fi"]