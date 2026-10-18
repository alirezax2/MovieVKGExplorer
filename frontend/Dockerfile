# ==============================================================================
# Dockerfile for Frontend (React + Bun + Vite)
# ==============================================================================
FROM oven/bun:alpine

WORKDIR /app

# Copy dependency specifications
COPY package.json bun.lock* ./

# Install dependencies using Bun
RUN bun install

# Copy application source code
COPY . .

EXPOSE 5173

# Run Vite dev server bound to all interfaces
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
