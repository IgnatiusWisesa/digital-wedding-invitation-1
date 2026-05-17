# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY apps/api/package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY apps/api/ ./

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY apps/api/package*.json ./

# Install production dependencies only
RUN npm install --omit=dev --legacy-peer-deps

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "run", "start:prod"]
