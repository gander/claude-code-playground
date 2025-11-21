# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-21

### Added

- Add safe release workflow with manual approval ([#180](https://github.com/gander-tools/osm-tagging-schema-mcp/issues/180))

### Changed

- Reorganize and rename GitHub workflows

### Documentation

- Add GitHub Actions workflow requirements to CLAUDE.md

### Fixed

- Update changeset config to use master branch instead of main

### Miscellaneous

- Remove manual release workflow file

## [1.0.1] - 2025-11-20

### Added

- Add manual release workflow with GitHub Actions

### CI/CD

- Install latest npm in publish workflow
- Pin npm version in publish workflow
- Update npm installation reference and enforce npm engine version
- Pin npm installation to version 11.6.3 in publish workflow
- Remove npm cache option from publish workflow
- Downgrade npm to version 11.5.1 in publish workflow
- Fix npm 11 always-auth deprecation warning ([#167](https://github.com/gander-tools/osm-tagging-schema-mcp/issues/167))
- Run tests on merge to master
- Run tests on merge to master ([#169](https://github.com/gander-tools/osm-tagging-schema-mcp/issues/169))

### Documentation

- Remove hardcoded test counts from README badges
- Remove outdated version numbers and test counts from CLAUDE.md
- Enhance README with comprehensive "What is this?" and "What this is NOT" sections

### Fixed

- Change postinstall to prepare for lefthook
- Run OpenSSF Scorecard only on schedule, not in PRs ([#175](https://github.com/gander-tools/osm-tagging-schema-mcp/issues/175))
- Remove unsupported --release-as option from manual release workflow
- Remove double 'v' prefix in manual release workflow tag creation
- Use force push for release branch and tag to handle re-runs

### Miscellaneous

- Update cliff-jumper configuration for GitHub release and PR automation

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

## Project Information

- **Repository**: https://github.com/gander-tools/osm-tagging-schema-mcp
- **npm Package**: https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp
- **Docker Images**: https://github.com/gander-tools/osm-tagging-schema-mcp/pkgs/container/osm-tagging-schema-mcp
- **License**: GNU General Public License v3.0
