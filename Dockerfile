# Use the official Node.js image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Install system dependencies for bcrypt and Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire codebase
COPY . .

# Expose the backend port
EXPOSE 3000

# Switch to non-root user for better security
USER node

# Default command (will be overridden by docker-compose)
CMD ["npm", "run", "dev"]
