# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.13.1

###########################
# Build Stage
###########################
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /app

# Install dependencies (all for build)
COPY --link package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the source code
COPY --link . .

# Build TypeScript
RUN npm run build

###########################
# Production Stage
###########################
FROM node:${NODE_VERSION}-slim AS final
WORKDIR /app

# Create non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Expose the application port
EXPOSE 8080

# Use non-root user
USER appuser

# Start the application
CMD ["npm", "start"]
