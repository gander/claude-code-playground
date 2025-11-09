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

### Core Tools

1. **Query Tag Information**
   - Get all possible values for a specific tag key
   - Retrieve tag descriptions and documentation
   - Find compatible tags that work together
   - Access tag usage guidelines

2. **Preset Discovery**
   - Search for presets by name or tags
   - Get preset configurations and recommended tags
   - Discover tag combinations for specific features

3. **Tag Validation**
   - Validate individual tag key-value pairs
   - Validate complete tag collections
   - Check for deprecated keys and suggest replacements
   - Verify value formats and constraints

4. **Schema Exploration**
   - Browse available tag categories
   - Search tags by keyword or category
   - Get statistics about tag usage in schema

## Development Methodology

This project follows **Test-Driven Development (TDD)** principles:
1. Write tests first before implementation
2. Write minimal code to make tests pass
3. Refactor while keeping tests green
4. Maintain high test coverage (>90%)

### JSON Data Integrity Testing

All tools are tested against the actual JSON data from `@openstreetmap/id-tagging-schema` to ensure:
- **Data Accuracy**: Tool outputs match the source JSON files exactly
- **Schema Compatibility**: Tests fail if schema package updates introduce breaking changes
- **Continuous Validation**: Every test run verifies data integrity

Test categories:
- **Unit Tests**: Validate tool logic against JSON data (presets.json, fields.json, categories.json)
- **Integration Tests**: Verify MCP server responses match JSON data through the protocol layer
- **Update Safety**: When `@openstreetmap/id-tagging-schema` updates, tests ensure data consistency

## Development Plan

### Phase 1: Project Setup ✅
- [x] Initialize TypeScript 5.9 project with Node.js 22+
- [x] Install dependencies:
  - `@modelcontextprotocol/sdk`
  - `@openstreetmap/id-tagging-schema`
  - Development tools (BiomeJS, types)
- [x] Set up project structure with modular file organization:
  ```
  src/
  ├── index.ts              # MCP server entry point
  ├── tools/                # Tool implementations (one file per tool)
  │   ├── types.ts          # Shared type definitions
  │   ├── get-schema-stats.ts
  │   ├── get-categories.ts
  │   ├── get-category-tags.ts
  │   ├── get-tag-values.ts
  │   ├── get-tag-info.ts
  │   ├── get-related-tags.ts
  │   ├── search-tags.ts
  │   ├── search-presets.ts
  │   ├── get-preset-details.ts
  │   └── get-preset-tags.ts
  ├── utils/                # Helper functions
  │   ├── schema-loader.ts
  │   └── validators.ts
  └── types/                # TypeScript type definitions
      └── index.ts
  tests/                    # Test files (TDD - one test file per tool)
  ├── tools/
  │   ├── get-schema-stats.test.ts
  │   ├── get-categories.test.ts
  │   ├── get-category-tags.test.ts
  │   ├── get-tag-values.test.ts
  │   ├── get-tag-info.test.ts
  │   ├── get-related-tags.test.ts
  │   ├── search-tags.test.ts
  │   ├── search-presets.test.ts
  │   ├── get-preset-details.test.ts
  │   └── get-preset-tags.test.ts
  ├── utils/
  │   └── schema-loader.test.ts
  └── integration/
      ├── helpers.ts        # Shared test utilities
      ├── server-init.test.ts
      ├── get-schema-stats.test.ts
      ├── get-categories.test.ts
      ├── get-category-tags.test.ts
      ├── get-tag-values.test.ts
      ├── get-tag-info.test.ts
      ├── get-related-tags.test.ts
      ├── search-tags.test.ts
      ├── search-presets.test.ts
      ├── get-preset-details.test.ts
      └── get-preset-tags.test.ts
  ```
- [x] Configure build system (TypeScript compiler)
- [x] Set up BiomeJS 2.3.4 for linting and formatting
- [x] Configure test framework (Node.js native test runner)
- [x] Set up GitHub Actions CI/CD

### Phase 2: Schema Integration ✅
- [x] Create schema loader utility
- [x] Implement caching mechanism for schema data
- [x] Build indexing system for fast tag lookups
- [x] Create type definitions for schema structures
- [x] Write unit tests for schema loader (19 tests passing)
- [x] Create integration tests for MCP server
- [x] Set up CI/CD pipeline for automated testing

### Phase 3: Core Tool Implementation - IN PROGRESS ⏳

#### 3.1 Tag Query Tools
- [x] `get_tag_info`: Get information about a specific tag key ✅
  - Input: tag key (e.g., "parking")
  - Output: all possible values, type, and field definition status
- [x] `get_tag_values`: Get all possible values for a tag key ✅
  - Input: tag key
  - Output: array of valid values sorted alphabetically
- [x] `get_related_tags`: Find tags commonly used together ✅
  - Input: tag key or key-value pair
  - Output: related tags sorted by frequency with preset examples
- [x] `search_tags`: Search for tags by keyword ✅
  - Input: search query, optional limit
  - Output: matching tags from fields and presets with key, value, and preset name

#### 3.2 Preset Tools
- [x] `search_presets`: Search for presets by name or tags ✅
  - Input: search query or tag filters
  - Output: matching presets with metadata
- [x] `get_preset_details`: Get complete preset information ✅
  - Input: preset ID or name
  - Output: preset configuration, tags, fields
- [x] `get_preset_tags`: Get recommended tags for a preset ✅
  - Input: preset ID
  - Output: required and optional tags

#### 3.3 Validation Tools
- [x] `validate_tag`: Validate a single tag key-value pair ✅
  - Input: key and value
  - Output: validation result with errors/warnings, deprecation info
- [ ] `validate_tag_collection`: Validate a collection of tags
  - Input: object with key-value pairs
  - Output: validation report with all issues
- [ ] `check_deprecated`: Check if tags are deprecated
  - Input: tag key or key-value pair
  - Output: deprecation status and suggested replacements
- [ ] `suggest_improvements`: Suggest improvements for tag collection
  - Input: tag collection
  - Output: recommendations and warnings

#### 3.4 Schema Exploration Tools
- [x] `get_categories`: List all tag categories ✅
  - Output: array of categories with names and member counts, sorted alphabetically
- [x] `get_category_tags`: Get tags in a specific category ✅
  - Input: category name
  - Output: preset IDs belonging to that category
- [x] `get_schema_stats`: Get schema statistics ✅
  - Output: counts of presets, fields, categories, and deprecated items

### Phase 4: Testing (TDD Approach) - COMPLETED ✅
- [x] Configure Node.js native test runner
- [x] Write unit tests for schema loader (19 tests passing)
- [x] Write unit tests for all implemented tools (170 tests, 66 suites passing)
- [x] Create integration tests for MCP server (59 tests, 31 suites passing)
  - **Modular structure**: One integration test file per tool for clarity
  - **Shared utilities**: `helpers.ts` for common setup/teardown
  - **Order-independent tests**: Tools validated by existence, not array position
  - **Alphabetical ordering**: Tools returned in predictable alphabetical order
- [x] Test with real OpenStreetMap tag data
- [x] Set up CI/CD pipeline with GitHub Actions
- [x] **JSON Data Integrity Tests**: Verify all tool outputs match source JSON data
  - Unit tests validate against @openstreetmap/id-tagging-schema JSON files
  - Integration tests verify MCP tool responses match JSON data exactly
  - Tests ensure compatibility with schema package updates
  - Provider pattern for comprehensive data validation
  - 100% coverage: ALL tag keys (799) + ALL presets (1707) validated (no hardcoded samples)
  - Bidirectional validation ensures complete data integrity
- [x] Validate error handling for all implemented tools
- [x] Achieve high test coverage across all modules (>90%)

### Phase 5: Documentation
- [ ] Write API documentation for each tool
- [ ] Create usage examples
- [ ] Document installation and setup
- [ ] Add troubleshooting guide
- [ ] Create contribution guidelines

### Phase 6: Optimization & Polish
- [ ] Implement caching strategies
- [ ] Optimize schema loading and queries
- [ ] Add logging and debugging support
- [ ] Handle schema updates gracefully
- [ ] Prepare for publication

### Phase 7: Distribution & Deployment
- [ ] **NPM Publishing with Provenance**
  - Set up GitHub Actions workflow for npm publishing
  - Configure npm provenance signing (attestations)
  - Link package to GitHub repository with verified builds
  - Enable trusted publishing from GitHub Actions
  - Add package provenance badge to README
- [ ] **Container Image & Registry**
  - Create Dockerfile for containerized deployment
  - Set up multi-stage builds for optimal image size
  - Publish to GitHub Container Registry (ghcr.io)
  - Add container image scanning for security
  - Support for multiple architectures (amd64, arm64)
- [ ] **Additional Transport Protocols**
  - Implement Server-Sent Events (SSE) transport
  - Implement HTTP/REST transport for web clients
  - Add WebSocket transport support
  - Create transport configuration system
  - Document transport selection and use cases
- [ ] **Public Service Deployment**
  - Create deployment configurations (Docker Compose, Kubernetes)
  - Set up health check endpoints
  - Configure rate limiting and authentication
  - Add metrics and monitoring (Prometheus/Grafana)
  - Create deployment documentation
  - Plan for horizontal scaling

### Future Enhancements

**Schema-Builder Inspired Features** (planned for future phases):

Based on analysis of [ideditor/schema-builder](https://github.com/ideditor/schema-builder), the following advanced features are planned:

1. **Enhanced Tag Validation** - Geometry constraints, prerequisite tag checking, field type validation
2. **Field Inheritance Resolution** - Complete field lists including inherited fields from parent presets
3. **Conditional Field Analysis** - Determine field visibility based on tag values and prerequisites
4. **Advanced Deprecation** - Complex tag transformations with placeholder substitution
5. **Tag Quality Scoring** - Completeness and quality scoring for features

These enhancements will extend validation capabilities while maintaining 100% compatibility with current implementation. See `CLAUDE.md` for detailed specifications.

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

### Development

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

### Example Queries

**Query tag information:**
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

**Search for presets:**
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

**Get preset details:**
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

**Validate tags:**
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

## Technical Stack

- **Runtime**: Node.js 22+
- **Language**: TypeScript 5.9
- **MCP SDK**: @modelcontextprotocol/sdk
- **Schema Library**: @openstreetmap/id-tagging-schema
- **Build Tool**: TypeScript compiler
- **Testing**: Node.js native test runner (TDD methodology)
- **Code Quality**: BiomeJS 2.3.4 (linting & formatting)
- **CI/CD**: GitHub Actions (automated testing)
- **Dependencies**: Dependabot (automated updates)
- **Distribution**: npm (via npx)

## Architecture

### Modular File Organization

**One Tool, One File**: Each MCP tool is implemented in a separate file with a corresponding test file. This modular approach ensures:
- **Clarity**: Easy to locate and understand individual tool implementations
- **Maintainability**: Changes to one tool don't affect others
- **Scalability**: New tools can be added without modifying existing files
- **Testability**: Each tool has dedicated tests that can run independently

```
src/tools/
├── types.ts                  # Shared type definitions
├── get-schema-stats.ts       # get_schema_stats tool
├── get-categories.ts         # get_categories tool
├── get-category-tags.ts      # get_category_tags tool
├── get-tag-values.ts         # get_tag_values tool
├── get-tag-info.ts           # get_tag_info tool
├── get-related-tags.ts       # get_related_tags tool
├── search-tags.ts            # search_tags tool
├── search-presets.ts         # search_presets tool
├── get-preset-details.ts     # get_preset_details tool
└── get-preset-tags.ts        # get_preset_tags tool

tests/tools/
├── get-schema-stats.test.ts  # Tests for get_schema_stats
├── get-categories.test.ts    # Tests for get_categories
├── get-category-tags.test.ts # Tests for get_category_tags
├── get-tag-values.test.ts    # Tests for get_tag_values
├── get-tag-info.test.ts      # Tests for get_tag_info
├── get-related-tags.test.ts  # Tests for get_related_tags
├── search-tags.test.ts       # Tests for search_tags
├── search-presets.test.ts    # Tests for search_presets
├── get-preset-details.test.ts # Tests for get_preset_details
└── get-preset-tags.test.ts   # Tests for get_preset_tags

tests/integration/
├── helpers.ts                # Shared test utilities
├── server-init.test.ts       # Server initialization tests
├── get-schema-stats.test.ts  # get_schema_stats integration
├── get-categories.test.ts    # get_categories integration
├── get-category-tags.test.ts # get_category_tags integration
├── get-tag-values.test.ts    # get_tag_values integration
├── get-tag-info.test.ts      # get_tag_info integration
├── get-related-tags.test.ts  # get_related_tags integration
├── search-tags.test.ts       # search_tags integration
├── search-presets.test.ts    # search_presets integration
├── get-preset-details.test.ts # get_preset_details integration
└── get-preset-tags.test.ts   # get_preset_tags integration
```

### Architectural Layers

The server follows a modular architecture with distinct layers:

1. **Schema Layer**: Loads and indexes the tagging schema
2. **Tool Layer**: Implements MCP tools that query the schema (one file per tool)
3. **Validation Layer**: Provides tag validation logic
4. **Server Layer**: MCP server setup and tool registration

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and delivery:

### Automated Testing
- Runs on every push and pull request
- Executes full test suite with Node.js test runner
- Checks code quality with BiomeJS
- Validates TypeScript compilation
- Ensures test coverage >90%

### Dependabot
- Automatically checks for dependency updates
- Creates pull requests for security patches
- Keeps dependencies up to date

### Release Process
- Automated releases to npm registry
- Semantic versioning
- Changelog generation
- Package available via `npx` command

### Workflow Files
```
.github/
├── workflows/
│   ├── test.yml           # Run tests on push/PR
│   ├── release.yml        # Automated npm releases
│   └── dependabot.yml     # Dependency updates
```

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

## License

GNU General Public License v3.0 - See LICENSE file for details

## Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [OpenStreetMap Tagging Schema](https://github.com/openstreetmap/id-tagging-schema)
- [OSM Wiki - Tags](https://wiki.openstreetmap.org/wiki/Tags)
