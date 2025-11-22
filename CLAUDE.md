# Project: OpenStreetMap Tagging Schema MCP Server

> **⚠️ IMPORTANT**: This document reflects the ACTUAL current state of the codebase.
> **Current Status**: 7 tools (optimized set) | All systems operational ✅ | Production-ready

## Project Overview

This is a Model Context Protocol (MCP) server built with TypeScript that provides tools for querying and validating OpenStreetMap (OSM) tags using the `@openstreetmap/id-tagging-schema` library.

**Development Status**: Production-ready with optimized tool set. Originally planned 14 tools, reduced to 7 after removing redundant functionality.

## Purpose

The MCP server exposes OpenStreetMap's tagging schema as a set of queryable tools, enabling AI assistants and applications to:
- Query available OSM tags and their possible values
- Discover tag parameters, constraints, and relationships
- Find compatible tags that work together
- Access preset configurations
- Identify deprecated keys/values and suggest replacements
- Validate tag collections for correctness

## Core Functionality

**Current Status**: 7 tools (optimized, complete set)

### Complete Tool Set (7 tools)

**Validation Tools** (3 tools):
- ✅ **validate_tag**: Validate a single tag key-value pair (includes deprecation checking)
- ✅ **validate_tag_collection**: Validate complete tag collections and report all issues
- ✅ **suggest_improvements**: Analyze tag collections and provide recommendations

**Tag Query Tools** (2 tools):
- ✅ **get_tag_values**: Retrieve all valid values for a tag key with descriptions
- ✅ **search_tags**: Search for tags by keyword

**Preset Tools** (2 tools):
- ✅ **search_presets**: Search for presets by name or tag filters
- ✅ **get_preset_details**: Get complete preset configuration including tags and fields

### Redundant Tools Removed

7 additional tools were considered but **intentionally not implemented** or **removed** due to redundancy:

**Not Implemented**:
- ~~get_tag_info~~ - Covered by `get_tag_values` and `search_tags`
- ~~get_related_tags~~ - Available via `search_presets` and `get_preset_details`
- ~~get_preset_tags~~ - Tag information in `get_preset_details` output
- ~~get_schema_stats~~ - Statistics derivable from existing tools
- ~~get_categories~~ - Category exploration via `search_presets`
- ~~get_category_tags~~ - Covered by `search_presets` filtering

**Merged into other tools**:
- ~~check_deprecated~~ - Merged into `validate_tag` (deprecation checking included in validation)

**Design Philosophy**: Maintain minimal, non-overlapping tool set rather than redundant convenience wrappers.

## Technical Stack

- **Runtime**: Node.js 22+
- **Language**: TypeScript 5.x
- **Package**: @gander-tools/osm-tagging-schema-mcp
- **MCP SDK**: @modelcontextprotocol/sdk ^1.x
- **Schema Library**: @openstreetmap/id-tagging-schema ^6.x
- **Testing**: Node.js native test runner with TDD methodology
- **Fuzzing**: fast-check (property-based testing) with CI integration
- **Code Quality**: BiomeJS (linting & formatting)
- **CI/CD**: GitHub Actions (automated testing, fuzzing, Docker builds)
- **Distribution**: npm registry (via npx), GitHub Container Registry (Docker images)

## Development Methodology

### Test-Driven Development (TDD)
This project strictly follows TDD principles:
1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code while keeping tests green
4. **Coverage**: Maintain >90% test coverage at all times

All features must have corresponding tests written BEFORE implementation.

### JSON Data Integrity Testing Standard

**CRITICAL**: All tools MUST be tested against the actual JSON data from `@openstreetmap/id-tagging-schema`.

#### Testing Requirements

1. **Unit Tests** (`tests/tools/*.test.ts`):
   - Import relevant JSON files: `presets.json`, `fields.json`, `preset_categories.json`
   - Use Node.js `with { type: "json" }` syntax for imports
   - Create "JSON Schema Validation" describe block
   - Verify tool outputs match JSON data exactly (counts, values, structure)

2. **Integration Tests** (`tests/integration/*.test.ts`):
   - Import same JSON files as unit tests
   - Create "JSON Schema Data Integrity" describe block
   - Verify MCP tool responses match JSON data through protocol layer

#### CRITICAL RULE: Individual Value Validation

**EVERY value MUST be validated individually** - this is a non-negotiable requirement for all tools.

**Requirements**:
1. **100% Coverage**: Tests MUST validate EVERY value from JSON data, not samples or subsets
2. **Individual Iteration**: Loop through each value and validate individually with `for...of` or similar
3. **NO Sampling**: Testing only subsets is NOT acceptable
4. **NO Hardcoded Values**: Tests MUST read ALL values dynamically from JSON files at runtime
5. **Bidirectional Validation**: Check ALL returned values exist in JSON AND all JSON values are returned

**Enforcement**: Any tool that does not validate EVERY individual value MUST be refactored to do so.

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

**Do NOT push to remote if any test fails.** Fix issues locally first.

### CI/CD Pipeline
- **Automated Testing**: GitHub Actions runs Node.js tests on every push/PR
- **Fuzzing**: Property-based testing with fast-check runs on every push/PR and weekly
- **Code Quality**: BiomeJS checks for linting and formatting issues
- **Auto-PR Creation**: Automatic Pull Request creation for `claude/*` branches
- **Dependabot**: Automated dependency updates and security patches
- **Release**: Automated npm releases with semantic versioning
- **Distribution**: Package available via `npx` command

#### GitHub Actions Workflow Requirements

**CRITICAL**: All GitHub Actions workflows MUST follow these strict requirements:

1. **Version Pinning**: Pin ALL action versions with commit SHA (no floating versions)
2. **Package Manager**: Always use `npm` and `npx` (not yarn/pnpm)
3. **Node.js Version**: Always use Node.js 22 with npm 11.5.1 explicitly installed
4. **No npm cache**: Forbidden to use `cache: npm` in setup-node (causes PR issues)

### Security Testing

**Status**: ✅ IMPLEMENTED - Property-based testing with fast-check

**Fuzz Targets** (3 components):
1. **Tag Parser** - Random string inputs, JSON parsing edge cases
2. **Tag Validation** - Random key-value pairs, deprecated tag handling
3. **Schema Loader** - Translation lookups, preset/field resolution

**Fuzzing Schedule**:
- **Pull Requests**: Fast fuzzing run
- **Push to Master**: Extended fuzzing with increased iterations
- **Weekly**: Scheduled extended fuzzing (Monday 2 AM UTC)

### E2E Package Testing

**Status**: ✅ IMPLEMENTED - End-to-end package build and runtime tests

**Test Coverage**:
1. **Package Build Verification** - Creates and verifies package tarball
2. **Package Installation Testing** - Installs in isolated environment
3. **STDIO Transport Testing** - Tests default transport mode
4. **HTTP Transport Testing** - Tests production deployment scenario with health checks

## Architecture

### File Organization

**One Tool, One File**: Each MCP tool is implemented in a separate file with corresponding test files. This ensures clarity, maintainability, scalability, and testability.

```
src/
├── index.ts                         # MCP server entry point
├── tools/                           # Tool implementations (one file per tool)
│   ├── index.ts                     # Tool registry exports
│   ├── types.ts                     # Shared type definitions
│   ├── get-preset-details.ts        # ✅ Preset tool
│   ├── get-tag-values.ts            # ✅ Tag query tool
│   ├── search-presets.ts            # ✅ Preset tool
│   ├── search-tags.ts               # ✅ Tag query tool
│   ├── suggest-improvements.ts      # ✅ Validation tool
│   ├── validate-tag.ts              # ✅ Validation tool
│   └── validate-tag-collection.ts   # ✅ Validation tool
├── utils/                           # Helper functions
│   ├── schema-loader.ts             # Schema loader with caching
│   ├── logger.ts                    # Configurable logging
│   └── tag-parser.ts                # Text/JSON tag parser
└── types/                           # TypeScript type definitions
    ├── index.ts                     # Core type definitions
    └── tool-definition.ts           # OsmToolDefinition interface
tests/
├── tools/                           # Unit tests (one file per tool)
├── integration/                     # Integration tests (one file per tool)
├── utils/                           # Utility tests
├── e2e/                             # End-to-end tests
└── fuzz/                            # Fuzz tests
```

### Architectural Layers

The server follows a modular architecture with distinct layers:
1. **Schema Layer**: Loads and indexes the tagging schema
2. **Tool Layer**: Implements MCP tools that query the schema (one file per tool)
3. **Validation Layer**: Provides tag validation logic
4. **Server Layer**: MCP server setup and tool registration

### Naming Conventions

- **Tool files**: `kebab-case` matching tool name
- **Test files**: Tool name + `.test.ts` suffix
- **Shared types**: Grouped in `tools/types.ts` to avoid duplication
- **Tool ordering**: Tools returned in **alphabetical order** by name for API predictability

## Template System

**Status**: ✅ IMPLEMENTED - Field template expansion for presets

The template system allows presets to reference commonly used groups of fields using the `{@templates/name}` syntax. During field expansion (in `get_preset_details` tool), these references are replaced with the actual field IDs.

### Available Templates

| Template Name | Field IDs | Description |
|---------------|-----------|-------------|
| `contact` | `["email", "phone", "website", "fax"]` | Contact information fields |
| `internet_access` | `["internet_access", "internet_access/fee", "internet_access/ssid"]` | Internet connectivity fields |
| `poi` | `["name", "address"]` | Point of interest basic fields |
| `crossing/*` | Various crossing-related field arrays | Highway crossing fields |

**Implementation**: Templates are defined in `src/tools/get-preset-details.ts` and validated against actual `fields.json` data.

## MCP SDK Tool Structure

**Status**: ✅ IMPLEMENTED - Using modern MCP SDK tool registration API

All tools implement the `OsmToolDefinition` interface with:

1. **name**: Tool identifier (e.g., "get_tag_info")
2. **config()**: Returns tool configuration with inputSchema (Zod validation)
3. **handler**: Async function with parameter destructuring

### Tool Registration Pattern

```typescript
// Current implementation in src/index.ts
for (const tool of tools) {
    mcpServer.registerTool(tool.name, tool.config(), tool.handler);
}
```

### Adding New Tools

1. **Create tool file**: `src/tools/tool-name.ts`
2. **Implement OsmToolDefinition interface**
3. **Export tool**: Add to `src/tools/index.ts`
4. **Write tests**: Unit and integration tests
5. **Document**: Add API documentation in `docs/api/`

## Data Sources and Usage

### Schema Data Files

| File | Purpose | Usage in Project |
|------|---------|------------------|
| `presets.json` | Feature presets with tags, geometry, fields | ✅ Core data - ALL tools |
| `fields.json` | Tag field definitions (types, options, validation) | ✅ Core data - ALL tools |
| `translations/en.json` | UI strings: names, labels, descriptions | ⚠️ LIMITED - 2 tools only |
| `deprecated.json` | Deprecated tag mappings | ✅ Validation tools |
| `preset_categories.json` | Category membership | ✅ Category tools |

**IMPORTANT**: Files are **complementary** - each contains unique data that cannot be replaced by others.

### Validation Tools - MCP Server Context

**Purpose**: This is an **MCP server for AI assistants**, not a form-building UI like iD editor.

**Key difference**:
- **Form-based editors**: Validation = "what to show, when to show, how to show"
- **MCP server**: Validation = "data quality analysis, education, error detection"

#### Use Cases for AI Assistants

1. **Educational/Explaining**: "Can I use amenity=parking_lot?" → AI uses validate_tag → "Doesn't exist, did you mean amenity=parking?"
2. **Data Quality Analysis**: Analyze OSM exports for deprecated tags and issues
3. **Code Review/Import Validation**: Detect typos in import scripts
4. **Data Completeness Check**: Suggest missing common tags

## Development Status

**Current Phase: Phase 8 - COMPLETE ✅**

**Status**: Production-ready MCP server with 7 optimized tools providing complete OSM tagging schema functionality with full localization support and template expansion.

### Phase Summary

**Phase 1: Project Setup ✅ COMPLETE**
- TypeScript project structure, dependencies, BiomeJS, CI/CD pipeline, MCP server implementation

**Phase 2: Schema Integration ✅ COMPLETE**
- Type definitions, schema loader, caching, indexing system, query operations

**Phase 3: Core Tool Implementation ✅ COMPLETE (7 tools)**
- All 7 tools implemented with full test coverage
- 7 additional tools deemed redundant and not implemented
- Design favors composition over convenience wrappers

**Phase 4: Testing ✅ COMPLETE**
- Comprehensive test suite for all tools
- Unit, integration, and e2e package tests
- All tests passing with real OpenStreetMap data

**Phase 5: Documentation ✅ COMPLETE**
- Comprehensive user and developer documentation
- API documentation framework
- Installation, configuration, usage, troubleshooting guides

**Phase 6: Optimization & Polish ✅ COMPLETE**
- Schema loading optimization, logging support, package size optimization

**Phase 7: Distribution & Deployment ✅ COMPLETE**
- NPM publishing with SLSA Level 3 provenance and SBOM
- Docker support with security scanning and image signing
- Multi-transport protocols (stdio, HTTP)
- Docker Compose configurations with health checks
- Release management with changesets

**Phase 8: Schema Builder API Refactor ✅ COMPLETE**
- Full localization support across all tools
- Template system implementation
- Structured responses with human-readable names
- Complete API documentation for all tools

### Current Status

**All Systems Operational** ✅:
- Build: Passing
- Tests: All passing
- Type checking: No errors
- Linting: Clean

**Architecture Status**:
- ✅ **Modern MCP SDK**: Using `McpServer` class
- ✅ **Modular Architecture**: One file per tool
- ✅ **Alphabetical Tool Ordering**: Predictable API
- ✅ **Optimized Tool Set**: 7 non-redundant tools providing complete functionality

## Distribution & Deployment

### NPM Publishing ✅ IMPLEMENTED

**Status**: Full implementation with SLSA Level 3 attestations

- **GitHub Actions Workflow**: Automated publishing triggered by version tags
- **NPM Provenance**: Build provenance attestations linking to GitHub Actions builds
- **SLSA Level 3 Attestations**: Comprehensive build provenance with SBOM
- **Security Documentation**: Complete user and maintainer guides

### Container Images ✅ IMPLEMENTED

**Status**: Full implementation with security scanning and image signing

- **GitHub Container Registry (ghcr.io)**: Multi-arch support (amd64/arm64)
- **Image Scanning**: Automated vulnerability scanning with Trivy
- **Image Signing**: Cosign keyless signatures for verification
- **Versioning Strategy**: Semantic versions, latest stable, development edge

### Transport Protocols ✅ IMPLEMENTED

**Supported Transports**:

1. **stdio (Standard Input/Output)** ✅
   - Default transport for MCP clients
   - Use case: CLI tools, Claude Desktop integration

2. **HTTP Streamable** ✅
   - HTTP-based streaming with Server-Sent Events
   - Stateful session management with UUID session IDs
   - Keep-alive ping messages to prevent timeouts
   - Use case: Web applications, API gateways, scalable deployments

### Public Service Deployment ✅ IMPLEMENTED

**Health Check Endpoints**:
- **Liveness probe**: `/health` endpoint returns server status
- **Readiness probe**: `/ready` endpoint validates schema loaded

**Docker Compose Configurations**:
- **Production**: Latest stable image, resource limits, security hardening
- **Development**: Debug logging, higher resources, hot reload
- **Testing**: Local build configuration

## Future Enhancements

Based on analysis of [schema-builder](https://github.com/ideditor/schema-builder), the following enhancements are planned:

1. **Enhanced Tag Validation**: Geometry constraints, prerequisite tag validation, field type constraints
2. **Field Inheritance Resolution**: Complete field lists including inherited fields from parent presets
3. **Conditional Field Analysis**: Dynamic field visibility based on tag values
4. **Advanced Deprecation Transformations**: Complex tag splitting and recombination
5. **Tag Quality Scoring**: Score tag completeness and quality for features

**Implementation Priority**:
- Phase 3.3: Enhanced validation, basic deprecation improvements
- Phase 5+: Field inheritance, conditional analysis, quality scoring

**Compatibility**: All enhancements are additive - existing tools remain unchanged, no breaking changes.

## Documentation Structure

The project maintains comprehensive documentation organized by user type for clear navigation and maintenance.

### Documentation Organization

**User Documentation (docs/user/):**
- `docs/user/README.md` - User documentation overview and navigation
- `docs/user/installation.md` - Installation instructions for all methods (npx, Docker, source)
- `docs/user/configuration.md` - Configuration for Claude Code/Desktop and custom clients
- `docs/user/usage.md` - Usage examples, workflows, and best practices
- `docs/user/examples.md` - Comprehensive examples for all tools
- `docs/user/troubleshooting.md` - Common issues and solutions

**API Documentation (docs/api/):**
- `docs/api/README.md` - API overview and quick reference
- `docs/api/{tool_name}.md` - Detailed documentation per tool (7 tools)
- `docs/api/NOTE.md` - Documentation pattern guide

**Development Documentation (docs/development/):**
- `docs/development/README.md` - Developer overview and navigation
- `docs/development/contributing.md` - Contribution guidelines (TDD workflow)
- `docs/development/development.md` - Development setup, commands, debugging
- `docs/development/release-process.md` - Release and publishing process
- `docs/development/fuzzing.md` - Fuzzing infrastructure and security testing
- `docs/development/roadmap.md` - Development plan and future features

**Deployment Documentation (docs/deployment/):**
- `docs/deployment/README.md` - Deployment overview and navigation
- `docs/deployment/deployment.md` - Docker Compose deployment guide
- `docs/deployment/security.md` - Security features, provenance, SLSA, and SBOM

**Root Documentation:**
- `README.md` - Compact overview with links to detailed docs
- `CHANGELOG.md` - Project history (Keep a Changelog format)
- `CLAUDE.md` - Technical implementation notes (this file)

### Documentation Update Workflow

When completing a phase or major feature:

1. **Update docs/user/** (if user-facing changes):
   - Installation changes → `docs/user/installation.md`
   - Configuration changes → `docs/user/configuration.md`
   - New usage patterns → `docs/user/usage.md` and `docs/user/examples.md`
   - New issues/solutions → `docs/user/troubleshooting.md`

2. **Update docs/api/** (if API changes):
   - New tools/features → `docs/api/{tool_name}.md`
   - API overview updates → `docs/api/README.md`

3. **Update docs/development/** (if development process changes):
   - Contribution process → `docs/development/contributing.md`
   - Development setup → `docs/development/development.md`
   - Release process → `docs/development/release-process.md`
   - Roadmap progress → `docs/development/roadmap.md`

4. **Update docs/deployment/** (if deployment changes):
   - Deployment options → `docs/deployment/deployment.md`
   - Security features → `docs/deployment/security.md`

5. **Update root documentation**:
   - README.md → Update "Project Status" section
   - CHANGELOG.md → Add entry in [Unreleased] section
   - CLAUDE.md → Update "Development Status" section

### Documentation Maintenance

- Keep README.md compact - link to detailed docs in appropriate categories
- Update all documentation together to maintain consistency
- Follow established patterns for new documentation
- Use markdown features: tables, code blocks, links, details/summary
- Include practical examples with real OSM data
- Cross-link related documentation within appropriate categories
- **CRITICAL**: When syntax or tool behavior changes, update ALL documentation where that syntax is explained

## Development Workflow

This project follows an **intent-based workflow** organized around features, not individual commands.

### Workflow Principles

1. **Clean State Before New Work**: When instructed to "refresh" or "clean", switch to master, pull latest, read CLAUDE.md
2. **Feature Branch Creation**: Create branch ONLY when instructed to push changes. Branch naming: `claude/<feature-description>-<session-id>`
3. **Feature Branch Lifecycle**: Continue using same branch for all related changes until explicitly told "new feature"
4. **Testing Requirements**: Run tests for code changes, skip for documentation-only changes

### Intent-Based Actions

- **Refresh/Clean Environment**: Delete local branches, checkout master, pull latest, read CLAUDE.md
- **Push/Send Changes**: Create/update feature branch, commit and push changes
- **Start New Feature**: Perform refresh workflow, begin new feature work locally

## License

GNU General Public License v3.0 (GPL-3.0)

## Key Resources

- MCP Documentation: https://modelcontextprotocol.io
- OpenStreetMap Tagging Schema: https://github.com/openstreetmap/id-tagging-schema
- OSM Wiki Tags: https://wiki.openstreetmap.org/wiki/Tags