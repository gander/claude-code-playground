# Development Guide

This guide provides detailed instructions for setting up and working with the OSM Tagging Schema MCP Server codebase.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Project Structure](#project-structure)
- [Development Commands](#development-commands)
- [Testing Strategy](#testing-strategy)
- [Debugging](#debugging)
- [Common Development Tasks](#common-development-tasks)
- [Troubleshooting](#troubleshooting)

## Environment Setup

### System Requirements

- **Node.js**: 22.0.0 or higher
- **npm**: 10.0.0 or higher
- **Git**: Latest stable version
- **OS**: Linux, macOS, or Windows with WSL2

### Recommended Tools

- **Editor**: VS Code with extensions:
  - Biome (official Biome extension)
  - TypeScript and JavaScript Language Features
  - ESLint (disabled in favor of Biome)
- **Terminal**: Any modern terminal with Unicode support

### Initial Setup

```bash
# Clone repository
git clone https://github.com/gander-tools/osm-tagging-schema-mcp.git
cd osm-tagging-schema-mcp

# Install dependencies
npm install

# Verify installation
npm test
npm run build
```

## Project Structure

```
osm-tagging-schema-mcp/
├── src/                          # Source code
│   ├── index.ts                  # MCP server entry point
│   ├── tools/                    # MCP tool implementations
│   │   ├── types.ts              # Shared type definitions
│   │   ├── get-schema-stats.ts   # One file per tool
│   │   ├── get-categories.ts
│   │   ├── get-category-tags.ts
│   │   ├── get-tag-values.ts
│   │   ├── get-tag-info.ts
│   │   ├── get-related-tags.ts
│   │   ├── search-tags.ts
│   │   ├── search-presets.ts
│   │   ├── get-preset-details.ts
│   │   ├── get-preset-tags.ts
│   │   ├── validate-tag.ts
│   │   ├── validate-tag-collection.ts
│   │   ├── check-deprecated.ts
│   │   └── suggest-improvements.ts
│   ├── transports/               # Transport protocols
│   │   ├── types.ts              # Transport configuration types
│   │   ├── request-handler.ts    # MCP request handler
│   │   ├── http.ts               # HTTP/REST transport
│   │   ├── sse.ts                # Server-Sent Events transport
│   │   └── websocket.ts          # WebSocket transport
│   └── utils/                    # Utility functions
│       ├── schema-loader.ts      # Schema loading and indexing
│       ├── logger.ts             # Logging utility
│       └── validators.ts         # Validation utilities
├── tests/                        # Test files
│   ├── tools/                    # Unit tests (one per tool)
│   ├── utils/                    # Utility tests
│   ├── transports/               # Transport tests
│   │   ├── http.test.ts          # HTTP transport tests
│   │   ├── sse.test.ts           # SSE transport tests
│   │   └── websocket.test.ts     # WebSocket transport tests
│   └── integration/              # Integration tests
│       ├── helpers.ts            # Shared test utilities
│       └── *.test.ts             # One integration test per tool
├── dist/                         # Build output (gitignored)
├── node_modules/                 # Dependencies (gitignored)
├── .github/                      # GitHub workflows
│   └── workflows/
│       ├── test.yml              # CI testing
│       ├── docker.yml            # Docker builds
│       └── release.yml           # NPM releases
├── package.json                  # Project metadata
├── tsconfig.json                 # TypeScript configuration
├── biome.json                    # Biome configuration
├── README.md                     # User documentation
├── ROADMAP.md                    # Development roadmap
├── CHANGELOG.md                  # Project changelog
├── CONTRIBUTING.md               # Contribution guidelines
├── DEVELOPMENT.md                # This file
├── CLAUDE.md                     # Technical notes
└── LICENSE                       # GPL-3.0 license
```

### Key Directories

- **src/tools/**: Each MCP tool is a separate file
- **tests/tools/**: Unit tests (one file per tool)
- **tests/integration/**: Integration tests via MCP protocol
- **src/utils/**: Shared utilities (schema loader, validators)

## Development Commands

### Testing

```bash
# Run all tests (unit + integration)
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run specific test file
node --import tsx --test tests/tools/my-tool.test.ts

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Run linter (BiomeJS)
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check (TypeScript)
npm run typecheck
```

### Build & Run

```bash
# Build for production
npm run build

# Run the MCP server
npm start

# Run in development mode (with tsx)
npx tsx src/index.ts
```

### Docker

```bash
# Build Docker image
docker build -t osm-tagging-schema-mcp .

# Run container
docker run -i osm-tagging-schema-mcp

# Build and run with Docker Compose
docker-compose up --build
```

## Testing Strategy

### Test-Driven Development (TDD)

This project strictly follows TDD:

1. **RED**: Write a failing test
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve code quality

### Test Hierarchy

```
1. Unit Tests (tests/tools/*.test.ts)
   ├── Test individual functions in isolation
   ├── Mock external dependencies
   └── Fast execution (<1s per suite)

2. Integration Tests (tests/integration/*.test.ts)
   ├── Test MCP protocol communication
   ├── Use real MCP client/server
   └── Verify end-to-end functionality

3. JSON Data Integrity Tests
   ├── Validate against actual schema JSON files
   ├── Test ALL values (100% coverage)
   └── Ensure compatibility with schema updates
```

### Writing Tests

**Unit Test Example:**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SchemaLoader } from "../../src/utils/schema-loader.js";
import { myTool } from "../../src/tools/my-tool.js";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };

describe("myTool", () => {
  describe("Basic Functionality", () => {
    it("should return expected result", async () => {
      const loader = new SchemaLoader({ enableIndexing: true });
      const result = await myTool(loader, "test");

      assert.ok(result);
      assert.strictEqual(result.count, 1);
    });
  });

  describe("JSON Schema Data Integrity", () => {
    it("should validate against all presets", async () => {
      const loader = new SchemaLoader({ enableIndexing: true });

      // Test EVERY preset (100% coverage)
      for (const presetId of Object.keys(presets)) {
        const result = await myTool(loader, presetId);
        assert.ok(result, `Should handle preset: ${presetId}`);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty input", async () => {
      const loader = new SchemaLoader({ enableIndexing: true });
      const result = await myTool(loader, "");

      assert.strictEqual(result.count, 0);
    });
  });
});
```

**Integration Test Example:**

```typescript
import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setupClientServer, type TestServer, teardownClientServer } from "./helpers.js";

describe("Integration: my_tool", () => {
  let client: Client;
  let server: TestServer;

  beforeEach(async () => {
    ({ client, server } = await setupClientServer());
  });

  afterEach(async () => {
    await teardownClientServer(client, server);
  });

  it("should register tool", async () => {
    const response = await client.listTools();
    const tool = response.tools.find((t) => t.name === "my_tool");

    assert.ok(tool);
    assert.strictEqual(tool.name, "my_tool");
  });

  it("should execute tool successfully", async () => {
    const response = await client.callTool({
      name: "my_tool",
      arguments: { param: "value" },
    });

    assert.ok(response.content);
    const result = JSON.parse((response.content[0] as { text: string }).text);
    assert.ok(result);
  });
});
```

### Test Coverage Requirements

- **Minimum**: 90% across all modules
- **Goal**: 100% for critical paths
- **JSON Integrity**: 100% validation against schema data

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug MCP Server",
      "program": "${workspaceFolder}/src/index.ts",
      "runtimeArgs": ["--import", "tsx"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/node",
      "args": ["--import", "tsx", "--test", "${file}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Console Debugging

```typescript
// Add debug logging in code
console.log("Debug:", JSON.stringify(data, null, 2));

// Run with debug output
DEBUG=* npm start
```

### Log Level Configuration

The server includes a built-in logger with configurable levels. Control logging verbosity using the `LOG_LEVEL` environment variable:

```bash
# Available log levels (in order of verbosity):
# - SILENT: No logging
# - ERROR: Only errors
# - WARN: Errors and warnings
# - INFO: Errors, warnings, and info (default)
# - DEBUG: All messages including debug

# Run with debug logging
LOG_LEVEL=DEBUG npm start

# Run with minimal logging
LOG_LEVEL=ERROR npm start

# Run with no logging
LOG_LEVEL=SILENT npm start
```

**Log Output Format:**
```
2025-11-10T12:34:56.789Z [INFO] [main] Starting OSM Tagging Schema MCP Server
2025-11-10T12:34:56.890Z [DEBUG] [MCPServer] Tool call: get_schema_stats
2025-11-10T12:34:56.950Z [ERROR] [MCPServer] Error executing tool: invalid_tool
```

**Development Tips:**
- Use `DEBUG` level during development to see all tool calls
- Use `INFO` level (default) for normal operation
- Use `ERROR` level in production to reduce noise
- Logs are written to stderr to not interfere with MCP protocol (stdout)

### Transport Configuration

The server supports multiple transport protocols for different use cases. Configure the transport using environment variables:

#### Available Transports

1. **stdio** (default): Standard input/output for MCP protocol
   - Use with Claude Code/Desktop
   - No network configuration required
   - Ideal for local development

2. **http**: HTTP/REST transport
   - Request/response over HTTP
   - POST /message for MCP requests
   - GET /health for health checks
   - Suitable for web applications

3. **sse**: Server-Sent Events
   - One-way server-to-client streaming
   - GET /events for event stream
   - POST /message for requests
   - Suitable for real-time updates

4. **websocket**: WebSocket transport
   - Bidirectional real-time communication
   - Persistent connection
   - Lower latency than HTTP
   - Suitable for interactive web apps

#### Environment Variables

```bash
# Transport type (default: stdio)
TRANSPORT=stdio|http|sse|websocket

# Server host (default: 0.0.0.0)
# Only applies to http, sse, websocket
HOST=0.0.0.0

# Server port (default: 3000)
# Only applies to http, sse, websocket
PORT=3000

# Enable CORS (default: true)
# Only applies to http, sse, websocket
CORS_ENABLED=true|false

# CORS origin (default: *)
# Only applies to http, sse, websocket
CORS_ORIGIN=*|https://example.com
```

#### Examples

**Run with HTTP transport:**
```bash
TRANSPORT=http PORT=3000 npm start
```

**Run with WebSocket on custom port:**
```bash
TRANSPORT=websocket PORT=8080 npm start
```

**Run with SSE and custom CORS:**
```bash
TRANSPORT=sse PORT=3000 CORS_ORIGIN=https://example.com npm start
```

**Run with HTTP and debug logging:**
```bash
TRANSPORT=http PORT=3000 LOG_LEVEL=DEBUG npm start
```

#### Testing Transports

**HTTP Transport:**
```bash
# Start server
TRANSPORT=http PORT=3000 npm start

# Test with curl
curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

**WebSocket Transport:**
```bash
# Start server
TRANSPORT=websocket PORT=3000 npm start

# Test with websocat or similar WebSocket client
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  websocat ws://localhost:3000
```

**SSE Transport:**
```bash
# Start server
TRANSPORT=sse PORT=3000 npm start

# Connect to event stream
curl http://localhost:3000/events

# In another terminal, send request
curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### Test Debugging

```bash
# Run single test file with verbose output
node --import tsx --test tests/tools/my-tool.test.ts

# Run specific test by name
node --import tsx --test tests/tools/my-tool.test.ts --test-name-pattern "should do X"

# Debug failing test
node --inspect-brk --import tsx --test tests/tools/my-tool.test.ts
```

## Common Development Tasks

### Adding a New MCP Tool

1. **Write unit tests** (TDD RED):
   ```bash
   touch tests/tools/my-new-tool.test.ts
   # Write failing tests
   npm test  # Should fail
   ```

2. **Implement the tool** (TDD GREEN):
   ```bash
   touch src/tools/my-new-tool.ts
   # Implement minimal code
   npm test  # Should pass
   ```

3. **Register in MCP server**:
   - Add import in `src/index.ts`
   - Add to `ListToolsRequestSchema` tools array
   - Add handler in `CallToolRequestSchema`

4. **Add integration tests**:
   ```bash
   touch tests/integration/my-new-tool.test.ts
   # Write integration tests
   ```

5. **Update documentation**:
   - Add to README.md tools table
   - Update ROADMAP.md
   - Add to CHANGELOG.md

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update specific package
npm update @openstreetmap/id-tagging-schema

# Update all packages
npm update

# After updating, verify tests
npm test
```

### Running Linter and Formatter

```bash
# Check code quality
npm run lint

# Auto-fix issues
npm run lint:fix

# Format all files
npm run format

# Format specific file
npx biome format --write src/tools/my-tool.ts
```

### Building for Production

```bash
# Clean build
rm -rf dist/
npm run build

# Verify build
node dist/index.js
```

## Troubleshooting

### Tests Failing After Schema Update

If tests fail after updating `@openstreetmap/id-tagging-schema`:

1. Check what changed in the schema
2. Update tool logic to handle new data structures
3. Update tests to match new schema
4. This is **expected behavior** - tests validate compatibility

### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf dist/

# Rebuild
npm run build

# Check for type errors
npm run typecheck
```

### Import Errors

Ensure you're using the correct import syntax:

```typescript
// ✅ Correct (ES modules with .js extension)
import { myTool } from "./my-tool.js";

// ❌ Wrong (no extension)
import { myTool } from "./my-tool";
```

### Test Timeouts

If tests timeout, increase the timeout:

```typescript
// In test file
import { describe, it } from "node:test";

it("long running test", { timeout: 10000 }, async () => {
  // Test code
});
```

### Docker Build Issues

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t osm-tagging-schema-mcp .
```

## Performance Tips

### Faster Test Execution

```bash
# Run tests in parallel (default)
npm test

# Run tests sequentially (for debugging)
npm test -- --test-concurrency=1

# Run only unit tests (faster)
npm run test:unit
```

### Faster Development Iteration

```bash
# Use watch mode for instant feedback
npm run test:watch

# Use tsx for faster TypeScript execution
npx tsx src/index.ts
```

### Schema Loader Caching

The schema loader caches data by default. For development:

```typescript
// Disable caching for testing
const loader = new SchemaLoader({
  enableIndexing: true,
  cacheTTL: 0  // Disable cache
});
```

## Additional Resources

- [MCP SDK Documentation](https://modelcontextprotocol.io)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [BiomeJS Documentation](https://biomejs.dev/)
- [OSM Tagging Schema](https://github.com/openstreetmap/id-tagging-schema)

## Getting Help

- **Issues**: Report bugs on [GitHub Issues](https://github.com/gander-tools/osm-tagging-schema-mcp/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/gander-tools/osm-tagging-schema-mcp/discussions)
- **Documentation**: See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
