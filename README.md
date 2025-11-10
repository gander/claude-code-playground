# OpenStreetMap Tagging Schema MCP Server

[![Test](https://img.shields.io/github/actions/workflow/status/gander-tools/osm-tagging-schema-mcp/test.yml?branch=master&label=tests)](https://github.com/gander-tools/osm-tagging-schema-mcp/actions/workflows/test.yml)
[![Docker](https://img.shields.io/github/actions/workflow/status/gander-tools/osm-tagging-schema-mcp/docker.yml?branch=master&label=docker)](https://github.com/gander-tools/osm-tagging-schema-mcp/actions/workflows/docker.yml)
[![Security: Trivy](https://img.shields.io/badge/security-Trivy-blue?logo=aqua)](https://github.com/gander-tools/osm-tagging-schema-mcp/security/code-scanning)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![npm version](https://img.shields.io/npm/v/@gander-tools/osm-tagging-schema-mcp)](https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io-blue?logo=docker)](https://github.com/gander-tools/osm-tagging-schema-mcp/pkgs/container/osm-tagging-schema-mcp)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![MCP](https://img.shields.io/badge/MCP-1.21.1-orange)](https://modelcontextprotocol.io)
[![Code Style: Biome](https://img.shields.io/badge/code_style-biome-60a5fa?logo=biome)](https://biomejs.dev/)
[![Made with Claude Code](https://img.shields.io/badge/Made%20with-Claude%20Code-5A67D8)](https://claude.ai/code)

A Model Context Protocol (MCP) server that provides tools for querying and validating OpenStreetMap tags using the @openstreetmap/id-tagging-schema library.

> **Built with Claude Code**: This project was developed using [Claude Code](https://claude.ai/code), an AI-powered coding assistant that helped implement the codebase following TDD principles and best practices.

## Overview

This MCP server exposes OpenStreetMap's tagging schema as a set of queryable tools, enabling applications to:
- Query available tags and their possible values
- Discover tag parameters and constraints
- Find related and compatible tags
- Access preset configurations
- Identify deprecated keys and values
- Validate tag collections for correctness

## Features

### 14 MCP Tools

| Category | Tool | Description |
|----------|------|-------------|
| **Tag Query** | `get_tag_info` | Get comprehensive information about a tag key (values, type, field definition) |
| | `get_tag_values` | Get all possible values for a tag key |
| | `get_related_tags` | Find tags commonly used together with frequency counts |
| | `search_tags` | Search for tags by keyword in fields and presets |
| **Preset Discovery** | `search_presets` | Search presets by keyword or tag with optional geometry filtering |
| | `get_preset_details` | Get complete preset configuration (tags, geometry, fields, metadata) |
| | `get_preset_tags` | Get recommended tags for a preset (identifying tags + addTags) |
| **Validation** | `validate_tag` | Validate a single tag key-value pair |
| | `validate_tag_collection` | Validate complete tag collections with aggregated statistics |
| | `check_deprecated` | Check if tags are deprecated with replacement suggestions |
| | `suggest_improvements` | Suggest improvements for tag collections (missing fields, warnings) |
| **Schema Exploration** | `get_categories` | List all tag categories with counts |
| | `get_category_tags` | Get tags in a specific category |
| | `get_schema_stats` | Get schema statistics (counts of presets, fields, categories, deprecated items) |

## Installation

### From NPM (Recommended)
```bash
npx @gander-tools/osm-tagging-schema-mcp
```

### From Source
```bash
npm install
npm run build
```

### Docker (Container)
```bash
# Pull the latest dev image
docker pull ghcr.io/gander-tools/osm-tagging-schema-mcp:dev

# Run the container
docker run -i ghcr.io/gander-tools/osm-tagging-schema-mcp:dev
```

**Available tags:**
- `dev` - Latest development build from master branch
- `latest` - Latest stable release
- `x.y.z` - Specific version (e.g., `0.1.0`)

**Security Features:**
- **Vulnerability Scanning**: All images scanned with Trivy for critical and high severity vulnerabilities
- **Image Signing**: Images signed with Cosign using keyless signing (OIDC)
- **Verification**: Verify image signatures with:
  ```bash
  cosign verify ghcr.io/gander-tools/osm-tagging-schema-mcp:latest \
    --certificate-identity-regexp=https://github.com/gander-tools \
    --certificate-oidc-issuer=https://token.actions.githubusercontent.com
  ```

## Usage

### Running the MCP Server

**Using npx:**
```bash
npx @gander-tools/osm-tagging-schema-mcp
```

**From source:**
```bash
npm start
```

**Using Docker:**
```bash
docker run -i ghcr.io/gander-tools/osm-tagging-schema-mcp:dev
```

### Configuration

#### Quick Setup with Claude Code CLI

The easiest way to add this MCP server to Claude Code CLI is using the built-in command:

```bash
claude mcp add @gander-tools/osm-tagging-schema-mcp
```

This will automatically configure the server in your Claude Code CLI environment.

#### Manual Configuration

Alternatively, you can manually add to your MCP client configuration:

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
        "ghcr.io/gander-tools/osm-tagging-schema-mcp:dev"
      ]
    }
  }
}
```

**Configuration file locations:**
- **Claude Code CLI:** `~/.config/claude-code/config.json`
- **Claude Desktop (macOS):** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Desktop (Windows):** `%APPDATA%\Claude\claude_desktop_config.json`

### Example Queries

<details>
<summary><b>Query tag information</b></summary>

```typescript
// Get information about the "parking" tag
{
  "tool": "get_tag_info",
  "arguments": {
    "key": "parking"
  }
}
// Returns: all possible values (surface, underground, multi-storey, etc.)
// and compatible tags (capacity, fee, operator, etc.)
```
</details>

<details>
<summary><b>Search for presets</b></summary>

```typescript
// Search for restaurant presets
{
  "tool": "search_presets",
  "arguments": {
    "keyword": "restaurant"
  }
}
// Returns: amenity/restaurant, amenity/fast_food, and other matching presets
```
</details>

<details>
<summary><b>Get preset details</b></summary>

```typescript
// Get complete information about a preset
{
  "tool": "get_preset_details",
  "arguments": {
    "presetId": "amenity/restaurant"
  }
}
// Returns: id, tags, geometry types, fields, icon, and other metadata
```
</details>

<details>
<summary><b>Validate tags</b></summary>

```typescript
// Validate a collection of tags
{
  "tool": "validate_tag_collection",
  "arguments": {
    "tags": {
      "amenity": "parking",
      "parking": "surface",
      "capacity": "50",
      "fee": "yes"
    }
  }
}
// Returns: validation result with any errors or warnings
```
</details>

<details>
<summary><b>Suggest improvements</b></summary>

```typescript
// Get suggestions for a tag collection
{
  "tool": "suggest_improvements",
  "arguments": {
    "tags": {
      "amenity": "restaurant"
    }
  }
}
// Returns: suggestions for missing fields, deprecation warnings, matched presets
```
</details>

## Development Methodology

This project follows **Test-Driven Development (TDD)** principles:
1. Write tests first before implementation
2. Write minimal code to make tests pass
3. Refactor while keeping tests green
4. Maintain high test coverage (>90%)

### Test Statistics
- **Unit Tests**: 263 tests, 111 suites passing
- **Integration Tests**: 107 tests, 55 suites passing
- **Total**: 370 tests with 100% passing rate

### JSON Data Integrity Testing

All tools are tested against the actual JSON data from `@openstreetmap/id-tagging-schema` to ensure:
- **Data Accuracy**: Tool outputs match the source JSON files exactly
- **Schema Compatibility**: Tests fail if schema package updates introduce breaking changes
- **100% Coverage**: ALL tag keys (799) + ALL presets (1707) validated (no hardcoded samples)
- **Continuous Validation**: Every test run verifies data integrity

## Technical Stack

- **Runtime**: Node.js 22+
- **Language**: TypeScript 5.9
- **MCP SDK**: @modelcontextprotocol/sdk ^1.0.4
- **Schema Library**: @openstreetmap/id-tagging-schema ^6.7.3
- **Build Tool**: TypeScript compiler
- **Testing**: Node.js native test runner (TDD methodology)
- **Code Quality**: BiomeJS 2.3.4 (linting & formatting)
- **CI/CD**: GitHub Actions (automated testing, Docker builds)
- **Dependencies**: Dependabot (automated updates)
- **Distribution**: npm registry (via npx), GitHub Container Registry (Docker images)
- **Containerization**: Docker with multistage builds (Alpine Linux base)

## Architecture

### Modular File Organization

**One Tool, One File**: Each MCP tool is implemented in a separate file with a corresponding test file. This modular approach ensures:
- **Clarity**: Easy to locate and understand individual tool implementations
- **Maintainability**: Changes to one tool don't affect others
- **Scalability**: New tools can be added without modifying existing files
- **Testability**: Each tool has dedicated tests that can run independently

### Architectural Layers

The server follows a modular architecture with distinct layers:

1. **Schema Layer**: Loads and indexes the tagging schema
2. **Tool Layer**: Implements MCP tools that query the schema (one file per tool)
3. **Validation Layer**: Provides tag validation logic
4. **Server Layer**: MCP server setup and tool registration

## Development

```bash
# Install dependencies
npm install

# Run tests (TDD)
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Run formatter
npm run format

# Type check
npm run typecheck

# Build for production
npm run build
```

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and delivery:

- **Automated Testing**: Runs on every push and pull request
- **Code Quality**: BiomeJS checks for linting and formatting issues
- **TypeScript Validation**: Ensures compilation succeeds
- **Dependabot**: Automated dependency updates and security patches
- **Docker Builds**: Automated container builds with Trivy scanning and Cosign signing
- **Release Process**: Automated releases to npm registry with semantic versioning

## Project Status

**Current Phase**: Phase 3 ✅ Complete (All 14 tools implemented)

- ✅ Phase 1: Project Setup
- ✅ Phase 2: Schema Integration
- ✅ Phase 3: Core Tool Implementation
- ✅ Phase 4: Testing
- 🚧 Phase 5: Documentation (In Progress)
- 📋 Phase 6: Optimization & Polish
- 📋 Phase 7: Distribution & Deployment

See [ROADMAP.md](./ROADMAP.md) for detailed development plan.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork and clone** the repository
2. **Install dependencies**: `npm install`
3. **Create a branch**: `git checkout -b feature/your-feature`
4. **Write tests first** (TDD): Add tests in `tests/` directory
5. **Implement the feature**: Write code to make tests pass
6. **Run tests**: `npm test` (ensure >90% coverage)
7. **Lint and format**: `npm run lint && npm run format`
8. **Commit changes**: Use conventional commit messages
9. **Submit a PR**: Include description and test coverage

## Documentation

- [ROADMAP.md](./ROADMAP.md) - Development roadmap and future plans
- [CHANGELOG.md](./CHANGELOG.md) - Project changelog
- [CLAUDE.md](./CLAUDE.md) - Technical project documentation and development notes

## License

GNU General Public License v3.0 - See [LICENSE](./LICENSE) file for details

## Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [OpenStreetMap Tagging Schema](https://github.com/openstreetmap/id-tagging-schema)
- [OSM Wiki - Tags](https://wiki.openstreetmap.org/wiki/Tags)
