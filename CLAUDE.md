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

- **Runtime**: Node.js 22+
- **Language**: TypeScript 5.9
- **Package**: @gander-tools/osm-tagging-schema-mcp
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

### Feature Implementation Requirements
Every feature implementation MUST follow this workflow:

1. **TDD Approach**: Write tests first, then implement code
2. **Test Coverage**: Include both unit and integration tests
3. **Pre-Push Validation**: Before pushing to remote repository, ensure:
   - ✅ All unit tests pass (`npm run test:unit`)
   - ✅ All integration tests pass (`npm run test:integration`)
   - ✅ Type checking passes (`npm run typecheck`)
   - ✅ Linting passes (`npm run lint`)
   - ✅ Build succeeds (`npm run build`)
4. **Same Branch**: All tests and implementation code must be committed in the same feature branch
5. **CI/CD**: GitHub Actions will verify all checks on push

**Do NOT push to remote if any test fails.** Fix issues locally first.

### CI/CD Pipeline
- **Automated Testing**: GitHub Actions runs Node.js tests on every push/PR
- **Code Quality**: BiomeJS checks for linting and formatting issues
- **Dependabot**: Automated dependency updates and security patches
- **Release**: Automated npm releases with semantic versioning
- **Distribution**: Package available via `npx` command

### Documentation Updates
When completing work on a phase or major feature (according to the todo list):
1. **CLAUDE.md**: Update the "Development Status" section to mark completed phases and list achievements
2. **README.md**: Update the "Development Plan" section to mark completed phase items with `[x]`

Both documentation files must be kept in sync to reflect the current project status. This ensures consistency across project documentation and helps track progress accurately.

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

All layers are fully tested using Node.js native test runner with TDD approach.

## Development Status

**Current Phase: Phase 2 - COMPLETED ✅**

Phase 1 has been completed with the following achievements:
- ✅ Project structure initialized with TypeScript 5.9
- ✅ Dependencies installed (@modelcontextprotocol/sdk, @openstreetmap/id-tagging-schema)
- ✅ BiomeJS 2.3.4 configured for code quality
- ✅ Node.js test runner configured
- ✅ GitHub Actions CI/CD pipeline set up
- ✅ Dependabot configured for automated dependency updates
- ✅ First test written and passing (TDD - Red/Green cycle completed)
- ✅ Basic MCP server implementation with createServer() function

Phase 2 has been completed with the following achievements:
- ✅ Type definitions created for schema structures (Preset, Field, DeprecatedTag, etc.)
- ✅ Schema loader utility implemented with full test coverage
- ✅ Caching mechanism with configurable TTL
- ✅ Indexing system for fast tag lookups (byKey, byTag, byGeometry)
- ✅ Query operations (findPresetsByKey, findPresetsByTag, findPresetsByGeometry)
- ✅ All 15 tests passing (TDD approach - Red/Green cycle completed)

**Next Phase: Phase 3 - Core Tool Implementation**

See README.md for the complete 6-phase development plan covering:
- Phase 1: Project Setup ✅
- Phase 2: Schema Integration ✅
- Phase 3: Core Tool Implementation (Next)
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

## Development Workflow

This project follows an **intent-based workflow** where development is organized around features, not individual commands.

### Workflow Principles

1. **Clean State Before New Work**
   - When instructed to "refresh", "clean", or "prepare for new feature":
     - Clean local branches (except current)
     - Switch to master branch
     - Pull latest changes from master
     - Read CLAUDE.md to reload project context
     - **DO NOT create a new branch yet**

2. **Feature Branch Creation**
   - **DO NOT push changes** to repository without explicit instruction
   - **Create feature branch ONLY** when instructed to push/send changes to repo
   - Branch naming: `claude/<feature-description>-<session-id>`
   - One branch per feature (not per command)
   - Master branch is protected - all changes must go through feature branches

3. **Feature Branch Lifecycle**
   - Once a feature branch is created and pushed, continue using it for all related changes
   - Create a new branch ONLY when explicitly told "this is a new feature"
   - Each feature must have its own branch for clean git history
   - Multiple commits per feature branch are expected and encouraged

### Intent: Refresh/Clean Environment

**When to use:** Starting new session, switching features, syncing with master

**What happens:**
1. Delete all local branches except current
2. Checkout master
3. Pull latest from origin/master
4. Read CLAUDE.md
5. Ready to work locally (no branch created yet)

### Intent: Push/Send Changes to Repository

**When to use:** Feature implementation is complete or at a checkpoint

**What happens:**
1. If no feature branch exists yet: create and push new branch
2. If feature branch exists: commit and push to existing branch
3. Branch naming: `claude/<feature-description>-<session-id>`
4. All changes for the same feature go to the same branch

### Intent: Start New Feature

**When to use:** Explicitly starting work on a different feature

**What happens:**
1. Perform refresh/clean workflow
2. Begin new feature work locally
3. When ready to push: create new feature branch
