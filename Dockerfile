# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Define build argument and set as environment variable
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including dev dependencies in production build)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application for production
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
# CMD ["sh", "-c", "redis-server --daemonize yes && npm run dev"]
