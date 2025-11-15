# OpenStreetMap Tagging Schema MCP Server

[![Test](https://img.shields.io/github/actions/workflow/status/gander-tools/osm-tagging-schema-mcp/test.yml?branch=master&label=tests)](https://github.com/gander-tools/osm-tagging-schema-mcp/actions/workflows/test.yml)
[![Docker](https://img.shields.io/github/actions/workflow/status/gander-tools/osm-tagging-schema-mcp/docker.yml?branch=master&label=docker)](https://github.com/gander-tools/osm-tagging-schema-mcp/actions/workflows/docker.yml)
[![npm version](https://img.shields.io/npm/v/@gander-tools/osm-tagging-schema-mcp)](https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@gander-tools/osm-tagging-schema-mcp)](https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp)
[![package size](https://img.shields.io/bundlephobia/minzip/@gander-tools/osm-tagging-schema-mcp)](https://bundlephobia.com/package/@gander-tools/osm-tagging-schema-mcp)
[![NPM Provenance](https://img.shields.io/badge/provenance-npm-CB3837?logo=npm)](https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp)
[![SLSA 3](https://img.shields.io/badge/SLSA-Level%203-green?logo=github)](docs/security.md#slsa-build-provenance)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io-blue?logo=docker)](https://github.com/gander-tools/osm-tagging-schema-mcp/pkgs/container/osm-tagging-schema-mcp)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![MCP](https://img.shields.io/badge/MCP-1.21-orange)](https://modelcontextprotocol.io)

A Model Context Protocol (MCP) server that provides tools for querying and validating OpenStreetMap tags using the official `@openstreetmap/id-tagging-schema` library.

## Features

**7 MCP Tools** organized into 3 categories:

- **Tag Query** (2 tools): Query tag values and search tags
- **Preset Discovery** (2 tools): Search and explore OSM presets with detailed configurations
- **Validation** (3 tools): Validate tags, check for deprecated tags, suggest improvements

📖 **Full tool reference**: [docs/api/](./docs/api/)

## Installation

### Using npx (Recommended)

```bash
# No installation needed - run directly
npx @gander-tools/osm-tagging-schema-mcp
```

### Using Docker

```bash
# Run with stdio transport
docker run -i ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
```

📖 **More options**: [docs/installation.md](./docs/installation.md) (source installation, verification, troubleshooting)

## Quick Start

### With Claude Code CLI

```bash
# Add to Claude Code
claude mcp add @gander-tools/osm-tagging-schema-mcp

# Use in conversations
# Ask Claude: "What OSM tags are available for restaurants?"
# Ask Claude: "Validate these tags: amenity=parking, capacity=50"
```

### With Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "osm-tagging-schema": {
      "command": "npx",
      "args": ["@gander-tools/osm-tagging-schema-mcp"]
    }
  }
}
```

📖 **Configuration guides**:
- [docs/configuration.md](./docs/configuration.md) - Setup for Claude Code/Desktop and custom clients
- [docs/usage.md](./docs/usage.md) - Usage examples, workflows, and advanced deployment
- [docs/api/](./docs/api/) - Complete API reference for all 7 tools

## Development

Built with **Test-Driven Development (TDD)** - 301 tests (199 unit + 102 integration) with 100% pass rate.

```bash
npm install    # Install dependencies
npm test       # Run all tests
npm run build  # Build for production
```

📖 **Development guide**: [DEVELOPMENT.md](./DEVELOPMENT.md)

## Contributing

Contributions welcome! This project follows **Test-Driven Development (TDD)**.

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a feature branch
4. Write tests first, then implement
5. Ensure all tests pass: `npm test`
6. Submit a pull request

📖 **Guidelines**: [CONTRIBUTING.md](./CONTRIBUTING.md)

## Documentation

**User Guides:**
- [Installation](./docs/installation.md) - Setup guide (npx, Docker, source)
- [Configuration](./docs/configuration.md) - Claude Code/Desktop setup
- [Usage](./docs/usage.md) - Examples, workflows, advanced deployment
- [API Reference](./docs/api/) - Complete tool documentation
- [Troubleshooting](./docs/troubleshooting.md) - Common issues

**Developer Docs:**
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development setup
- [ROADMAP.md](./ROADMAP.md) - Project roadmap
- [CHANGELOG.md](./CHANGELOG.md) - Version history

## License

GNU General Public License v3.0 - See [LICENSE](./LICENSE) file for details.
