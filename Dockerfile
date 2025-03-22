# Build stage
FROM node:22.12-alpine AS builder

# Install only necessary build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-virtualenv

WORKDIR /app

# Copy dependency files
COPY package*.json requirements.txt ./

COPY .env ./

# Install Node.js dependencies with caching
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --omit-dev

# Setup Python environment and install dependencies
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"
RUN --mount=type=cache,target=/root/.cache/pip \
    pip3 install --no-cache-dir -r requirements.txt

# Set build-time environment variables
ENV NODE_ENV=production

# Copy source and build
COPY . .
RUN npm run build

# Release stage
FROM node:22-alpine AS release

# Install runtime dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/requirements.txt /app/
COPY --from=builder /app/venv /app/venv
COPY --from=builder /app/.env /app/.env

# Set runtime environment variables
ENV PATH="/app/venv/bin:$PATH" \
    NODE_ENV=production

# Install production dependencies
RUN npm ci --omit=dev

# Set executable permissions
RUN chmod +x /app/dist/index.js

# Set production environment
ENV NODE_ENV=production

# Set the user to non-root for security
USER node

# Create startup script
ENTRYPOINT ["node", "/app/dist/index.js"]