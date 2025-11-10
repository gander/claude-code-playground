# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Phase 3: Core Tool Implementation ✅
- **Tag Query Tools**:
  - `get_tag_info` - Get comprehensive information about a tag key
  - `get_tag_values` - Get all possible values for a tag key
  - `get_related_tags` - Find tags commonly used together with frequency counts
  - `search_tags` - Search for tags by keyword in fields and presets

- **Preset Tools**:
  - `search_presets` - Search presets by keyword or tag with geometry filtering
  - `get_preset_details` - Get complete preset configuration
  - `get_preset_tags` - Get recommended tags for a preset

- **Validation Tools**:
  - `validate_tag` - Validate single tag key-value pairs
  - `validate_tag_collection` - Validate complete tag collections
  - `check_deprecated` - Check for deprecated tags with replacement suggestions
  - `suggest_improvements` - Suggest improvements for tag collections

- **Schema Exploration Tools**:
  - `get_categories` - List all tag categories
  - `get_category_tags` - Get tags in a specific category
  - `get_schema_stats` - Get schema statistics

#### Infrastructure & Security
- Docker support with multi-stage builds
- GitHub Container Registry (ghcr.io) publishing
- Trivy vulnerability scanning
- Cosign keyless image signing
- Multi-architecture support (amd64, arm64)
- SARIF security reports to GitHub Security tab
- Comprehensive test coverage (263 unit tests, 107 integration tests)

#### Testing
- JSON Data Integrity Tests against actual schema data
- 100% coverage validation (799 tag keys, 1707 presets)
- Bidirectional validation
- Provider pattern for comprehensive data validation
- Order-independent test assertions
- Alphabetical tool ordering

#### Documentation
- Comprehensive README with badges
- TDD methodology documentation
- Docker usage examples
- Security verification instructions

### Changed
- Updated repository reference and documentation structure
- Improved test robustness with order-independent assertions
- Enhanced tool registration with alphabetical ordering

### Fixed
- **search_tags fields.json coverage**: Now searches both fields.json and presets
- **Alphabetical tool sorting**: Tools returned in predictable alphabetical order
- **Tag key format**: Proper OSM colon separator format (e.g., `toilets:wheelchair`)
- **Docker workflow**: Only runs after PR merge, not during PR review
- **Empty preset tags**: Fixed preset matching to skip presets with empty tags

## [0.1.0] - Initial Development

### Added
- Initial project setup with TypeScript 5.9
- MCP SDK integration
- @openstreetmap/id-tagging-schema integration
- Schema loader with caching and indexing
- BiomeJS 2.3.4 for code quality
- GitHub Actions CI/CD pipeline
- Dependabot for automated dependency updates
- Node.js native test runner with TDD approach
