# OSS-Fuzz build Dockerfile
# This is prepared for potential future OSS-Fuzz submission
# Currently using property-based testing with fast-check

# Multi-stage build: Extract Node.js from official image
FROM node:24-bullseye AS node-source

# Base builder with pinned SHA256 for security
FROM gcr.io/oss-fuzz-base/base-builder-javascript@sha256:1a2eaf8181b35d5245cb0368c22c28d9540e9695afb609a8ac3d6f1ad3e7d85a

# Copy Node.js binaries and modules from official image
# This avoids curl | bash pattern and ensures verified Node.js installation
COPY --from=node-source /usr/local/bin/node /usr/local/bin/
COPY --from=node-source /usr/local/bin/npm /usr/local/bin/
COPY --from=node-source /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/bin/node /usr/local/bin/nodejs

# Copy project files
COPY . $SRC/osm-tagging-schema-mcp
WORKDIR $SRC/osm-tagging-schema-mcp

# Install dependencies
RUN npm ci

# Build the project
RUN npm run build
