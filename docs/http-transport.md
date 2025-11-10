# HTTP Transport

The OSM Tagging Schema MCP Server supports HTTP transport with Server-Sent Events (SSE) in addition to the default stdio transport.

## Configuration

HTTP transport is configured using environment variables:

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `TRANSPORT` | Transport protocol to use | `stdio` | `stdio`, `http` |
| `HTTP_PORT` | HTTP server port | `3000` | `1-65535` |
| `HTTP_HOST` | HTTP server host | `0.0.0.0` | Any valid hostname or IP |
| `HTTP_SESSION_MODE` | Session management mode | `stateful` | `stateful`, `stateless` |
| `HTTP_CORS_ENABLED` | Enable CORS | `true` | `true`, `false` |
| `HTTP_CORS_ORIGIN` | CORS origin header | `*` | Any origin string |

## Usage

### Starting the Server

```bash
# Start with HTTP transport
TRANSPORT=http npm start

# Start with custom port
TRANSPORT=http HTTP_PORT=8080 npm start

# Start with specific host
TRANSPORT=http HTTP_HOST=127.0.0.1 npm start

# Stateless mode (no session management)
TRANSPORT=http HTTP_SESSION_MODE=stateless npm start
```

### Docker

```bash
# Using docker run
docker run -e TRANSPORT=http -p 3000:3000 ghcr.io/gander-tools/osm-tagging-schema-mcp:latest

# Using docker compose
services:
  osm-mcp:
    image: ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
    environment:
      - TRANSPORT=http
      - HTTP_PORT=3000
      - HTTP_HOST=0.0.0.0
    ports:
      - "3000:3000"
```

## Endpoints

### Health Check

```http
GET /health
```

Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "version": "0.1.0"
}
```

### MCP Protocol

All MCP requests are handled via the `/mcp` endpoint using the [Streamable HTTP](https://spec.modelcontextprotocol.io/specification/2025-03-26/transports/#http-with-sse) transport specification.

#### POST /mcp

Send JSON-RPC 2.0 requests.

**Required Headers:**
- `Content-Type: application/json`
- `Mcp-Protocol-Version: 2025-03-26` (or other supported version)
- `Accept: application/json, text/event-stream`

**Session Management (Stateful Mode):**
- Initialization requests receive `Mcp-Session-Id` header in response
- Subsequent requests must include `Mcp-Session-Id` header

**Example: Initialization**

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Protocol-Version: 2025-03-26" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'
```

**Example: Tool Call**

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Protocol-Version: 2025-03-26" \
  -H "Mcp-Session-Id: <session-id-from-init>" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_schema_stats",
      "arguments": {}
    }
  }'
```

#### GET /mcp

Establish Server-Sent Events (SSE) stream for receiving server notifications.

**Required Headers:**
- `Mcp-Session-Id: <session-id>`
- `Accept: text/event-stream`

#### DELETE /mcp

Terminate a session.

**Required Headers:**
- `Mcp-Session-Id: <session-id>`

## CORS Configuration

CORS (Cross-Origin Resource Sharing) is enabled by default to allow browser-based clients.

```bash
# Disable CORS
TRANSPORT=http HTTP_CORS_ENABLED=false npm start

# Restrict to specific origin
TRANSPORT=http HTTP_CORS_ORIGIN=https://example.com npm start
```

## Session Management

### Stateful Mode (Default)

- Server generates and manages session IDs
- Clients receive `Mcp-Session-Id` header during initialization
- Session state is maintained in memory
- Sessions persist until explicitly terminated or server restart

### Stateless Mode

- No session management
- No `Mcp-Session-Id` headers
- Each request is independent
- Suitable for simple request/response scenarios

```bash
TRANSPORT=http HTTP_SESSION_MODE=stateless npm start
```

## Protocol Support

The server implements the [MCP Streamable HTTP specification](https://spec.modelcontextprotocol.io/specification/2025-03-26/transports/#http-with-sse) using the official MCP SDK.

**Supported Protocol Versions:**
- `2025-03-26` (latest, default)
- `2024-11-05`
- `2024-10-07`

## Integration Examples

### JavaScript/TypeScript

```typescript
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:3000';

// Initialize session
const initResponse = await fetch(`${baseUrl}/mcp`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Mcp-Protocol-Version': '2025-03-26',
    'Accept': 'application/json, text/event-stream',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'my-client', version: '1.0.0' },
    },
  }),
});

const sessionId = initResponse.headers.get('mcp-session-id');

// Call tool
const toolResponse = await fetch(`${baseUrl}/mcp`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Mcp-Protocol-Version': '2025-03-26',
    'Mcp-Session-Id': sessionId,
    'Accept': 'application/json, text/event-stream',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'get_tag_info',
      arguments: { tagKey: 'amenity' },
    },
  }),
});

const result = await toolResponse.json();
console.log(result);
```

### Python

```python
import requests

base_url = 'http://localhost:3000'

# Initialize session
init_response = requests.post(
    f'{base_url}/mcp',
    headers={
        'Content-Type': 'application/json',
        'Mcp-Protocol-Version': '2025-03-26',
        'Accept': 'application/json, text/event-stream',
    },
    json={
        'jsonrpc': '2.0',
        'id': 1,
        'method': 'initialize',
        'params': {
            'protocolVersion': '2025-03-26',
            'capabilities': {},
            'clientInfo': {'name': 'my-client', 'version': '1.0.0'},
        },
    },
)

session_id = init_response.headers.get('Mcp-Session-Id')

# Call tool
tool_response = requests.post(
    f'{base_url}/mcp',
    headers={
        'Content-Type': 'application/json',
        'Mcp-Protocol-Version': '2025-03-26',
        'Mcp-Session-Id': session_id,
        'Accept': 'application/json, text/event-stream',
    },
    json={
        'jsonrpc': '2.0',
        'id': 2,
        'method': 'tools/call',
        'params': {
            'name': 'get_tag_info',
            'arguments': {'tagKey': 'amenity'},
        },
    },
)

result = tool_response.json()
print(result)
```

## Security Considerations

- **Bind Address**: Use `HTTP_HOST=127.0.0.1` for local-only access
- **Firewall**: Ensure proper firewall rules when exposing publicly
- **CORS**: Restrict origins in production environments
- **Authentication**: Consider adding authentication middleware for production use
- **TLS**: Use reverse proxy (nginx, Apache) for HTTPS in production

## Troubleshooting

### Server won't start

```bash
# Check if port is already in use
lsof -i :3000

# Try different port
TRANSPORT=http HTTP_PORT=8080 npm start
```

### Connection refused

```bash
# Check if server is listening on correct interface
# Use 0.0.0.0 to listen on all interfaces
TRANSPORT=http HTTP_HOST=0.0.0.0 npm start
```

### CORS errors in browser

```bash
# Enable CORS and set appropriate origin
TRANSPORT=http HTTP_CORS_ENABLED=true HTTP_CORS_ORIGIN=https://your-domain.com npm start
```

## See Also

- [Installation Guide](installation.md)
- [Configuration Guide](configuration.md)
- [API Reference](api/README.md)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
