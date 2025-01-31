# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install --production=false

# Copy the rest and build
COPY . .
RUN npm run build

# Stage 2: Production runtime image
FROM node:18-alpine

# Install Redis in the final image
RUN apk add --no-cache redis

# Set the working directory
WORKDIR /app

# Define build argument and set as environment variable
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Copy only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the application port (if applicable)
EXPOSE 8000

# Start Redis and the Node.js application
CMD ["sh", "-c", "redis-server --daemonize yes && npm run start"]