# Troubleshooting Guide

This guide helps resolve common issues with the OSM Tagging Schema MCP Server.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Configuration Issues](#configuration-issues)
- [Runtime Issues](#runtime-issues)
- [Performance Issues](#performance-issues)
- [Data Issues](#data-issues)
- [Getting Help](#getting-help)

## Installation Issues

### Node.js Version Error

**Symptom:**
```
Error: Node.js version 22.0.0 or higher is required
Current version: v18.17.0
```

**Solution:**
```bash
# Install Node.js 22+ from https://nodejs.org/
# Or using nvm:
nvm install 22
nvm use 22
nvm alias default 22

# Verify version
node --version
```

---

### npm Permission Errors

**Symptom:**
```
EACCES: permission denied, mkdir '/usr/local/lib/node_modules/@gander-tools'
```

**Solution:**
```bash
# DON'T use sudo with npm!
# Fix npm permissions instead:

# Option 1: Use npx (recommended)
npx @gander-tools/osm-tagging-schema-mcp

# Option 2: Configure npm to use user directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option 3: Fix permissions on npm directories
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER /usr/local/lib/node_modules
```

---

### Package Not Found

**Symptom:**
```
npm ERR! 404 '@gander-tools/osm-tagging-schema-mcp@latest' is not in this registry
```

**Solution:**
```bash
# Verify package name is correct
npm view @gander-tools/osm-tagging-schema-mcp

# Clear npm cache
npm cache clean --force

# Try again
npx @gander-tools/osm-tagging-schema-mcp

# If still failing, check npm registry
npm config get registry
# Should be: https://registry.npmjs.org/
```

---

### Docker Daemon Not Running

**Symptom:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solution:**
```bash
# Linux
sudo systemctl start docker
sudo systemctl enable docker

# macOS/Windows
# Start Docker Desktop application

# Verify Docker is running
docker ps

# If permission denied
sudo usermod -aG docker $USER
# Log out and log back in
```

---

### Docker Image Pull Fails

**Symptom:**
```
Error response from daemon: manifest for ghcr.io/gander-tools/osm-tagging-schema-mcp:dev not found
```

**Cause:** The `:dev` tag has been replaced with `:edge` for development builds.

**Solution:**
```bash
# Check available tags
# Visit: https://github.com/gander-tools/osm-tagging-schema-mcp/pkgs/container/osm-tagging-schema-mcp

# Use latest stable
docker pull ghcr.io/gander-tools/osm-tagging-schema-mcp:latest

# Or use edge for development builds
docker pull ghcr.io/gander-tools/osm-tagging-schema-mcp:edge

# Or use specific version
docker pull ghcr.io/gander-tools/osm-tagging-schema-mcp:0.2.1

# If authentication required
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

## Configuration Issues

### MCP Client Can't Find Server

**Symptom:**
```
Error: MCP server 'osm-tagging' not found
```

**Solution:**
```bash
# 1. Verify configuration file location
# Claude Code CLI: ~/.config/claude-code/config.json
# Claude Desktop (macOS): ~/Library/Application Support/Claude/claude_desktop_config.json
# Claude Desktop (Windows): %APPDATA%\Claude\claude_desktop_config.json

# 2. Check JSON syntax
cat ~/.config/claude-code/config.json | jq .
# If error: fix JSON syntax

# 3. Verify server name matches
{
  "mcpServers": {
    "osm-tagging": {  // This name must match client requests
      "command": "npx",
      "args": ["@gander-tools/osm-tagging-schema-mcp"]
    }
  }
}

# 4. Restart MCP client (Claude Code/Desktop)
```

---

### Configuration File Not Found

**Symptom:**
```
Configuration file not found
```

**Solution:**
```bash
# Create configuration directory
mkdir -p ~/.config/claude-code

# Create configuration file
cat > ~/.config/claude-code/config.json << 'EOF'
{
  "mcpServers": {
    "osm-tagging": {
      "command": "npx",
      "args": ["@gander-tools/osm-tagging-schema-mcp"]
    }
  }
}
EOF

# Verify JSON is valid
cat ~/.config/claude-code/config.json | jq .
```

---

### Server Starts But Tools Not Available

**Symptom:**
```
Server connected, but no tools available
```

**Solution:**
```bash
# 1. Test server directly
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | npx @gander-tools/osm-tagging-schema-mcp

# Should return JSON with tools

# 2. Check server version
npx @gander-tools/osm-tagging-schema-mcp --version

# 3. Clear npx cache
npm cache clean --force

# 4. Try Docker instead
docker run -i ghcr.io/gander-tools/osm-tagging-schema-mcp:latest

# 5. Check client logs for errors
```

## Runtime Issues

### Server Crashes on Startup

**Symptom:**
```
Server process exited with code 1
```

**Solution:**
```bash
# 1. Run server directly to see error
npx @gander-tools/osm-tagging-schema-mcp

# 2. Check Node.js version
node --version
# Must be 22.0.0+

# 3. Check for conflicting packages
npm list @openstreetmap/id-tagging-schema
npm list @modelcontextprotocol/sdk

# 4. Clear npm cache
npm cache clean --force

# 5. Try Docker (isolated environment)
docker run -i ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
```

---

### Tool Execution Timeout

**Symptom:**
```
Error: Tool execution timeout after 30000ms
```

**Solution:**
```bash
# 1. Increase timeout in client configuration (if supported)

# 2. Check system resources
free -h  # Memory
top      # CPU usage

# 3. Test specific tool
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "get_tag_values", "arguments": {"tagKey": "amenity"}}, "id": 1}' | npx @gander-tools/osm-tagging-schema-mcp

# 4. Restart server (clears cache)

# 5. If persistent, file a bug report with:
# - Tool name
# - Arguments
# - System specs
```

---

### Invalid JSON Response

**Symptom:**
```
SyntaxError: Unexpected token in JSON at position 0
```

**Solution:**
```bash
# 1. Check server output directly
npx @gander-tools/osm-tagging-schema-mcp

# 2. Verify input format
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | npx @gander-tools/osm-tagging-schema-mcp

# 3. Check for corrupted installation
npm cache clean --force
npx @gander-tools/osm-tagging-schema-mcp

# 4. Try different installation method (Docker)
```

---

### HTTP Transport / CORS Issues

**Symptom 1:** MCP Inspector UI shows "Connection failed" or "Network error"

**Solution:**
```bash
# 1. Verify server is running with HTTP transport
TRANSPORT=http PORT=3000 npm start
# Or: npm run start:http

# 2. Check server logs for CORS message
# Should see: "CORS enabled for origins: http://localhost:6274, https://mcp.ziziyi.com"

# 3. Verify Inspector is using correct URL
npx @modelcontextprotocol/inspector --transport http --server-url http://localhost:3000/

# 4. Check if server is listening
curl http://localhost:3000/health
# Expected: {"status":"ok","service":"osm-tagging-schema-mcp","timestamp":"..."}

# 5. Test CORS headers
curl -i -X OPTIONS http://localhost:3000/ \
  -H "Origin: http://localhost:6274" \
  -H "Access-Control-Request-Method: POST"
# Expected: Access-Control-Allow-Origin: http://localhost:6274
```

**Symptom 2:** "Origin not allowed" error in browser console

**Solution:**
```bash
# Add your origin to CORS_ORIGINS
CORS_ORIGINS="http://localhost:6274,http://localhost:8080" TRANSPORT=http npm start

# For testing only (NOT for production)
CORS_ORIGINS="*" TRANSPORT=http npm start
```

**Symptom 3:** Inspector connects but tools don't appear

**Solution:**
```bash
# 1. Check server readiness
curl http://localhost:3000/ready
# Expected: {"status":"ready","schema":{...}}

# 2. Test MCP protocol directly
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
# Expected: JSON response with tool list

# 3. Check browser console for errors
# Open DevTools in Inspector UI and look for errors

# 4. Try increasing timeout or restart server
```

**Symptom 4:** Connection works with CLI but not with Inspector UI

**Cause:** CLI uses stdio transport directly, Inspector UI requires HTTP transport with CORS headers

**Solution:**
```bash
# CLI uses stdio (default)
npx @gander-tools/osm-tagging-schema-mcp  # ✓ Works

# Inspector requires HTTP transport
TRANSPORT=http npm start  # Required for Inspector UI
npx @modelcontextprotocol/inspector --transport http --server-url http://localhost:3000/
```

---

### Tool Not Found Error

**Symptom:**
```
Error: Tool 'get_tag_values' not found
```

**Solution:**
```bash
# 1. List available tools
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | npx @gander-tools/osm-tagging-schema-mcp

# 2. Check tool name spelling
# Correct: get_tag_values, search_tags, validate_tag
# Incorrect: get-tag-values, getTagValues

# 3. Verify server version
npx @gander-tools/osm-tagging-schema-mcp --version

# 4. Update to latest version
npm cache clean --force
npx @gander-tools/osm-tagging-schema-mcp
```

## Performance Issues

### Slow Response Times

**Symptom:**
```
Tool execution taking >5 seconds
```

**Solution:**
```bash
# 1. Check system resources
free -h  # Memory
top      # CPU

# 2. Verify schema cache is working
# First query: slower (loads schema)
# Subsequent queries: faster (uses cache)

# 3. Increase memory limit
NODE_OPTIONS="--max-old-space-size=1024" npx @gander-tools/osm-tagging-schema-mcp

# 4. Use Docker with resource limits
docker run -i --memory="1g" --cpus="2.0" ghcr.io/gander-tools/osm-tagging-schema-mcp:latest

# 5. Check for other processes consuming resources
ps aux | grep node
```

---

### High Memory Usage

**Symptom:**
```
Server using >500MB RAM
```

**Explanation:**
Default memory usage is 100-200MB. Higher usage is normal if:
- Schema is fully loaded and indexed
- Multiple queries are cached
- System has other Node.js processes

**Solution (if needed):**
```bash
# 1. Restart server to clear cache
# kill and restart

# 2. Use Docker with memory limit
docker run -i --memory="512m" ghcr.io/gander-tools/osm-tagging-schema-mcp:latest

# 3. Monitor memory usage
docker stats

# 4. If memory leak suspected, report issue with:
# - Memory usage over time
# - Queries executed
# - System specs
```

---

### Slow Startup Time

**Symptom:**
```
Server takes >10 seconds to start
```

**Solution:**
```bash
# 1. Check disk I/O
iostat -x 1 10

# 2. Verify SSD (not HDD) for node_modules
df -h

# 3. Clear npm cache
npm cache clean --force

# 4. Use Docker (pre-built image)
docker pull ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
docker run -i ghcr.io/gander-tools/osm-tagging-schema-mcp:latest

# 5. Check for antivirus scanning node_modules
# Exclude node_modules from real-time scanning
```

## Data Issues

### Unexpected Tool Results

**Symptom:**
```
Tool returns unexpected or empty results
```

**Solution:**
```bash
# 1. Verify input format
# Check API documentation for correct argument names/types

# 2. Test with known-good example
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "get_tag_info", "arguments": {"tagKey": "amenity"}}, "id": 1}' | npx @gander-tools/osm-tagging-schema-mcp

# 3. Check schema version
npm list @openstreetmap/id-tagging-schema

# 4. Update to latest
npm cache clean --force
npx @gander-tools/osm-tagging-schema-mcp

# 5. Report issue with:
# - Tool name
# - Arguments
# - Expected vs actual result
```

---

### Schema Data Out of Date

**Symptom:**
```
Missing new OSM tags or presets
```

**Solution:**
```bash
# 1. Check package version
npm view @gander-tools/osm-tagging-schema-mcp version

# 2. Check schema library version
npm view @openstreetmap/id-tagging-schema version

# 3. Update to latest
npm cache clean --force
npx @gander-tools/osm-tagging-schema-mcp

# 4. For Docker
docker pull ghcr.io/gander-tools/osm-tagging-schema-mcp:latest

# 5. Schema updates are automatic when:
# - New package version is released
# - npx pulls latest version
# - Docker image is rebuilt
```

---

### Validation Errors for Valid Tags

**Symptom:**
```
validate_tag returns error for known valid tag
```

**Solution:**
```bash
# 1. Verify tag exists in current schema
# Check OSM Wiki: https://wiki.openstreetmap.org/wiki/Tag:key=value

# 2. Schema might not include all valid tags
# Only tags in id-tagging-schema are validated

# 3. Check for typos
# Correct: amenity=restaurant
# Incorrect: amenity=restraunt

# 4. Use search_tags to find similar tags
{"name": "search_tags", "arguments": {"keyword": "restaurant"}}

# 5. Report missing tags to:
# - id-tagging-schema project
# - https://github.com/openstreetmap/id-tagging-schema
```

## Getting Help

### Reporting Issues

When reporting issues, include:

1. **System Information:**
   ```bash
   node --version
   npm --version
   docker --version  # if using Docker
   uname -a  # OS information
   ```

2. **Installation Method:**
   - npx
   - Source
   - Docker

3. **Configuration:**
   ```bash
   # Redact any sensitive information
   cat ~/.config/claude-code/config.json
   ```

4. **Error Messages:**
   - Complete error output
   - Stack traces if available

5. **Steps to Reproduce:**
   - Exact commands run
   - Input data
   - Expected vs actual result

### Where to Get Help

- **Bug Reports**: [GitHub Issues](https://github.com/gander-tools/osm-tagging-schema-mcp/issues)
- **Questions**: [GitHub Discussions](https://github.com/gander-tools/osm-tagging-schema-mcp/discussions)
- **Documentation**: [README.md](../../README.md)
- **API Reference**: [API Documentation](../api/README.md)

### Before Reporting

1. **Search existing issues:**
   https://github.com/gander-tools/osm-tagging-schema-mcp/issues

2. **Check documentation:**
   - [Installation Guide](./installation.md)
   - [Configuration Guide](./configuration.md)
   - [Usage Guide](./usage.md)

3. **Try basic troubleshooting:**
   - Clear cache: `npm cache clean --force`
   - Restart server
   - Try Docker

4. **Test with minimal configuration:**
   ```bash
   echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | npx @gander-tools/osm-tagging-schema-mcp
   ```

## Debug Mode

### Interactive Testing with MCP Inspector

For interactive debugging and testing, use the **MCP Inspector** - a web-based tool that provides a UI for testing MCP servers:

```bash
# Test server interactively
npx @modelcontextprotocol/inspector npx @gander-tools/osm-tagging-schema-mcp

# Test Docker image
npx @modelcontextprotocol/inspector docker run --rm -i ghcr.io/gander-tools/osm-tagging-schema-mcp
```

**Benefits:**
- ✅ Interactive web UI for testing tools
- ✅ View all available tools and their parameters
- ✅ Execute tools with custom input
- ✅ Inspect JSON responses
- ✅ Test error handling

**See [Inspection Guide](../development/inspection.md)** for comprehensive documentation.

### Command-Line Debugging

For command-line troubleshooting:

```bash
# Run server directly (see all output)
npx @gander-tools/osm-tagging-schema-mcp

# Pipe test input
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | npx @gander-tools/osm-tagging-schema-mcp

# Run with debug logging
LOG_LEVEL=debug npx @gander-tools/osm-tagging-schema-mcp

# For development, use Node.js inspector
node --inspect node_modules/.bin/tsx src/index.ts
```

## Common Error Codes

| Error Code | Meaning | Solution |
|-----------|---------|----------|
| `-32700` | Parse error | Invalid JSON input - check syntax |
| `-32600` | Invalid request | Missing required fields in request |
| `-32601` | Method not found | Check method name spelling |
| `-32602` | Invalid params | Check parameter names and types |
| `-32603` | Internal error | Server error - check logs, report if persistent |

## Next Steps

- [Installation Guide](./installation.md)
- [Configuration Guide](./configuration.md)
- [Usage Guide](./usage.md)
- [API Documentation](../api/README.md)
