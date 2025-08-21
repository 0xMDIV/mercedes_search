# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    libc6-compat \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Generate Prisma client with correct binary targets
RUN npx prisma generate

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies including OpenSSL for Prisma
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    openssl \
    openssl-dev \
    libc6-compat \
    curl \
    wget

# Tell Puppeteer to skip installing Chromium. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Prisma environment variables
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl,linux-musl-openssl-3.0.x" \
    PRISMA_CLIENT_ENGINE_TYPE="library"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy other necessary files
COPY public ./public
COPY scripts/startup.sh /usr/local/bin/startup.sh

# Create uploads and data directories
RUN mkdir -p uploads data

# Make startup script executable
RUN chmod +x /usr/local/bin/startup.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mercedes -u 1001 && \
    chown -R mercedes:nodejs /app && \
    chmod 755 /app/data

USER mercedes

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/vehicles || exit 1

# Start the application
CMD ["/usr/local/bin/startup.sh"]