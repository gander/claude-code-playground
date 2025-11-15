# Deployment Guide

This guide covers deploying the OSM Tagging Schema MCP Server in production environments using Docker Compose.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Production Deployment](#production-deployment)
- [Configuration Options](#configuration-options)
- [Health Checks](#health-checks)
- [Monitoring](#monitoring)
- [Scaling](#scaling)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Overview

The OSM Tagging Schema MCP Server can be deployed as:

1. **Standalone Docker Container** - Single container deployment
2. **Docker Compose** - Orchestrated deployment with networking and resource management
3. **Kubernetes** - Scalable, production-grade orchestration (future)

This guide focuses on Docker Compose deployment, which is recommended for production environments.

## Prerequisites

**Required:**
- Docker Engine 20.10+
- Docker Compose V2 (or docker-compose 1.29+)
- Linux, macOS, or Windows with WSL2

**Recommended:**
- 512MB RAM minimum (1GB recommended)
- 1 CPU core minimum (2 cores recommended)
- 500MB disk space

**Network Requirements:**
- Port 3000 available (or custom port)
- Outbound internet access (for schema updates)

## Quick Start

### 1. Download Docker Compose Configuration

```bash
# Production configuration
curl -O https://raw.githubusercontent.com/gander-tools/osm-tagging-schema-mcp/main/docker-compose.yml

# Or for development
curl -O https://raw.githubusercontent.com/gander-tools/osm-tagging-schema-mcp/main/docker-compose.dev.yml
```

### 2. Start the Service

```bash
# Production
docker compose up -d

# Development
docker compose -f docker-compose.dev.yml up -d
```

### 3. Verify Health

```bash
# Check container status
docker compose ps

# Check health endpoint
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "osm-tagging-schema-mcp",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Check Readiness

```bash
# Check if schema is loaded and ready
curl http://localhost:3000/ready
```

**Expected response:**
```json
{
  "status": "ready",
  "service": "osm-tagging-schema-mcp",
  "schema": {
    "presets": 1707,
    "fields": 799,
    "categories": 14,
    "version": "6.7.3"
  },
  "timestamp": "2024-01-15T10:30:05.000Z"
}
```

## Production Deployment

### Docker Compose Configuration

The production `docker-compose.yml` includes:

- **HTTP Transport**: Server exposed on port 3000
- **Health Checks**: Automated health monitoring
- **Resource Limits**: Memory and CPU constraints
- **Restart Policy**: Automatic restart on failure
- **Security**: Read-only filesystem, no new privileges
- **Networking**: Isolated bridge network

### Deployment Steps

1. **Create deployment directory:**
   ```bash
   mkdir -p /opt/osm-tagging-mcp
   cd /opt/osm-tagging-mcp
   ```

2. **Download configuration:**
   ```bash
   curl -O https://raw.githubusercontent.com/gander-tools/osm-tagging-schema-mcp/main/docker-compose.yml
   ```

3. **Customize configuration** (optional):
   ```bash
   # Edit environment variables, ports, resource limits
   nano docker-compose.yml
   ```

4. **Start service:**
   ```bash
   docker compose up -d
   ```

5. **Verify deployment:**
   ```bash
   # Check logs
   docker compose logs -f osm-tagging-mcp

   # Check health
   curl http://localhost:3000/health
   curl http://localhost:3000/ready
   ```

6. **Enable on system startup:**
   ```bash
   # Docker Compose services restart automatically with restart: unless-stopped
   # Ensure Docker service starts on boot:
   sudo systemctl enable docker
   ```

### Production Checklist

- [ ] Resource limits configured appropriately
- [ ] Health checks responding correctly
- [ ] Logs being captured (Docker logs or log aggregation)
- [ ] Monitoring in place (see [Monitoring](#monitoring))
- [ ] Backups not needed (stateless service)
- [ ] Network security configured (firewall, reverse proxy)
- [ ] SSL/TLS configured (if exposing publicly)

## Configuration Options

### Environment Variables

Edit the `environment` section in `docker-compose.yml`:

```yaml
environment:
  # Transport protocol
  TRANSPORT: http        # Options: stdio, http, sse

  # HTTP server configuration
  PORT: 3000             # HTTP port (default: 3000)
  HOST: 0.0.0.0          # Bind address (default: 0.0.0.0)

  # Logging
  LOG_LEVEL: info        # Options: debug, info, warn, error

  # Node.js
  NODE_ENV: production   # Options: production, development
```

### Port Mapping

Change the host port (left side) while keeping container port (right side):

```yaml
ports:
  - "8080:3000"  # Expose on host port 8080
```

### Resource Limits

Adjust based on your workload:

```yaml
deploy:
  resources:
    limits:
      memory: 1G          # Maximum memory
      cpus: '2.0'         # Maximum CPU cores
    reservations:
      memory: 512M        # Reserved memory
      cpus: '1.0'         # Reserved CPU cores
```

**Guidelines:**
- **Minimum**: 256MB RAM, 0.5 CPU cores
- **Recommended**: 512MB RAM, 1 CPU core
- **Heavy load**: 1GB RAM, 2 CPU cores

### Network Configuration

**Bridge Network (default):**
```yaml
networks:
  mcp-network:
    driver: bridge
```

**Custom Network:**
```yaml
networks:
  mcp-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

**Host Network** (not recommended for security):
```yaml
network_mode: host
```

## Health Checks

The server provides two health check endpoints:

### Liveness Probe - `/health`

**Purpose**: Check if the server is running

**Usage:**
```bash
curl http://localhost:3000/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "osm-tagging-schema-mcp",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Use cases:**
- Docker health checks
- Load balancer health checks
- Monitoring alerts

### Readiness Probe - `/ready`

**Purpose**: Check if the server is ready to handle requests (schema loaded)

**Usage:**
```bash
curl http://localhost:3000/ready
```

**Response (200 OK):**
```json
{
  "status": "ready",
  "service": "osm-tagging-schema-mcp",
  "schema": {
    "presets": 1707,
    "fields": 799,
    "categories": 14,
    "version": "6.7.3"
  },
  "timestamp": "2024-01-15T10:30:05.000Z"
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "not_ready",
  "error": "Schema not loaded",
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

**Use cases:**
- Kubernetes readiness probes
- Load balancer backend health
- Deployment verification

### Docker Health Check

Health check is configured in `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
  interval: 30s
  timeout: 10s
  start_period: 10s
  retries: 3
```

**Check health status:**
```bash
docker compose ps
# Look for "healthy" status

docker inspect osm-tagging-mcp --format='{{.State.Health.Status}}'
# Output: healthy
```

## Monitoring

### Basic Monitoring

**View logs:**
```bash
# Follow logs
docker compose logs -f osm-tagging-mcp

# View last 100 lines
docker compose logs --tail=100 osm-tagging-mcp

# View logs with timestamps
docker compose logs -t osm-tagging-mcp
```

**Container stats:**
```bash
# Real-time stats
docker stats osm-tagging-mcp

# One-time stats
docker stats --no-stream osm-tagging-mcp
```

**Health status:**
```bash
# Check health endpoint
watch -n 5 curl -s http://localhost:3000/health | jq

# Check readiness endpoint
watch -n 5 curl -s http://localhost:3000/ready | jq
```

### Advanced Monitoring

**Prometheus Metrics** (future feature):
- Endpoint: `/metrics` (planned)
- Metrics: request count, latency, schema stats

**Log Aggregation:**

Use Docker logging drivers:

```yaml
services:
  osm-tagging-mcp:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Or external logging:

```yaml
services:
  osm-tagging-mcp:
    logging:
      driver: "syslog"
      options:
        syslog-address: "tcp://192.168.0.42:514"
```

## Scaling

### Vertical Scaling

Increase resources for a single instance:

```yaml
deploy:
  resources:
    limits:
      memory: 2G
      cpus: '4.0'
```

### Horizontal Scaling

Run multiple instances behind a load balancer:

```yaml
services:
  osm-tagging-mcp-1:
    image: ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
    ports:
      - "3001:3000"
    # ... rest of config

  osm-tagging-mcp-2:
    image: ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
    ports:
      - "3002:3000"
    # ... rest of config

  # Add load balancer (nginx, HAProxy, Traefik, etc.)
```

**Notes:**
- Server is stateless - scales horizontally easily
- Each instance loads schema independently
- No shared state between instances

## Security

### Container Security

The Docker Compose configuration includes security best practices:

1. **No new privileges:**
   ```yaml
   security_opt:
     - no-new-privileges:true
   ```

2. **Read-only filesystem:**
   ```yaml
   read_only: true
   tmpfs:
     - /tmp
   ```

3. **Non-root user** (configured in Dockerfile)

4. **Isolated network:**
   ```yaml
   networks:
     - mcp-network
   ```

### Network Security

**Firewall Configuration:**

```bash
# Allow only specific IPs (example)
sudo ufw allow from 192.168.1.0/24 to any port 3000
sudo ufw deny 3000
```

**Reverse Proxy** (nginx example):

```nginx
server {
    listen 80;
    server_name osm-mcp.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check endpoint (allow public access)
    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
```

**TLS/SSL** (nginx with Let's Encrypt):

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d osm-mcp.example.com
```

### Image Verification

Verify Docker images are signed and authentic:

```bash
# Verify image signature with cosign
cosign verify ghcr.io/gander-tools/osm-tagging-schema-mcp:latest \
  --certificate-identity-regexp=https://github.com/gander-tools \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com

# Check for vulnerabilities
docker scan ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
```

See [Security Documentation](./security.md) for more details.

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker compose logs osm-tagging-mcp
```

**Common issues:**
- Port 3000 already in use → Change port mapping
- Insufficient resources → Increase limits
- Image pull failure → Check network/registry access

### Health Check Failing

**Check health endpoint directly:**
```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

**Common issues:**
- Schema not loaded → Check logs for errors
- Network connectivity → Check firewall rules
- Container resources → Increase memory limit

### High Memory Usage

**Check current usage:**
```bash
docker stats osm-tagging-mcp
```

**Solutions:**
- Normal usage: 100-200MB (schema loaded)
- High usage: >500MB → Check for memory leaks in logs
- OOM killed: Increase memory limit

### Slow Performance

**Check resource utilization:**
```bash
docker stats osm-tagging-mcp
```

**Solutions:**
- CPU throttling → Increase CPU limits
- Memory pressure → Increase memory limits
- Schema loading delay → Normal on first request (cache warmup)

### Network Issues

**Test connectivity:**
```bash
# From host
curl http://localhost:3000/health

# From another container
docker run --rm --network osm-tagging-schema-mcp_mcp-network \
  curlimages/curl:latest curl http://osm-tagging-mcp:3000/health
```

**Common issues:**
- Port not exposed → Check ports section
- Network isolation → Check network configuration
- Firewall blocking → Check firewall rules

### Logs Not Appearing

**Check Docker logging driver:**
```bash
docker inspect osm-tagging-mcp --format='{{.HostConfig.LogConfig.Type}}'
```

**View logs:**
```bash
docker compose logs osm-tagging-mcp
```

**Increase log verbosity:**
```yaml
environment:
  LOG_LEVEL: debug
```

## Best Practices

1. **Use stable versions in production**: Use specific version tags (e.g., `0.2.1`) or stable tags (`:latest`, `:0.2`), not `:edge`
2. **Set resource limits** to prevent resource exhaustion
3. **Enable health checks** for automatic recovery
4. **Monitor logs** for errors and warnings
5. **Use TLS/SSL** if exposing publicly
6. **Keep images updated** for security patches
7. **Test updates** in staging before production
8. **Back up configuration** (docker-compose.yml)
9. **Document changes** to configuration

### Container Version Selection

Choose the appropriate Docker image tag based on your use case:

| Environment | Recommended Tag | Example | Update Frequency |
|-------------|----------------|---------|------------------|
| Production (stable) | Specific version | `0.2.1` | Manual (controlled) |
| Production (auto-update minor) | Minor version | `0.2` | Automatic (minor patches) |
| Production (auto-update major) | Major version | `0` | Automatic (all updates) |
| Production (latest stable) | `latest` | `latest` | Automatic (stable releases) |
| Development/Testing | `edge` | `edge` | Automatic (bleeding edge) |

**Note:** For production deployments, specific version tags (`0.2.1`) are recommended for maximum control and predictability.

## Next Steps

- [Configuration Guide](./configuration.md) - Detailed configuration options
- [API Documentation](./api/) - Tool reference
- [Security Guide](./security.md) - Security best practices
- [Troubleshooting](./troubleshooting.md) - Common issues

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/gander-tools/osm-tagging-schema-mcp/issues)
- **Documentation**: [README.md](../README.md)
- **Discussions**: [GitHub Discussions](https://github.com/gander-tools/osm-tagging-schema-mcp/discussions)
