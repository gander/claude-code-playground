# MCP Inspector Guide

This guide covers how to inspect and test the OSM Tagging Schema MCP Server using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), an official debugging and testing tool for MCP servers.

## Table of Contents

- [What is MCP Inspector?](#what-is-mcp-inspector)
- [When to Use the Inspector](#when-to-use-the-inspector)
- [Inspection Methods](#inspection-methods)
  - [Method 1: NPX Server (STDIO)](#method-1-npx-server-stdio)
  - [Method 2: Docker Server (STDIO)](#method-2-docker-server-stdio)
  - [Method 3: Docker HTTP Server](#method-3-docker-http-server)
  - [Method 4: NPX HTTP Server](#method-4-npx-http-server)
- [Inspector Features](#inspector-features)
- [Troubleshooting](#troubleshooting)

## What is MCP Inspector?

The MCP Inspector is an interactive web-based tool for:

- **Testing MCP Servers**: Verify tools are registered correctly
- **Interactive Tool Calls**: Execute tools with custom parameters
- **Protocol Debugging**: Inspect MCP protocol messages
- **Response Validation**: Verify tool responses match expected schemas
- **Development Testing**: Test local changes before deployment

The Inspector provides a web UI that connects to your MCP server and allows you to interact with all registered tools.

## When to Use the Inspector

Use the MCP Inspector when you need to:

- **Verify Server Functionality**: Ensure all tools are registered and working
- **Test Tool Parameters**: Experiment with different input values
- **Debug Tool Responses**: Inspect exact JSON responses
- **Validate Changes**: Test local modifications before committing
- **Reproduce Issues**: Debug reported problems in isolation
- **Learn the API**: Explore available tools and their parameters

## Inspection Methods

The MCP server supports two transport modes:

- **STDIO (Standard Input/Output)**: Default mode for CLI integration
- **HTTP**: Network-based mode for web applications and remote access

### Method 1: NPX Server (STDIO)

**Use Case**: Quick testing of published package without installation

**Command**:
```bash
npx @modelcontextprotocol/inspector npx @gander-tools/osm-tagging-schema-mcp
```

**What Happens**:
1. Inspector downloads and runs the MCP Inspector web UI
2. Inspector launches the server using `npx` (stdio transport)
3. Browser opens to `http://localhost:5173` (or similar)
4. Inspector connects to the server via stdio pipes

**Advantages**:
- ✅ No installation required
- ✅ Tests published package (what users get)
- ✅ Simple one-command setup

**Disadvantages**:
- ❌ Tests npm package, not local changes
- ❌ Slower startup (downloads on first run)

**When to Use**:
- Verifying published package works correctly
- Reproducing user-reported issues
- Quick sanity checks

---

### Method 2: Docker Server (STDIO)

**Use Case**: Testing Docker image without running a persistent container

**Command**:
```bash
npx @modelcontextprotocol/inspector docker run --rm -i ghcr.io/gander-tools/osm-tagging-schema-mcp
```

**What Happens**:
1. Inspector launches the MCP Inspector web UI
2. Inspector starts Docker container in interactive mode (`-i`)
3. Container runs with stdio transport (default)
4. Container is removed after inspection (`--rm`)

**Advantages**:
- ✅ Tests production Docker image
- ✅ No persistent container (auto-cleanup)
- ✅ Verifies multi-platform Docker builds

**Disadvantages**:
- ❌ Requires Docker installed
- ❌ Tests released image, not local changes
- ❌ Slower startup (image download)

**When to Use**:
- Verifying Docker deployment works
- Testing multi-architecture images
- Reproducing container-specific issues

---

### Method 3: Docker HTTP Server

**Use Case**: Testing HTTP transport mode with persistent container

**Step 1**: Start Docker container in HTTP mode

```bash
docker run -d \
  --name osm-tagging \
  -p 3000:3000 \
  -e TRANSPORT=http \
  -e LOG_LEVEL=debug \
  ghcr.io/gander-tools/osm-tagging-schema-mcp
```

**Step 2**: Connect Inspector to HTTP server

```bash
npx @modelcontextprotocol/inspector --transport http --server-url http://localhost:3000
```

**What Happens**:
1. Docker container starts in detached mode (`-d`)
2. Server runs on port 3000 with HTTP transport
3. Inspector connects to HTTP endpoint
4. Container continues running after inspector closes

**Cleanup**:
```bash
# Stop and remove container
docker stop osm-tagging
docker rm osm-tagging
```

**Advantages**:
- ✅ Tests HTTP transport (production deployment mode)
- ✅ Tests health check endpoints
- ✅ Persistent container for multiple inspections
- ✅ Can test with real web clients

**Disadvantages**:
- ❌ Requires manual container management
- ❌ Port conflicts if 3000 is in use
- ❌ More complex setup

**When to Use**:
- Testing production HTTP deployment
- Debugging HTTP-specific issues
- Verifying health check endpoints
- Testing with multiple concurrent connections

**Environment Variables**:
- `TRANSPORT=http` - Enable HTTP transport mode
- `LOG_LEVEL=debug` - Enable debug logging (useful for troubleshooting)

---

### Method 4: NPX HTTP Server

**Use Case**: Testing local changes with HTTP transport

**Step 1**: Start server in HTTP mode

```bash
TRANSPORT=http npx @gander-tools/osm-tagging-schema-mcp
```

**Step 2**: Connect Inspector (in another terminal)

```bash
npx @modelcontextprotocol/inspector --transport http --server-url http://localhost:3000
```

**What Happens**:
1. Server starts with HTTP transport on port 3000
2. Inspector connects to HTTP endpoint
3. Server continues running until stopped (Ctrl+C)

**Advantages**:
- ✅ No Docker required
- ✅ Simpler HTTP testing than Docker
- ✅ Easy to restart server with changes

**Disadvantages**:
- ❌ Requires Node.js installed
- ❌ Tests npm package, not local source code
- ❌ Requires managing two terminal windows

**When to Use**:
- Testing HTTP transport without Docker
- Rapid iteration on HTTP features
- Debugging HTTP connection issues

**Development Tip**: To test local source code, use `npx tsx src/index.ts` instead:

```bash
# Terminal 1: Start local server in HTTP mode
TRANSPORT=http npx tsx src/index.ts

# Terminal 2: Connect inspector
npx @modelcontextprotocol/inspector --transport http --server-url http://localhost:3000
```

---

## Inspector Features

Once the Inspector is running, you can:

### 1. View Registered Tools

- See all available tools in the left sidebar
- View tool names, descriptions, and parameters
- Verify all expected tools are registered

### 2. Execute Tools

- Select a tool from the list
- Fill in required parameters
- Click "Execute" to run the tool
- View JSON response in real-time

### 3. Inspect Protocol Messages

- View raw MCP protocol messages
- See request/response JSON
- Debug protocol-level issues

### 4. Test Error Handling

- Try invalid parameters
- Test edge cases
- Verify error messages are helpful

### 5. Validate Schemas

- Check parameter validation
- Verify required vs optional fields
- Test type constraints

## Comparison of Methods

| Method | Transport | Tests | Setup | Best For |
|--------|-----------|-------|-------|----------|
| NPX Server | STDIO | Published package | ⭐ Easy | Quick verification |
| Docker Server | STDIO | Docker image | ⭐⭐ Medium | Container testing |
| Docker HTTP | HTTP | Docker + HTTP | ⭐⭐⭐ Complex | Production simulation |
| NPX HTTP | HTTP | Published package + HTTP | ⭐⭐ Medium | HTTP development |

## Troubleshooting

### Inspector Won't Start

**Problem**: `npx @modelcontextprotocol/inspector` fails

**Solutions**:
```bash
# Clear npx cache
rm -rf ~/.npm/_npx

# Try with explicit version
npx @modelcontextprotocol/inspector@latest

# Check Node.js version (requires Node 18+)
node --version
```

### Server Connection Failed

**Problem**: Inspector can't connect to server

**STDIO Mode**:
- Verify server command works standalone: `npx @gander-tools/osm-tagging-schema-mcp`
- Check for errors in server startup
- Ensure no conflicting processes

**HTTP Mode**:
- Verify server is running: `curl http://localhost:3000/health`
- Check port is not in use: `lsof -i :3000`
- Verify firewall allows localhost connections
- Check TRANSPORT environment variable is set

### Docker Container Issues

**Problem**: Docker container won't start

**Solutions**:
```bash
# Check Docker is running
docker ps

# View container logs
docker logs osm-tagging

# Check port availability
netstat -an | grep 3000

# Remove conflicting containers
docker rm -f osm-tagging
```

### Tool Execution Fails

**Problem**: Tool calls return errors

**Debugging Steps**:
1. Check parameter types match schema
2. Verify required parameters are provided
3. Test with simple/known-good values
4. Check server logs for error details
5. Compare with API documentation

### HTTP Transport Issues

**Problem**: HTTP server won't accept connections

**Solutions**:
```bash
# Verify server is listening
curl http://localhost:3000/health

# Check environment variable
echo $TRANSPORT  # Should output: http

# Verify port binding
docker logs osm-tagging | grep "listening"

# Test with explicit host
npx @modelcontextprotocol/inspector --transport http --server-url http://127.0.0.1:3000
```

## Development Workflow

### Testing Local Changes

1. **Build and test locally**:
   ```bash
   npm run build
   npm test
   ```

2. **Test with Inspector (STDIO)**:
   ```bash
   # Method 1: Test built output
   npx @modelcontextprotocol/inspector node dist/index.js

   # Method 2: Test source directly
   npx @modelcontextprotocol/inspector npx tsx src/index.ts
   ```

3. **Test HTTP mode**:
   ```bash
   # Terminal 1: Start local server
   TRANSPORT=http npx tsx src/index.ts

   # Terminal 2: Connect inspector
   npx @modelcontextprotocol/inspector --transport http --server-url http://localhost:3000
   ```

### Pre-Release Verification

Before releasing a new version:

1. **Test local build**:
   ```bash
   npm run build
   npx @modelcontextprotocol/inspector node dist/index.js
   ```

2. **Test packaged version** (optional):
   ```bash
   npm pack
   npx @modelcontextprotocol/inspector npx ./gander-tools-osm-tagging-schema-mcp-*.tgz
   ```

3. **Verify all tools work**:
   - Execute each tool with sample data
   - Test error cases
   - Verify responses match documentation

## Additional Resources

- [MCP Inspector Repository](https://github.com/modelcontextprotocol/inspector)
- [MCP Protocol Documentation](https://modelcontextprotocol.io)
- [Server API Documentation](../api/README.md)
- [Troubleshooting Guide](../user/troubleshooting.md)

## Next Steps

After verifying your server with the Inspector:

- **Integration**: Configure with [Claude Desktop](../user/configuration.md)
- **Development**: See [Development Guide](./development.md)
- **Deployment**: Review [Deployment Options](../deployment/deployment.md)
- **API Reference**: Explore [API Documentation](../api/README.md)
