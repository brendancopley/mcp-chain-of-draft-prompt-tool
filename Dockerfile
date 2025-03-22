FROM node:22.12-alpine AS builder

RUN apk add --no-cache \
    gcc \
    linux-headers \
    musl-dev \
    py3-pip \
    py3-virtualenv \
    python3 \
    python3-dev

WORKDIR /app

COPY package*.json ./

# Note: Copying .env file - WARNING: Not recommended for production use
COPY .env ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --omit-dev

RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    . /app/venv/bin/activate && pip3 install --no-cache-dir -r requirements.txt

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

COPY . .

RUN npm run build

FROM node:22-alpine AS release

RUN apk add --no-cache \
    py3-pip \
    py3-virtualenv \
    python3

WORKDIR /app

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/requirements.txt /app/
COPY --from=builder /app/venv /app/venv
COPY --from=builder /app/.env /app/.env

ENV PATH="/app/venv/bin:$PATH" \
    NODE_ENV=production \
    LLM_PROVIDER=anthropic \
    LLM_MODEL=claude-3-7-sonnet-latest

# Install production npm dependencies
RUN npm ci --omit=dev

RUN printf '#!/bin/sh\nsource /app/venv/bin/activate\nexec node /app/dist/index.js\n' > /app/start.sh && \
    chmod +x /app/start.sh

ENTRYPOINT ["/app/start.sh"]