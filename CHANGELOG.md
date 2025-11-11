# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No unreleased changes.

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
