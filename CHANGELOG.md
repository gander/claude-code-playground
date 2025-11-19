# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-19

### Added

- **publish**: Add .npmrc with provenance configuration
- **publish**: Enhance workflow with SLSA attestations and SBOM
- Implement Server-Sent Events (SSE) transport
- Add Docker Compose deployment with health check endpoints
- Add lefthook for automated code quality checks
- **release**: Add cliff-jumper and git-cliff for automated releases
- Add ToolDefinition interface for MCP SDK migration
- Migrate get_schema_stats to new MCP SDK tool registration
- Migrate get_categories to new MCP SDK tool registration
- Migrate get_category_tags to new MCP SDK tool registration
- Migrate get_tag_info to new MCP SDK tool registration
- Migrate get_tag_values to new MCP SDK tool registration
- Migrate search_tags to new MCP SDK tool registration
- Migrate get_related_tags and search_presets to new MCP SDK
- Complete MCP SDK migration - all 14 tools migrated
- Use pkg.version from package.json for application version
- Add structured value information with localized titles and descriptions
- Add structured value information with preset names
- Add value descriptions to get_tag_values tool
- Add text format support for validate_tag_collection and suggest_improvements
- Add hourly cleanup workflow for packages and workflow runs
- Update cleanup automation to Auto Cleanup with separate dev/tagged handling ([#115](https://github.com/gander-tools/osm-tagging-schema-mcp/issues/115))
- **transport**: Add SSE keep-alive ping messages for HTTP transport
- **http**: Add CORS support for MCP Inspector UI compatibility
- Remove HTTP/SSE transport support - stdio only
- Remove SSE transport support - HTTP only
- Add comprehensive fuzzing infrastructure with fast-check
- Add webhook notification for Docker latest tag publication

### Bugfix

- Sort MCP tools alphabetically and improve test robustness ([#37](https://github.com/gander-tools/osm-tagging-schema-mcp/issues/37))

### Changed

- Move tool definitions to individual files with handlers
- Replace deprecated Server with McpServer
- Convert SchemaLoader to singleton pattern
- Remove old tool registration system
- Add unified OsmToolDefinition interface
- Use parameter destructuring in get_category_tags handler
- Simplify tool registration with loop pattern
- Remove 6 tag query tools and add input trimming to remaining tools
- Replace custom cleanup scripts with ready-made GitHub Actions

### Docs

- Update CLAUDE.md with current project state
- Update README.md with Phase 3 and Phase 4 progress
- Add schema-builder inspired future enhancements

### Documentation

- **security**: Add comprehensive security and provenance documentation
- **readme**: Add npm provenance and SLSA badges
- **contributing**: Add comprehensive npm publishing guide
- **claude**: Mark NPM Publishing with Provenance as completed
- **security**: Add Scorecard maintainer annotations
- Refresh documentation and implement hybrid version pinning
- Cleanup and simplify Future Plans section in CLAUDE.md
- Update ROADMAP.md to match simplified Future Plans
- Add http transport option and clarify transport naming
- Add MCP SDK migration plan to CLAUDE.md
- Add handler function details and Zod validation examples
- Clarify Zod v3 schema format for MCP tools
- Update CLAUDE.md with parameter destructuring pattern
- Add note about integration test failures
- Add badges and document skipped tests
- Add data sources and validation context analysis to CLAUDE.md
- Update CLAUDE.md to reflect actual codebase state ([#110](https://github.com/gander-tools/osm-tagging-schema-mcp/issues/110))
- Add MCP Inspector testing instructions with HTTP/CORS

### Feature

- Implement get_related_tags tool (Tag Query Tools 3.1 COMPLETED)

### Fix

- Get_tag_values now returns ALL values from fields.json + presets
- Search_tags now searches fields.json for complete coverage
- Docker workflow runs only after PR merge

### Fixed

- **security**: Apply least privilege to workflow permissions
- **security**: Pin npm dependencies to specific versions
- **security**: Split workflow into separate jobs for minimal permissions
- **security**: Address Scorecard alerts with npx and documentation
- **tests**: Adjust deprecated tags count threshold
- **security**: Resolve @conventional-changelog/git-client vulnerability
- **ci**: Remove NODE_AUTH_TOKEN for npm Trusted Publishers ([#80](https://github.com/gander-tools/osm-tagging-schema-mcp/issues/80))
- **docker**: Resolve multi-platform build failures with npm not found ([#87](https://github.com/gander-tools/osm-tagging-schema-mcp/issues/87))
- **docker**: Add platform flag to runtime stage and remove SHA pinning ([#88](https://github.com/gander-tools/osm-tagging-schema-mcp/issues/88))
- **docker**: Skip postinstall scripts and remove redundant platform flag
- **docker**: Disable postinstall scripts during dependency installation
- Add biome-ignore comment for heterogeneous tools array
- Improve check_deprecated to return ALL deprecated cases with clear type distinction
- Correct TypeScript build output structure
- **docker**: Change image tags from sha256 to short commit hash
- Regenerate package-lock.json with all platform-specific dependencies
- Improve API error handling and org/user detection in cleanup workflow
- URL-encode package names in cleanup workflow API calls
- Use PAT_PACKAGES token and simplify cleanup workflow
- Resolve workflow runs cleanup pagination and counter bug
- Add modern entry point fields for bundlephobia compatibility
- Docker 'latest' tag only on GitHub Release
- Remove disabled CodeQL workflow and fix branch references
- Pin GitHub Actions to specific commit SHAs in fuzz workflow
- Add CodeQL workflow and pin dependencies for Scorecard compliance
- Remove custom CodeQL workflow to resolve conflict with default setup

### Miscellaneous

- Prepare package for npm publication
- Update package-lock.json for hybrid version pinning
- Add biome-ignore comments for dynamic translation types
- Simplify Docker image tags

### Refactor

- Split tools and tests into separate files (one tool per file)
- Split integration tests into modular per-tool files

### Security

- Add Phase 7 (Distribution & Deployment) future plans
- Fix OpenSSF Scorecard issues in cleanup workflow
- Pin GitHub Actions to specific commit SHAs

### Testing

- Achieve 100% data coverage - eliminate ALL sampling violations
- Skip parameter validation tests for Zod migration

## [Unreleased]

### Changed

#### Phase 8: Schema Builder API Refactor (Complete)

**Translation Infrastructure (8.1):**
- Added full localization support to `SchemaLoader` class
- Implemented `getPresetName()`, `getFieldLabel()`, `getFieldOptionName()`, `getCategoryName()` methods
- Automatic fallback formatting for missing translations (ucfirst + replace underscores with spaces)
- Loads `translations/en.json` from schema package

**Tool API Refactors (8.2-8.8):**
All 7 tools updated with localized responses and enhanced functionality:

- **validate_tag (8.2)**: Returns `keyName`, `valueName`, `replacementDetailed` with localized names; removed redundant `fieldExists` and `availableOptions` fields
- **get_tag_values (8.3)**: Structured response with `key`, `keyName`, `values`, `valuesDetailed`; removed `description` field
- **search_tags (8.4)**: Separate `keyMatches` and `valueMatches` with localized names; no more random values for key-only matches
- **get_preset_details (8.5)**: Accepts multiple input formats (preset ID, tag notation, JSON object); returns `name`, `tagsDetailed` with localized names; automatic field reference expansion (`{preset_id}`, `@templates/name`)
- **validate_tag_collection (8.6)**: Simplified response with `validCount`, `deprecatedCount`, `errorCount`; uses localized `validate_tag` for each tag
- **suggest_improvements (8.7)**: Structured suggestions with `operation`, `message`, `key`, `keyName`; returns `matchedPresetsDetailed` with preset names
- **search_presets (8.8)**: Returns `name` and `tagsDetailed` with localized names for each preset

**Localization Enhancements (8.9):**
- All 7 tools include human-readable, localized names for keys, values, and presets
- Comprehensive fallback logic for missing translations
- Full documentation in `docs/api/README.md` Localization section

**Template System (8.10):**
- Field template expansion for `{@templates/name}` references in `get_preset_details`
- 10 template patterns supported (contact, internet_access, poi, crossing/*, etc.)
- All template definitions validated against `fields.json` from schema
- 13 comprehensive unit tests + 6 integration tests
- Full documentation in CLAUDE.md Template System section

**Documentation & Testing (8.11):**
- Created API documentation for all 7 tools (`docs/api/*.md`)
- Updated `docs/usage.md` with Phase 8 examples showing localized responses
- Updated `docs/api/README.md` with comprehensive localization documentation
- All tests passing (199 unit + 102 integration tests)

## [0.1.0] - 2025-01-15

Initial release of the OpenStreetMap Tagging Schema MCP Server.

### Added

#### Core Features (14 MCP Tools)

**Tag Query Tools:**
- `get_tag_info` - Get comprehensive information about a tag key (values, type, field definition)
- `get_tag_values` - Get all possible values for a tag key
- `get_related_tags` - Find tags commonly used together with frequency counts
- `search_tags` - Search for tags by keyword in fields and presets

**Preset Tools:**
- `search_presets` - Search presets by keyword or tag with geometry filtering
- `get_preset_details` - Get complete preset configuration
- `get_preset_tags` - Get recommended tags for a preset

**Validation Tools:**
- `validate_tag` - Validate single tag key-value pairs
- `validate_tag_collection` - Validate complete tag collections
- `check_deprecated` - Check for deprecated tags with replacement suggestions
- `suggest_improvements` - Suggest improvements for tag collections

**Schema Exploration Tools:**
- `get_categories` - List all tag categories
- `get_category_tags` - Get tags in a specific category
- `get_schema_stats` - Get schema statistics with version information

#### Infrastructure

**Schema Integration:**
- Schema loader with caching and indexing for fast lookups
- Always-on indexing with preloading at server startup
- Field key index for O(1) field lookups
- Schema version tracking from package metadata
- Schema structure validation to detect breaking changes
- Graceful error handling with descriptive messages

**Testing (TDD Methodology):**
- 299 unit tests with comprehensive coverage
- 107 integration tests for MCP server
- JSON Data Integrity Tests validating all tools against source data
- 100% coverage: ALL 799 tag keys + ALL 1707 presets validated
- Bidirectional validation for complete data integrity
- Order-independent test assertions

**Distribution & Security:**
- npm publishing with provenance (SLSA Level 3)
- Build provenance attestations linking to GitHub Actions
- SBOM (Software Bill of Materials) in CycloneDX format
- Docker images with multi-stage builds (Alpine Linux)
- Multi-architecture support (amd64, arm64)
- Trivy vulnerability scanning
- Cosign keyless image signing with OIDC
- Package published to npm registry (via npx)
- Container images published to GitHub Container Registry

**Transport Protocols:**
- stdio transport (default for CLI/desktop integration)
- HTTP Streamable transport for web clients
- SSE transport (legacy alias for HTTP)
- Configurable via environment variables (TRANSPORT, PORT, HOST)

**Deployment:**
- Docker Compose configurations (production, development, test)
- Health check endpoints (/health, /ready)
- Resource limits and security hardening
- Read-only filesystem, non-root user execution

**Logging & Debugging:**
- Built-in logger with configurable levels (SILENT, ERROR, WARN, INFO, DEBUG)
- LOG_LEVEL environment variable configuration
- Structured log output with timestamps and context
- Comprehensive logging in server lifecycle

#### Documentation

**User Documentation:**
- Installation guide (npx, source, Docker)
- Configuration guide for Claude Code/Desktop and custom clients
- Usage guide with examples and workflows
- Complete API reference for all 14 tools
- Troubleshooting guide
- Deployment guide with Docker Compose
- Security documentation (provenance, SLSA, SBOM)

**Developer Documentation:**
- Contribution guidelines with TDD workflow
- Development guide with setup and debugging
- Development roadmap
- Technical implementation notes (CLAUDE.md)

#### Code Quality

- BiomeJS 2.3.4 for linting and formatting
- TypeScript 5.9 with strict type checking
- GitHub Actions CI/CD (testing, Docker builds, npm publishing)
- Dependabot for automated dependency updates
- Modular architecture (one tool per file)
- Alphabetical tool ordering for predictable API

### Fixed

**Bug Fixes:**
- Fixed `search_tags` to search both fields.json and presets for complete coverage
- Fixed tag key format to use proper OSM colon separator (e.g., `toilets:wheelchair` instead of `toilets/wheelchair`)
- Fixed alphabetical tool sorting for predictable API responses
- Fixed preset matching to skip presets with empty tags
- Fixed Docker workflow to only run after PR merge

### Security

- Package files whitelist for minimal npm package size (59% reduction)
- Non-root user execution in Docker containers
- Read-only filesystem in production deployments
- No new privileges security option
- Network isolation with bridge networks
- Vulnerability scanning in CI/CD pipeline
- Image signing for supply chain security
- SBOM for transparency in dependencies

## Project Information

- **Repository**: https://github.com/gander-tools/osm-tagging-schema-mcp
- **npm Package**: https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp
- **Docker Images**: https://github.com/gander-tools/osm-tagging-schema-mcp/pkgs/container/osm-tagging-schema-mcp
- **License**: GNU General Public License v3.0
