# Configuration Guide

This guide explains how to configure the OSM Tagging Schema MCP Server for different MCP clients and use cases.

## Table of Contents

- [MCP Client Configuration](#mcp-client-configuration)
  - [Claude Code CLI](#claude-code-cli)
  - [Claude Desktop](#claude-desktop)
  - [Custom MCP Clients](#custom-mcp-clients)
- [Server Configuration](#server-configuration)
- [Advanced Configuration](#advanced-configuration)
- [Environment Variables](#environment-variables)
- [Performance Tuning](#performance-tuning)

## MCP Client Configuration

### Claude Code CLI

**Quick Setup (Recommended):**
```bash
# Automatic configuration
claude mcp add @gander-tools/osm-tagging-schema-mcp
```

This command automatically adds the server to your Claude Code CLI configuration.

**Manual Configuration:**

1. Locate the configuration file:
   ```bash
   ~/.config/claude-code/config.json
   ```

2. Add server configuration:
   ```json
   {
     "mcpServers": {
       "osm-tagging": {
         "command": "npx",
         "args": ["@gander-tools/osm-tagging-schema-mcp"]
       }
     }
   }
   ```

3. Restart Claude Code CLI

**Verification:**
```bash
# Start Claude Code and ask:
# "What tools are available from the osm-tagging server?"
```

### Claude Desktop

Claude Desktop supports MCP servers through its configuration file.

**Configuration File Locations:**

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Configuration:**

1. Create or edit the configuration file
2. Add server configuration:

**Using npx:**
```json
{
  "mcpServers": {
    "osm-tagging": {
      "command": "npx",
      "args": ["@gander-tools/osm-tagging-schema-mcp"]
    }
  }
}
```

**Using Docker:**
```json
{
  "mcpServers": {
    "osm-tagging": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "ghcr.io/gander-tools/osm-tagging-schema-mcp:latest"
      ]
    }
  }
}
```

For development/testing with bleeding edge features, use `:edge` instead of `:latest`.

**Using local installation:**
```json
{
  "mcpServers": {
    "osm-tagging": {
      "command": "node",
      "args": ["/absolute/path/to/osm-tagging-schema-mcp/dist/index.js"],
      "cwd": "/absolute/path/to/osm-tagging-schema-mcp"
    }
  }
}
```

3. Restart Claude Desktop

### Custom MCP Clients

For custom MCP client implementations:

**Stdio Transport (Standard):**
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["@gander-tools/osm-tagging-schema-mcp"],
});

const client = new Client({
  name: "my-client",
  version: "1.0.0",
}, {
  capabilities: {},
});

await client.connect(transport);
```

**Using the client:**
```typescript
// List available tools
const tools = await client.listTools();
console.log("Available tools:", tools.tools.map(t => t.name));

// Call a tool
const response = await client.callTool({
  name: "get_tag_values",
  arguments: {
    tagKey: "amenity"
  }
});

console.log("Result:", response.content);
```

## Server Configuration

The server currently uses default configuration optimized for most use cases.

### Default Settings

```json
{
  "server": {
    "name": "osm-tagging-schema",
    "version": "0.1.0"
  },
  "schema": {
    "enableIndexing": true,
    "cacheTTL": 3600000
  }
}
```

### Configuration Options

While the server doesn't currently expose a configuration file, these internal settings can be modified in the source code if needed:

**Schema Loader Options:**
- `enableIndexing`: Enable fast tag lookups (default: `true`)
- `cacheTTL`: Cache time-to-live in milliseconds (default: `3600000` = 1 hour)

**To modify** (for development/advanced use):

1. Clone the repository
2. Edit `src/index.ts`:
   ```typescript
   const schemaLoader = new SchemaLoader({
     enableIndexing: true,
     cacheTTL: 7200000  // 2 hours
   });
   ```
3. Rebuild and use from source

## Advanced Configuration

### Multiple Instances

Run multiple instances with different names:

```json
{
  "mcpServers": {
    "osm-tagging-primary": {
      "command": "npx",
      "args": ["@gander-tools/osm-tagging-schema-mcp"]
    },
    "osm-tagging-backup": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "ghcr.io/gander-tools/osm-tagging-schema-mcp:latest"
      ]
    }
  }
}
```

### Docker Advanced Configuration

**Custom network:**
```bash
docker network create mcp-network
docker run -i --rm --network mcp-network ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
```

**Resource limits:**
```bash
docker run -i --rm \
  --memory="512m" \
  --cpus="1.0" \
  ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
```

**Volume mounting** (for development):
```bash
docker run -i --rm \
  -v $(pwd):/app \
  -w /app \
  node:24-alpine \
  npx tsx src/index.ts
```

### Docker Container

For production deployments with Docker, see the [Deployment Guide](../deployment/deployment.md).

**Quick example:**

```bash
docker run -d \
  --name osm-tagging-mcp \
  --restart unless-stopped \
  -p 3000:3000 \
  -e TRANSPORT=http \
  -e PORT=3000 \
  -e LOG_LEVEL=info \
  --health-cmd='node -e "require(\"http\").get(\"http://localhost:3000/health\", (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on(\"error\", () => process.exit(1))"' \
  --health-interval=30s \
  --health-timeout=10s \
  --health-start-period=10s \
  --health-retries=3 \
  ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
```

**Verify:**
```bash
# Check health
curl http://localhost:3000/health

# Check readiness
curl http://localhost:3000/ready
```

For complete deployment documentation including production configuration, health checks, monitoring, and troubleshooting, see the [Deployment Guide](../deployment/deployment.md).

## Environment Variables

The server supports the following environment variables for configuration:

### Transport Configuration

**`TRANSPORT`** - Select transport protocol (default: `stdio`)
- `stdio`: Standard input/output (default, for MCP clients like Claude Code/Desktop)
- `http`: HTTP Streamable transport (for web applications and HTTP clients)
  - Automatically sends keep-alive ping messages every 15 seconds to prevent connection timeouts
  - Suitable for deployment behind proxies, load balancers, and firewalls

**`PORT`** - HTTP server port when using HTTP transport (default: `3000`)

**`HOST`** - HTTP server host when using HTTP transport (default: `0.0.0.0`)

**Examples:**

```bash
# Run with stdio (default)
npx @gander-tools/osm-tagging-schema-mcp

# Run with HTTP transport
TRANSPORT=http npx @gander-tools/osm-tagging-schema-mcp

# Run with HTTP on custom port and host
TRANSPORT=http PORT=8080 HOST=127.0.0.1 npx @gander-tools/osm-tagging-schema-mcp
```

**Using with npm scripts:**
```bash
npm run start:http      # Start with HTTP transport (port 3000)
npm run dev:http        # Development mode with HTTP transport
```

**Docker with HTTP transport:**
```bash
# Using latest stable
docker run -e TRANSPORT=http -e PORT=3000 -p 3000:3000 \
  ghcr.io/gander-tools/osm-tagging-schema-mcp:latest

# Using edge (development)
docker run -e TRANSPORT=http -e PORT=3000 -p 3000:3000 \
  ghcr.io/gander-tools/osm-tagging-schema-mcp:edge
```

### Logging Configuration

**`LOG_LEVEL`** - Set logging verbosity (default: `info`)
- `debug`: Verbose logging
- `info`: Standard logging
- `warn`: Warnings only
- `error`: Errors only

```bash
LOG_LEVEL=debug npx @gander-tools/osm-tagging-schema-mcp
```

### CORS Configuration

**`CORS_ORIGINS`** - Configure allowed origins for HTTP transport (default: `http://localhost:6274,https://mcp.ziziyi.com`)

When using HTTP transport, the server supports CORS (Cross-Origin Resource Sharing) to allow web browsers and HTTP clients to connect. By default, the server allows connections from:
- `http://localhost:6274` - MCP Inspector UI
- `https://mcp.ziziyi.com` - Web-based MCP Inspector

**Custom CORS origins:**
```bash
# Allow custom origins
CORS_ORIGINS="http://example.com,https://example.org" TRANSPORT=http npm start

# Allow all origins (NOT recommended for production)
CORS_ORIGINS="*" TRANSPORT=http npm start
```

**Testing with MCP Inspector:**

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is an official tool for testing and debugging MCP servers.

**Start server with HTTP transport:**
```bash
# Using npm script
npm run start:http

# Or manually
TRANSPORT=http PORT=3000 npm start
```

**Connect using MCP Inspector:**
```bash
# Launch Inspector with HTTP transport
npx @modelcontextprotocol/inspector --transport http --server-url http://localhost:3000/
```

**Connection type:** The Inspector uses a proxy connection to bridge browser-based UI with the HTTP server.

**Verify connection:**
1. Inspector UI opens in browser (default: http://localhost:6274)
2. Click "Connect" button
3. Server tools should appear in the UI

**Common CORS issues:**
- **Error: "Connection failed"** → Check CORS_ORIGINS includes `http://localhost:6274`
- **Error: "Network error"** → Ensure server is running on correct port
- **Error: "Origin not allowed"** → Add your origin to CORS_ORIGINS

### Node.js Configuration

**For development**, you can also use standard Node.js environment variables:

```bash
# Set Node.js options
NODE_OPTIONS="--max-old-space-size=512" npx @gander-tools/osm-tagging-schema-mcp

# Combine with transport configuration
TRANSPORT=http PORT=3000 NODE_OPTIONS="--max-old-space-size=512" \
DEBUG="mcp:*" npx @gander-tools/osm-tagging-schema-mcp
```

## Performance Tuning

### Memory Usage

Default memory usage is moderate and efficient.

**Increase memory limit** (if needed):
```bash
# Using Node.js
NODE_OPTIONS="--max-old-space-size=1024" npx @gander-tools/osm-tagging-schema-mcp

# Using Docker
docker run -i --rm --memory="1g" ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
```

### Cache Settings

The schema loader uses an in-memory cache with 1-hour TTL by default.

**For production use**, consider:
- Keeping default 1-hour cache for balance between freshness and performance
- Increasing cache TTL for better performance (requires source code modification)
- Decreasing cache TTL for more frequent schema updates (requires source code modification)

### Indexing

Tag indexing is enabled by default for fast lookups.

**Benefits:**
- Faster tag queries
- Improved preset search performance
- Better related tags discovery

**Trade-offs:**
- Higher initial memory usage
- Slightly longer startup time

**To disable** (not recommended):
Requires source code modification in `src/index.ts`:
```typescript
const schemaLoader = new SchemaLoader({
  enableIndexing: false
});
```

## Verification

After configuration, verify the server is working:

**Test with a simple query:**
```bash
# Depends on your MCP client
# In Claude Code CLI or Claude Desktop, ask:
# "List all available OSM tags for restaurants"
```

**Check server is responding:**
```bash
# Using echo and pipe (stdio transport)
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | npx @gander-tools/osm-tagging-schema-mcp
```

**Expected:** JSON response with tools listed

## Troubleshooting Configuration

### Server Not Found

**Symptom:** "Server 'osm-tagging' not found"

**Solutions:**
1. Verify configuration file path
2. Check JSON syntax (use a JSON validator)
3. Ensure server name matches in client
4. Restart MCP client

### Permission Errors

**Symptom:** "EACCES: permission denied"

**Solutions:**
1. Don't use `sudo` with npm/npx
2. Fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors
3. For Docker, ensure user is in docker group: `sudo usermod -aG docker $USER`

### Connection Timeout

**Symptom:** "Connection timeout"

**Solutions:**
1. Increase timeout in client configuration (if supported)
2. Check system resources (memory, CPU)
3. Try Docker instead of npx or vice versa
4. Check for conflicting software (antivirus, firewall)

### Tools Not Available

**Symptom:** "Tool 'get_tag_values' not found"

**Solutions:**
1. Verify server version: `npx @gander-tools/osm-tagging-schema-mcp --version`
2. Clear npx cache: `npm cache clean --force`
3. Check server logs for errors
4. Try reinstalling

## Next Steps

- [Deployment Guide](../deployment/deployment.md) - Production deployment with Docker
- [Usage Guide](./usage.md) - Learn how to use the tools
- [API Documentation](../api/README.md) - Detailed tool reference
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

## Getting Help

- **Issues**: Report configuration problems on [GitHub Issues](https://github.com/gander-tools/osm-tagging-schema-mcp/issues)
- **Documentation**: See [README.md](../../README.md)
- **Community**: Join discussions on [GitHub Discussions](https://github.com/gander-tools/osm-tagging-schema-mcp/discussions)
