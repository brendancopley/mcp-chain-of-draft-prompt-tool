# Use the official Node.js image as the base image
FROM node:22.12-alpine AS builder

# Install Python 3, pip and build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-virtualenv \
    gcc \
    python3-dev \
    musl-dev \
    linux-headers

# Copy package files first
COPY package*.json ./

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm npm install

RUN --mount=type=cache,target=/root/.npm-production npm ci --ignore-scripts --omit-dev

# Set up Python virtual environment and install requirements
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"
COPY requirements.txt ./
RUN . /app/venv/bin/activate && pip3 install --no-cache-dir -r requirements.txt

FROM node:22-alpine AS release

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

ENV NODE_ENV=production \
    LLM_PROVIDER=anthropic \
    LLM_MODEL=claude-3-7-sonnet-latest \
    ANTHROPIC_BASE_URL=https://api.anthropic.com \
    OPENAI_BASE_URL=https://api.openai.com \
    OLLAMA_BASE_URL=http://localhost:11434 \
    COD_DB_URL=sqlite:///cod_analytics.db \
    COD_EXAMPLES_DB=cod_examples.db \
    COD_DEFAULT_MODEL=claude-3-7-sonnet-latest \
    COD_MAX_TOKENS=500 \
    COD_MAX_WORDS_PER_STEP=8

    # Copy environment files
COPY .env .env
# We'll copy the actual .env file at runtime or use environment variables

# Copy the rest of the application
COPY . .

WORKDIR /app

# Build TypeScript files
RUN npm run build

# Command to run the server with virtual environment
CMD ["/bin/sh", "-c", "cd /app && source /app/venv/bin/activate"]

ENTRYPOINT ["node", "dist/index.js"]