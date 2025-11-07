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

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5+
- **MCP SDK**: @modelcontextprotocol/sdk
- **Schema Library**: @openstreetmap/id-tagging-schema
- **Build Tool**: tsup or esbuild
- **Testing**: Jest or Vitest
- **Code Quality**: ESLint, Prettier

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
```

The server follows a modular architecture with distinct layers:
1. **Schema Layer**: Loads and indexes the tagging schema
2. **Tool Layer**: Implements MCP tools that query the schema
3. **Validation Layer**: Provides tag validation logic
4. **Server Layer**: MCP server setup and tool registration

## Development Status

The project is currently in the planning/setup phase. See README.md for the complete 6-phase development plan covering:
- Phase 1: Project Setup
- Phase 2: Schema Integration
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
