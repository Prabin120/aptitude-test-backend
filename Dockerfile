# Use a specific version of Node.js for consistency
FROM node:18-alpine AS base

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Define build argument for NODE_ENV
ARG NODE_ENV=production

# Install dependencies based on the build argument
RUN if [ "$NODE_ENV" = "production" ]; then npm install --production; else npm install; fi

# Copy the rest of the application code
COPY . .

# Build the application if in production mode
RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi

# Set the command based on the NODE_ENV
CMD if [ "$NODE_ENV" = "production" ]; then npm run start; else npm run dev; fi