# OpenStreetMap Tagging Schema MCP Server

[![Test](https://img.shields.io/github/actions/workflow/status/gander-tools/osm-tagging-schema-mcp/test.yml?branch=master&label=tests)](https://github.com/gander-tools/osm-tagging-schema-mcp/actions/workflows/test.yml)
[![Docker](https://img.shields.io/github/actions/workflow/status/gander-tools/osm-tagging-schema-mcp/docker.yml?branch=master&label=docker)](https://github.com/gander-tools/osm-tagging-schema-mcp/actions/workflows/docker.yml)
[![NPM Provenance](https://img.shields.io/badge/provenance-npm-CB3837?logo=npm)](https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp)
[![SLSA 3](https://img.shields.io/badge/SLSA-Level%203-green?logo=github)](docs/security.md#slsa-build-provenance)
[![Security: Trivy](https://img.shields.io/badge/security-Trivy-blue?logo=aqua)](https://github.com/gander-tools/osm-tagging-schema-mcp/security/code-scanning)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![npm version](https://img.shields.io/npm/v/@gander-tools/osm-tagging-schema-mcp)](https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io-blue?logo=docker)](https://github.com/gander-tools/osm-tagging-schema-mcp/pkgs/container/osm-tagging-schema-mcp)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![MCP](https://img.shields.io/badge/MCP-1.21-orange)](https://modelcontextprotocol.io)
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

**Quick Start:**
```bash
# Using npx (recommended - no installation needed)
npx @gander-tools/osm-tagging-schema-mcp

# Using Docker
docker run -i ghcr.io/gander-tools/osm-tagging-schema-mcp:dev
```

📖 **For detailed installation instructions**, see [docs/installation.md](./docs/installation.md) which covers:
- System requirements
- Installation from source
- Docker usage and security features
- Verification and troubleshooting

## Quick Start

**1. Add to Claude Code CLI:**
```bash
claude mcp add @gander-tools/osm-tagging-schema-mcp
```

**2. Use in conversations:**
```
Ask Claude: "What OSM tags are available for restaurants?"
Ask Claude: "Validate these tags: amenity=parking, capacity=50"
```

📖 **For detailed usage**, see:
- [docs/configuration.md](./docs/configuration.md) - Setup for Claude Code/Desktop and custom clients
- [docs/usage.md](./docs/usage.md) - Complete usage examples and workflows
- [docs/api/](./docs/api/) - API reference for all 14 tools

## Development Methodology

This project follows **Test-Driven Development (TDD)** principles:
1. Write tests first before implementation
2. Write minimal code to make tests pass
3. Refactor while keeping tests green
4. Maintain high test coverage (>90%)

### Test Statistics
- **Unit Tests**: 299 tests passing
- **Integration Tests**: 107 tests passing
- **Total**: 406 tests with 100% passing rate

### JSON Data Integrity Testing

All tools are tested against the actual JSON data from `@openstreetmap/id-tagging-schema` to ensure:
- **Data Accuracy**: Tool outputs match the source JSON files exactly
- **Schema Compatibility**: Tests fail if schema package updates introduce breaking changes
- **100% Coverage**: ALL tag keys (799) + ALL presets (1707) validated (no hardcoded samples)
- **Continuous Validation**: Every test run verifies data integrity

## Technical Stack

- **Runtime**: Node.js 22+
- **Language**: TypeScript 5.9
- **MCP SDK**: @modelcontextprotocol/sdk ^1.21.1
- **Schema Library**: @openstreetmap/id-tagging-schema ^6.7.3
- **Transport Protocols**: stdio (default), SSE/HTTP (Server-Sent Events)
- **Build Tool**: TypeScript compiler
- **Testing**: Node.js native test runner (TDD methodology)
- **Code Quality**: BiomeJS 2.3.4 (linting & formatting)
- **CI/CD**: GitHub Actions (automated testing, Docker builds)
- **Dependencies**: Dependabot (automated updates)
- **Distribution**: npm registry (via npx), GitHub Container Registry (Docker images)
- **Containerization**: Docker with multistage builds (Alpine Linux base)

## Architecture

**Modular Design**: One tool per file, clear separation of concerns (Schema/Tool/Validation/Server layers).

📖 **For architecture details**, see [DEVELOPMENT.md](./DEVELOPMENT.md)

## Development

```bash
npm install    # Install dependencies
npm test       # Run tests (TDD)
npm run lint   # Check code quality
npm run build  # Build for production
```

📖 **For development guide**, see [DEVELOPMENT.md](./DEVELOPMENT.md)

## Project Status

**Current Phase**: Phase 6 ✅ Complete (Optimization & Polish)

- ✅ Phase 1: Project Setup
- ✅ Phase 2: Schema Integration
- ✅ Phase 3: Core Tool Implementation (14 tools)
- ✅ Phase 4: Testing (406 tests, >90% coverage)
- ✅ Phase 5: Documentation (Installation, Usage, API, Troubleshooting)
- ✅ Phase 6: Optimization & Polish (Logging, Schema Updates, Publication Prep)
- 📋 Phase 7: Distribution & Deployment

See [ROADMAP.md](./ROADMAP.md) for detailed development plan.

## Contributing

Contributions are welcome! We follow a **Test-Driven Development (TDD)** approach.

**Quick Start:**
1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Write tests first, then implement the feature
5. Ensure all tests pass: `npm test`
6. Submit a pull request

**For detailed guidelines**, see [CONTRIBUTING.md](./CONTRIBUTING.md) which covers:
- Development workflow (TDD process)
- Code quality standards
- Testing requirements (>90% coverage)
- Commit message conventions
- Pull request process

## Documentation

### User Documentation
- [docs/installation.md](./docs/installation.md) - Installation guide (npx, source, Docker)
- [docs/configuration.md](./docs/configuration.md) - Configuration for Claude Code/Desktop
- [docs/usage.md](./docs/usage.md) - Usage examples and workflows
- [docs/api/](./docs/api/) - Complete API reference for all 14 tools
- [docs/security.md](./docs/security.md) - Security, provenance & supply chain
- [docs/troubleshooting.md](./docs/troubleshooting.md) - Common issues and solutions

### Developer Documentation
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines (TDD workflow)
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development setup and tasks
- [ROADMAP.md](./ROADMAP.md) - Development roadmap
- [CHANGELOG.md](./CHANGELOG.md) - Project changelog
- [CLAUDE.md](./CLAUDE.md) - Technical implementation notes

## License

GNU General Public License v3.0 - See [LICENSE](./LICENSE) file for details

## Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [OpenStreetMap Tagging Schema](https://github.com/openstreetmap/id-tagging-schema)
- [OSM Wiki - Tags](https://wiki.openstreetmap.org/wiki/Tags)
