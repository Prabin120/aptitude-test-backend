# Stage 1: Install dependencies and build (build stage)
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies using npm ci
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application for production
ARG NODE_ENV=production
RUN npm run build

# Stage 2: Production runtime image
FROM node:18-alpine AS production

# Set the working directory
WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Set the environment variable
ENV NODE_ENV=production

# Command to run the application in production
CMD ["npm", "start"]

# Stage 3: Development runtime image
FROM node:18-alpine AS development

# Set the working directory
WORKDIR /app

# Copy package.json and install all dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Set the environment variable
ENV NODE_ENV=development

# Expose the application port
EXPOSE 8000

# Command to run the application in development
CMD ["npm", "run", "dev"]
