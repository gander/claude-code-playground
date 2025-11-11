# Stage 1: Builder
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript code
RUN npm run build

# Verify build output exists
RUN test -f dist/index.js || (echo "Build failed: dist/index.js not found" && exit 1)

# Stage 2: Runtime
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S mcp && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G mcp -g mcp mcp && \
    chown -R mcp:mcp /app

# Switch to non-root user
USER mcp

# Set Node.js environment to production
ENV NODE_ENV=production

# Expose port for HTTP transport
EXPOSE 3000

# Health check - uses /health endpoint when HTTP transport is enabled
# For stdio transport, falls back to basic node check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD if [ "$TRANSPORT" = "http" ] || [ "$TRANSPORT" = "sse" ]; then \
        node -e "require('http').get('http://localhost:' + (process.env.PORT || '3000') + '/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"; \
    else \
        node -e "console.log('OK')" || exit 1; \
    fi

# Set entrypoint
ENTRYPOINT ["node", "dist/index.js"]
