# Project: OpenStreetMap Tagging Schema MCP Server

## Project Overview

This is a Model Context Protocol (MCP) server built with TypeScript that provides tools for querying and validating OpenStreetMap (OSM) tags using the `@openstreetmap/id-tagging-schema` library.

## Purpose

The MCP server exposes OpenStreetMap's tagging schema as a set of queryable tools, enabling AI assistants and applications to:
- Query available OSM tags and their possible values
- Discover tag parameters, constraints, and relationships
- Find compatible tags that work together
- Access preset configurations
- Identify deprecated keys/values and suggest replacements
- Validate tag collections for correctness

## Core Functionality

### 1. Tag Query Tools
- **get_tag_info**: Get comprehensive information about a specific tag key (e.g., "parking" returns all possible values like surface, underground, multi-storey, plus compatible tags like capacity, fee, operator)
- **get_tag_values**: Retrieve all valid values for a tag key with descriptions
- **get_related_tags**: Find tags commonly used together with a given tag
- **search_tags**: Search for tags by keyword

### 2. Preset Tools
- **search_presets**: Search for presets by name or tag filters
- **get_preset_details**: Get complete preset configuration including tags and fields
- **get_preset_tags**: Get recommended (required/optional) tags for a preset

### 3. Validation Tools
- **validate_tag**: Validate a single tag key-value pair
- **validate_tag_collection**: Validate complete tag collections and report all issues
- **check_deprecated**: Check if tags are deprecated and get replacement suggestions
- **suggest_improvements**: Analyze tag collections and provide recommendations

### 4. Schema Exploration Tools
- **get_categories**: List all available tag categories with counts
- **get_category_tags**: Get all tags belonging to a specific category
- **get_schema_stats**: Get statistics about the schema (tag counts, preset counts, deprecated items)

## Technical Stack

- **Runtime**: Node.js 18+ (Bun 1.3 compatible)
- **Language**: TypeScript 5.9
- **Package**: @gander-tools/osm-tagging-schema
- **MCP SDK**: @modelcontextprotocol/sdk ^1.0.4
- **Schema Library**: @openstreetmap/id-tagging-schema ^6.7.3
- **Build Tool**: TypeScript compiler
- **Testing**: Node.js native test runner with TDD methodology
- **Code Quality**: BiomeJS 2.3.4 (linting & formatting)
- **CI/CD**: GitHub Actions (automated testing)
- **Dependencies**: Dependabot (automated updates)
- **Distribution**: npm registry (via npx)

## Development Methodology

### Test-Driven Development (TDD)
This project strictly follows TDD principles:
1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code while keeping tests green
4. **Coverage**: Maintain >90% test coverage at all times

All features must have corresponding tests written BEFORE implementation.

### CI/CD Pipeline
- **Automated Testing**: GitHub Actions runs Bun tests on every push/PR
- **Code Quality**: BiomeJS checks for linting and formatting issues
- **Dependabot**: Automated dependency updates and security patches
- **Release**: Automated npm releases with semantic versioning
- **Distribution**: Package available via `npx` command

## Architecture

```
src/
├── index.ts           # MCP server entry point
├── tools/             # Tool implementations
│   ├── query.ts       # Tag query tools
│   ├── presets.ts     # Preset-related tools
│   ├── validation.ts  # Validation tools
│   └── schema.ts      # Schema exploration tools
├── utils/             # Helper functions
│   ├── schema-loader.ts
│   └── validators.ts
└── types/             # TypeScript type definitions
    └── index.ts
tests/                 # Test files (TDD)
├── tools/
│   ├── query.test.ts
│   ├── presets.test.ts
│   ├── validation.test.ts
│   └── schema.test.ts
└── utils/
    ├── schema-loader.test.ts
    └── validators.test.ts
.github/
└── workflows/
    ├── test.yml       # CI testing workflow
    ├── release.yml    # Release automation
    └── dependabot.yml # Dependency updates
```

The server follows a modular architecture with distinct layers:
1. **Schema Layer**: Loads and indexes the tagging schema
2. **Tool Layer**: Implements MCP tools that query the schema
3. **Validation Layer**: Provides tag validation logic
4. **Server Layer**: MCP server setup and tool registration

All layers are fully tested using Bun test with TDD approach.

## Development Status

**Current Phase: Phase 1 - COMPLETED ✅**

Phase 1 has been completed with the following achievements:
- ✅ Project structure initialized with TypeScript 5.9
- ✅ Dependencies installed (@modelcontextprotocol/sdk, @openstreetmap/id-tagging-schema)
- ✅ BiomeJS 2.3.4 configured for code quality
- ✅ Node.js test runner configured
- ✅ GitHub Actions CI/CD pipeline set up
- ✅ Dependabot configured for automated dependency updates
- ✅ First test written and passing (TDD - Red/Green cycle completed)
- ✅ Basic MCP server implementation with createServer() function

**Next Phase: Phase 2 - Schema Integration**

See README.md for the complete 6-phase development plan covering:
- Phase 1: Project Setup ✅
- Phase 2: Schema Integration (In Progress)
- Phase 3: Core Tool Implementation
- Phase 4: Testing
- Phase 5: Documentation
- Phase 6: Optimization & Polish

## Example Use Cases

**Query Example:**
```typescript
// Query: "parking" tag
// Returns:
// - Values: surface, underground, multi-storey, street_side, lane, etc.
// - Compatible tags: capacity, fee, operator, surface, access, etc.
```

**Validation Example:**
```typescript
// Input tags: {amenity: "parking", parking: "surface", capacity: "50", fee: "yes"}
// Returns: validation status, any errors/warnings, suggestions
```

## License

GNU General Public License v3.0 (GPL-3.0)

## Key Resources

- MCP Documentation: https://modelcontextprotocol.io
- OpenStreetMap Tagging Schema: https://github.com/openstreetmap/id-tagging-schema
- OSM Wiki Tags: https://wiki.openstreetmap.org/wiki/Tags
