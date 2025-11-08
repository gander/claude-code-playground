# OpenStreetMap Tagging Schema MCP Server

[![Test](https://img.shields.io/github/actions/workflow/status/gander-tools/osm-tagging-schema-mcp/test.yml?branch=master&label=tests)](https://github.com/gander-tools/osm-tagging-schema-mcp/actions/workflows/test.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![npm version](https://img.shields.io/npm/v/@gander-tools/osm-tagging-schema-mcp)](https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![MCP](https://img.shields.io/badge/MCP-1.21.1-orange)](https://modelcontextprotocol.io)
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
  │   └── search-tags.ts
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
  │   └── search-tags.test.ts
  ├── utils/
  │   └── schema-loader.test.ts
  └── integration/
      └── server.test.ts
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
- [ ] `get_tag_info`: Get information about a specific tag key
  - Input: tag key (e.g., "parking")
  - Output: all possible values, description, related tags
- [x] `get_tag_values`: Get all possible values for a tag key ✅
  - Input: tag key
  - Output: array of valid values sorted alphabetically
- [ ] `get_related_tags`: Find tags commonly used together
  - Input: tag key or key-value pair
  - Output: related tags and their relationships
- [x] `search_tags`: Search for tags by keyword ✅
  - Input: search query, optional limit
  - Output: matching tags with key, value, and preset name

#### 3.2 Preset Tools
- [ ] `search_presets`: Search for presets by name or tags
  - Input: search query or tag filters
  - Output: matching presets with metadata
- [ ] `get_preset_details`: Get complete preset information
  - Input: preset ID or name
  - Output: preset configuration, tags, fields
- [ ] `get_preset_tags`: Get recommended tags for a preset
  - Input: preset ID
  - Output: required and optional tags

#### 3.3 Validation Tools
- [ ] `validate_tag`: Validate a single tag key-value pair
  - Input: key and value
  - Output: validation result with errors/warnings
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
- [x] Write unit tests for all implemented tools (73 tests, 24 suites passing)
- [x] Create integration tests for MCP server
- [x] Test with real OpenStreetMap tag data
- [x] Set up CI/CD pipeline with GitHub Actions
- [x] **JSON Data Integrity Tests**: Verify all tool outputs match source JSON data
  - Unit tests validate against @openstreetmap/id-tagging-schema JSON files
  - Integration tests verify MCP tool responses match JSON data exactly
  - Tests ensure compatibility with schema package updates
  - Provider pattern for comprehensive data validation
  - Sample-based testing for large datasets (presets, fields)
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

### Configuration

#### Quick Setup with Claude Code CLI

The easiest way to add this MCP server to Claude Code CLI is using the built-in command:

```bash
claude mcp add @gander-tools/osm-tagging-schema-mcp
```

This will automatically configure the server in your Claude Code CLI environment.

#### Manual Configuration

Alternatively, you can manually add to your MCP client configuration:

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
└── search-tags.ts            # search_tags tool

tests/tools/
├── get-schema-stats.test.ts  # Tests for get_schema_stats
├── get-categories.test.ts    # Tests for get_categories
├── get-category-tags.test.ts # Tests for get_category_tags
├── get-tag-values.test.ts    # Tests for get_tag_values
└── search-tags.test.ts       # Tests for search_tags
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
