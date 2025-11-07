# OpenStreetMap Tagging Schema MCP Server

A Model Context Protocol (MCP) server that provides tools for querying and validating OpenStreetMap tags using the @openstreetmap/id-tagging-schema library.

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

## Development Plan

### Phase 1: Project Setup ✅
- [x] Initialize TypeScript 5.9 project with Node.js 18+
- [x] Install dependencies:
  - `@modelcontextprotocol/sdk`
  - `@openstreetmap/id-tagging-schema`
  - Development tools (BiomeJS, types)
- [x] Set up project structure:
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
  └── utils/
  ```
- [x] Configure build system (TypeScript compiler)
- [x] Set up BiomeJS 2.3.4 for linting and formatting
- [x] Configure test framework (Node.js native test runner)
- [x] Set up GitHub Actions CI/CD

### Phase 2: Schema Integration
- [ ] Create schema loader utility
- [ ] Implement caching mechanism for schema data
- [ ] Build indexing system for fast tag lookups
- [ ] Create type definitions for schema structures

### Phase 3: Core Tool Implementation

#### 3.1 Tag Query Tools
- [ ] `get_tag_info`: Get information about a specific tag key
  - Input: tag key (e.g., "parking")
  - Output: all possible values, description, related tags
- [ ] `get_tag_values`: Get all possible values for a tag key
  - Input: tag key
  - Output: array of valid values with descriptions
- [ ] `get_related_tags`: Find tags commonly used together
  - Input: tag key or key-value pair
  - Output: related tags and their relationships
- [ ] `search_tags`: Search for tags by keyword
  - Input: search query
  - Output: matching tags with basic info

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
- [ ] `get_categories`: List all tag categories
  - Output: array of categories with counts
- [ ] `get_category_tags`: Get tags in a specific category
  - Input: category name
  - Output: tags belonging to that category
- [ ] `get_schema_stats`: Get schema statistics
  - Output: counts of tags, presets, deprecated items

### Phase 4: Testing (TDD Approach)
- [ ] Write unit tests for each tool using Node.js test runner (before implementation)
- [ ] Create integration tests with MCP inspector
- [ ] Test with real OpenStreetMap tag data
- [ ] Validate error handling and edge cases
- [ ] Ensure >90% test coverage
- [ ] Run tests in CI/CD pipeline

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
npx @gander-tools/osm-tagging-schema
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
npx @gander-tools/osm-tagging-schema
```

**From source:**
```bash
npm start
```

### Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "osm-tagging": {
      "command": "npx",
      "args": ["@gander-tools/osm-tagging-schema"]
    }
  }
}
```

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

- **Runtime**: Node.js 18+
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

The server follows a modular architecture:

1. **Schema Layer**: Loads and indexes the tagging schema
2. **Tool Layer**: Implements MCP tools that query the schema
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
