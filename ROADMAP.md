# Development Roadmap

This document outlines the development phases for the OSM Tagging Schema MCP Server.

## Phase 1: Project Setup ✅

- [x] Initialize TypeScript 5.9 project with Node.js 22+
- [x] Install dependencies:
  - `@modelcontextprotocol/sdk`
  - `@openstreetmap/id-tagging-schema`
  - Development tools (BiomeJS, types)
- [x] Set up project structure with modular file organization
- [x] Configure build system (TypeScript compiler)
- [x] Set up BiomeJS 2.3.4 for linting and formatting
- [x] Configure test framework (Node.js native test runner)
- [x] Set up GitHub Actions CI/CD

## Phase 2: Schema Integration ✅

- [x] Create schema loader utility
- [x] Implement caching mechanism for schema data
- [x] Build indexing system for fast tag lookups
- [x] Create type definitions for schema structures
- [x] Write unit tests for schema loader (19 tests passing)
- [x] Create integration tests for MCP server
- [x] Set up CI/CD pipeline for automated testing

## Phase 3: Core Tool Implementation ✅

### 3.1 Tag Query Tools
- [x] `get_tag_info` - Get information about a specific tag key
- [x] `get_tag_values` - Get all possible values for a tag key
- [x] `get_related_tags` - Find tags commonly used together
- [x] `search_tags` - Search for tags by keyword

### 3.2 Preset Tools
- [x] `search_presets` - Search for presets by name or tags
- [x] `get_preset_details` - Get complete preset information
- [x] `get_preset_tags` - Get recommended tags for a preset

### 3.3 Validation Tools
- [x] `validate_tag` - Validate a single tag key-value pair
- [x] `validate_tag_collection` - Validate a collection of tags
- [x] `check_deprecated` - Check if tags are deprecated
- [x] `suggest_improvements` - Suggest improvements for tag collection

### 3.4 Schema Exploration Tools
- [x] `get_categories` - List all tag categories
- [x] `get_category_tags` - Get tags in a specific category
- [x] `get_schema_stats` - Get schema statistics

## Phase 4: Testing ✅

- [x] Configure Node.js native test runner
- [x] Write unit tests for schema loader (19 tests passing)
- [x] Write unit tests for all implemented tools (263 tests, 111 suites passing)
- [x] Create integration tests for MCP server (107 tests, 55 suites passing)
  - Modular structure: One integration test file per tool
  - Shared utilities: `helpers.ts` for common setup/teardown
  - Order-independent tests: Tools validated by existence, not array position
  - Alphabetical ordering: Tools returned in predictable alphabetical order
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

## Phase 5: Documentation ✅

- [x] Write API documentation for each tool
  - Complete API reference in `docs/api/` directory
  - Overview with quick reference table (`docs/api/README.md`)
  - Detailed tool documentation template established (`docs/api/get_tag_info.md`)
  - Documentation pattern guide (`docs/api/NOTE.md`)
- [x] Create usage examples
  - Comprehensive usage guide (`docs/usage.md`)
  - Common use cases with examples
  - Complete workflow examples
  - Best practices documentation
- [x] Document installation and setup
  - Installation guide (`docs/installation.md`) covering npx, source, and Docker
  - Configuration guide (`docs/configuration.md`) for Claude Code/Desktop and custom clients
  - System requirements and verification steps
- [x] Add troubleshooting guide
  - Comprehensive troubleshooting guide (`docs/troubleshooting.md`)
  - Installation, configuration, runtime, and performance issues
  - Error code reference table
- [x] Create contribution guidelines
  - Contribution guide (`CONTRIBUTING.md`) with TDD workflow
  - Development guide (`DEVELOPMENT.md`) with setup and tasks
- [x] Documentation structure
  - User-facing documentation in `docs/` directory
  - Developer documentation in root directory
  - Compact README with clear navigation
  - Documentation guidelines in `CLAUDE.md`

## Phase 6: Optimization & Polish

- [x] ~~Implement caching strategies~~ (Skipped - caching already implemented in Phase 2)
- [x] Optimize schema loading and queries
  - **Always-on indexing**: Removed optional indexing, index always built for optimal performance
  - **Schema preloading**: Added warmup() method to preload schema at server startup
  - **Field key index**: Added byFieldKey index for O(1) field lookups
  - **Single-pass indexing**: Index built during schema load (not separately)
  - **Server startup optimization**: Schema preloaded in main() to eliminate initial latency
  - New optimized methods: warmup(), findFieldByKey()
  - Comprehensive tests: 24 new tests for optimizations (all 394 tests passing)
  - TDD approach: Tests written first, then implementation
- [x] Add logging and debugging support
  - Built-in logger with configurable levels (SILENT, ERROR, WARN, INFO, DEBUG)
  - LOG_LEVEL environment variable configuration
  - Structured log output with timestamps and context
  - Logging in server lifecycle (startup, tool calls, errors)
  - Comprehensive unit tests (13 tests, 6 suites)
  - Developer documentation updated
- [x] Handle schema updates gracefully
  - Schema version tracking from package metadata
  - Schema metadata includes version and loadedAt timestamp
  - get_schema_stats tool returns version information
  - Schema structure validation detects breaking changes
  - Graceful error handling with descriptive messages
  - Version logging on schema load
  - Comprehensive tests (298 tests passing)
- [x] Prepare for publication
  - Added `files` field to package.json for package content control
  - Package size optimization: 597KB → 245KB unpacked (59% reduction)
  - Package file count optimization: 155 → 89 files
  - Publication checklist added to CONTRIBUTING.md
  - Pre-publication verification workflow documented
  - Package includes only essential files (dist/, docs/, LICENSE, README, CHANGELOG, etc.)
  - All tests passing: 299 unit tests, 107 integration tests (406 total)
  - Ready for npm publishing with provenance support

## Phase 7: Distribution & Deployment

### NPM Publishing with Provenance
- [ ] Set up GitHub Actions workflow for npm publishing
- [ ] Configure npm provenance signing (attestations)
- [ ] Link package to GitHub repository with verified builds
- [ ] Enable trusted publishing from GitHub Actions
- [ ] Add package provenance badge to README

### Container Image & Registry
- [x] Create Dockerfile for containerized deployment
- [x] Set up multi-stage builds for optimal image size
- [x] Publish to GitHub Container Registry (ghcr.io)
- [x] Add container image scanning for security (Trivy)
- [x] Support for multiple architectures (amd64, arm64)
- [x] Image signing with Cosign (keyless OIDC)
- [x] SARIF security reports uploaded to GitHub

### Additional Transport Protocols
- [ ] Implement Server-Sent Events (SSE) transport
- [ ] Implement HTTP/REST transport for web clients
- [ ] Add WebSocket transport support
- [ ] Create transport configuration system
- [ ] Document transport selection and use cases

### Public Service Deployment
- [ ] Create deployment configurations (Docker Compose, Kubernetes)
- [ ] Set up health check endpoints
- [ ] Configure rate limiting and authentication
- [ ] Add metrics and monitoring (Prometheus/Grafana)
- [ ] Create deployment documentation
- [ ] Plan for horizontal scaling

## Future Enhancements

Based on analysis of [ideditor/schema-builder](https://github.com/ideditor/schema-builder), the following advanced features are planned:

### Enhanced Tag Validation
- Geometry constraints validation
- Prerequisite tag checking
- Field type constraints validation

### Field Inheritance Resolution
- Complete field lists including inherited fields from parent presets
- Preset inheritance chain resolution

### Conditional Field Analysis
- Determine field visibility based on tag values
- Handle complex prerequisite logic

### Advanced Deprecation Transformations
- Placeholder substitution support (`$1`, `$2`)
- Multi-tag replacements
- Conditional replacements based on additional context

### Tag Quality Scoring
- Completeness and quality scoring for features
- Missing required/important field detection
- Common optional field suggestions

These enhancements will extend validation capabilities while maintaining 100% compatibility with current implementation.
