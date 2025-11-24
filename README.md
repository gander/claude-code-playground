# OpenStreetMap Tagging Schema MCP Server

[![Build Status](https://img.shields.io/github/check-runs/gander-tools/osm-tagging-schema-mcp/master?label=repo%20status)](https://github.com/gander-tools/osm-tagging-schema-mcp/commits/master)
[![Test](https://img.shields.io/github/actions/workflow/status/gander-tools/osm-tagging-schema-mcp/test.yml?branch=master&label=tests)](https://github.com/gander-tools/osm-tagging-schema-mcp/actions/workflows/test.yml)
[![Fuzzing](https://img.shields.io/github/actions/workflow/status/gander-tools/osm-tagging-schema-mcp/fuzz.yml?branch=master&label=fuzzing)](https://github.com/gander-tools/osm-tagging-schema-mcp/actions/workflows/fuzz.yml)
[![Code Quality](https://img.shields.io/badge/code%20quality-BiomeJS-60a5fa?logo=eslint)](https://biomejs.dev/)
[![Test Coverage](https://img.shields.io/badge/coverage-%3E90%25-brightgreen?logo=codecov)](https://github.com/gander-tools/osm-tagging-schema-mcp/tree/master/tests)
[![Publish](https://img.shields.io/github/actions/workflow/status/gander-tools/osm-tagging-schema-mcp/publish-npm.yml?label=npm)](https://github.com/gander-tools/osm-tagging-schema-mcp/actions/workflows/publish-npm.yml)
[![Docker](https://img.shields.io/github/actions/workflow/status/gander-tools/osm-tagging-schema-mcp/publish-docker.yml?branch=master&label=docker)](https://github.com/gander-tools/osm-tagging-schema-mcp/actions/workflows/publish-docker.yml)
[![npm version](https://img.shields.io/npm/v/@gander-tools/osm-tagging-schema-mcp)](https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@gander-tools/osm-tagging-schema-mcp)](https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp)
[![GitHub Release](https://img.shields.io/github/v/release/gander-tools/osm-tagging-schema-mcp?logo=github)](https://github.com/gander-tools/osm-tagging-schema-mcp/releases)
[![NPM Provenance](https://img.shields.io/badge/provenance-npm-CB3837?logo=npm)](https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp)
[![SLSA 3](https://img.shields.io/badge/SLSA-Level%203-green?logo=github)](docs/deployment/security.md#slsa-build-provenance)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io-blue?logo=docker)](https://github.com/gander-tools/osm-tagging-schema-mcp/pkgs/container/osm-tagging-schema-mcp)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![MCP](https://img.shields.io/badge/MCP-1.21-orange)](https://modelcontextprotocol.io)
[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-blueviolet?logo=anthropic)](https://claude.ai/code)

## What is this?

This is a **Model Context Protocol (MCP) server** designed specifically for AI agents and LLM applications. It acts as a bridge between artificial intelligence systems and the comprehensive OpenStreetMap tagging knowledge base provided by the official `@openstreetmap/id-tagging-schema` library.

**Current Status**: Version 1.0.0 is now publicly available as a production-ready MVP, actively maintained and continuously improved. The service is deployed and accessible at [https://mcp.gander.tools/osm-tagging/](https://mcp.gander.tools/osm-tagging/).

**We welcome your feedback!** Have ideas for improvements? Found a bug? Want to discuss features? Please open an [issue](https://github.com/gander-tools/osm-tagging-schema-mcp/issues) or start a [discussion](https://github.com/gander-tools/osm-tagging-schema-mcp/discussions).

## What this is NOT

⚠️ **Important clarifications:**

- **Not a standalone application**: This server requires integration with AI systems (like Claude Code or Claude Desktop) to be useful. It has no user interface or web frontend.
- **Not for direct human use**: Without an AI agent as an intermediary, this tool provides no value to end users. It's designed exclusively for programmatic access by LLM applications.
- **Not a public API for general use**: The deployed service at mcp.gander.tools is intended for integration with AI agents, not for direct HTTP requests or high-volume automated queries. Please do not attempt to abuse the service with DDoS attacks or excessive traffic.

If you're looking for a user-facing OSM tagging tool, consider [iD editor](https://github.com/openstreetmap/iD) or [JOSM](https://josm.openstreetmap.de/) instead.

## Features

**7 MCP Tools** organized into 3 categories:

- **Tag Query** (2 tools): Query tag values and search tags
- **Preset Discovery** (2 tools): Search and explore OSM presets with detailed configurations
- **Validation** (3 tools): Validate tags, check for deprecated tags, suggest improvements

📖 **Full tool reference**: [docs/api/](./docs/api/README.md)

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

📖 **More options**: [docs/user/installation.md](./docs/user/installation.md) (source installation, verification, troubleshooting)

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
- [docs/user/configuration.md](./docs/user/configuration.md) - Setup for Claude Code/Desktop and custom clients
- [docs/user/usage.md](./docs/user/usage.md) - Usage examples, workflows, and advanced deployment
- [docs/api/](./docs/api/README.md) - Complete API reference for all tools

### Testing with MCP Inspector

Test and debug the server using the official [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
# Start server with HTTP transport
npm run start:http

# In another terminal, launch Inspector
npx @modelcontextprotocol/inspector --transport http --server-url http://localhost:3000/
```

The Inspector UI will open in your browser at `http://localhost:6274` with a visual interface to test all 7 tools.

📖 **More details**: [docs/user/configuration.md#cors-configuration](./docs/user/configuration.md#cors-configuration)

## Development

Built with **Test-Driven Development (TDD)** and **Property-Based Fuzzing**:
- Comprehensive test suite (unit + integration) with 100% pass rate
- Property-based fuzz tests with fast-check for edge case discovery
- Continuous fuzzing in CI/CD (weekly schedule + on every push/PR)

```bash
npm install      # Install dependencies
npm test         # Run all tests
npm run test:fuzz # Run fuzz tests
npm run build    # Build for production
```

📖 **Development guides**: [docs/development/development.md](./docs/development/development.md) | [docs/development/fuzzing.md](./docs/development/fuzzing.md)

## Contributing

Contributions welcome! This project follows **Test-Driven Development (TDD)**.

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a feature branch
4. Write tests first, then implement
5. Ensure all tests pass: `npm test`
6. Submit a pull request

📖 **Guidelines**: [docs/development/contributing.md](./docs/development/contributing.md)

## Documentation

**User Guides:**
- [Installation](./docs/user/installation.md) - Setup guide (npx, Docker, source)
- [Configuration](./docs/user/configuration.md) - Claude Code/Desktop setup
- [Usage](./docs/user/usage.md) - Examples, workflows, advanced deployment
- [API Reference](./docs/api/README.md) - Complete tool documentation
- [Troubleshooting](./docs/user/troubleshooting.md) - Common issues

**Developer Docs:**
- [Contributing](./docs/development/contributing.md) - Contribution guidelines
- [Development](./docs/development/development.md) - Development setup
- [Fuzzing](./docs/development/fuzzing.md) - Fuzzing infrastructure and security testing
- [Roadmap](./docs/development/roadmap.md) - Project roadmap
- [Release Process](./docs/development/release-process.md) - Release workflow

**Deployment Docs:**
- [Deployment](./docs/deployment/deployment.md) - Production deployment guide
- [Security](./docs/deployment/security.md) - Security features and verification

**Project Info:**
- [CHANGELOG.md](./CHANGELOG.md) - Version history

## License

GNU General Public License v3.0 - See [LICENSE](./LICENSE) file for details.
