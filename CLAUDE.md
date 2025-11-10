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
- **CI/CD**: GitHub Actions (automated testing, Docker builds)
- **Dependencies**: Dependabot (automated updates)
- **Distribution**: npm registry (via npx), GitHub Container Registry (Docker images)
- **Containerization**: Docker with multistage builds (Alpine Linux base)

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

#### Testing Requirements for All Tools:

1. **Unit Tests** (`tests/tools/*.test.ts`):
   - Import relevant JSON files: `presets.json`, `fields.json`, `preset_categories.json`
   - Use Node.js `with { type: "json" }` syntax for imports
   - Create "JSON Schema Validation" describe block
   - Verify tool outputs match JSON data exactly (counts, values, structure)
   - Example:
     ```typescript
     import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };

     describe("JSON Schema Validation", () => {
       it("should return data matching JSON", async () => {
         const result = await myTool(loader);
         const expected = Object.keys(presets).length;
         assert.strictEqual(result.count, expected);
       });
     });
     ```

2. **Integration Tests** (`tests/integration/server.test.ts`):
   - Import same JSON files as unit tests
   - Create "JSON Schema Data Integrity" describe block
   - Verify MCP tool responses match JSON data through protocol layer
   - Test end-to-end data flow from JSON → tool → MCP → client

3. **Update Compatibility**:
   - When `@openstreetmap/id-tagging-schema` package updates, tests MUST pass or fail explicitly
   - Failing tests indicate breaking changes in schema data
   - All tools must adapt to maintain compatibility

#### CRITICAL RULE: Individual Value Validation

**EVERY value MUST be validated individually** - this is a non-negotiable requirement for all tools.

**Requirements**:
1. **100% Coverage**: Tests MUST validate EVERY value from JSON data, not samples or subsets
2. **Individual Iteration**: Loop through each value and validate individually with `for...of` or similar
3. **NO Aggregate-Only Comparisons**: While `deepStrictEqual` can supplement tests, it CANNOT be the only validation
4. **NO Sampling**: Testing only 10%, 50%, or any subset is NOT acceptable
5. **NO Hardcoded Values**: Tests MUST read ALL values dynamically from JSON files at runtime
   - Collect ALL unique tag keys from fields.json + presets.json
   - Provider pattern MUST yield EVERY key, not a hardcoded subset
   - Example: ~799 tag keys from JSON, not 5 hardcoded keys like ["amenity", "building", "highway", "natural", "shop"]
6. **Bidirectional Validation**:
   - Check ALL returned values exist in expected JSON data
   - Check ALL expected JSON values are returned by the tool
7. **Clear Error Messages**: Each assertion must identify the specific value that failed

**Examples**:

✅ **CORRECT** - Individual validation:
```typescript
// Validate each returned value exists in JSON
for (const value of returnedValues) {
  assert.ok(
    expectedValues.has(value),
    `Value "${value}" should exist in JSON data`
  );
}

// Validate each JSON value is returned (bidirectional)
for (const expected of expectedValues) {
  assert.ok(
    returnedSet.has(expected),
    `JSON value "${expected}" should be returned`
  );
}
```

❌ **INCORRECT** - Aggregate only:
```typescript
// This alone is NOT enough!
assert.deepStrictEqual(returnedValues, expectedValues);
```

❌ **INCORRECT** - Sampling:
```typescript
// Testing only 10% is NOT acceptable!
for (const key of presetKeySampleProvider()) {
  assert.ok(allKeys.includes(key));
}
```

❌ **INCORRECT** - Hardcoded values:
```typescript
// Hardcoded subset is NOT acceptable!
const testKeys = ["amenity", "building", "highway", "natural", "shop"];
for (const key of testKeys) {
  // test...
}
```

✅ **CORRECT** - Dynamic ALL keys from JSON:
```typescript
// Collect ALL unique tag keys from JSON files dynamically
const allKeys = new Set<string>();

// From fields.json
for (const key of Object.keys(fields)) {
  allKeys.add(key);
}

// From presets.json
for (const preset of Object.values(presets)) {
  if (preset.tags) {
    for (const key of Object.keys(preset.tags)) {
      allKeys.add(key);
    }
  }
  if (preset.addTags) {
    for (const key of Object.keys(preset.addTags)) {
      allKeys.add(key);
    }
  }
}

// Test EVERY key (~799 keys)
for (const key of allKeys) {
  // validate each key individually...
}
```

**Why This Matters**:
- Catches individual data discrepancies that aggregate tests miss
- Provides precise error messages showing exactly which value failed
- Ensures complete data integrity, not partial validation
- No hidden gaps in test coverage

**Enforcement**: Any tool that does not validate EVERY individual value MUST be refactored to do so.

#### Why This Matters:
- Ensures data accuracy: Tools return real OSM schema data, not mock data
- Detects schema changes: Package updates that break compatibility are caught immediately
- Validates implementation: Tool logic correctly processes actual JSON structures
- Maintains trust: Users can rely on data matching the official OSM tagging schema

**Future Implementation**: All new tools created in Phase 3 and beyond MUST follow this testing standard.

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

### File Organization Principles

**One Tool, One File**: Each MCP tool is implemented in a separate file with corresponding test files (both unit and integration). This modular approach ensures:
- **Clarity**: Easy to locate and understand individual tool implementations
- **Maintainability**: Changes to one tool don't affect others
- **Scalability**: New tools can be added without modifying existing files
- **Testability**: Each tool has dedicated tests that can run independently
- **Reduced Complexity**: Integration tests are split per tool, avoiding large monolithic test files

```
src/
├── index.ts              # MCP server entry point
├── tools/                # Tool implementations (one file per tool)
│   ├── types.ts          # Shared type definitions for tools
│   ├── get-schema-stats.ts
│   ├── get-categories.ts
│   ├── get-category-tags.ts
│   ├── get-tag-values.ts
│   ├── search-tags.ts
│   ├── (future tools...)
│   ├── presets.ts        # Preset-related tools (to be split)
│   └── validation.ts     # Validation tools (to be split)
├── utils/                # Helper functions
│   ├── schema-loader.ts
│   └── validators.ts
└── types/                # TypeScript type definitions
    └── index.ts
tests/                    # Test files (TDD - one test file per tool)
├── tools/                # Unit tests (one file per tool)
│   ├── get-schema-stats.test.ts
│   ├── get-categories.test.ts
│   ├── get-category-tags.test.ts
│   ├── get-tag-values.test.ts
│   ├── get-tag-info.test.ts
│   ├── search-tags.test.ts
│   ├── (future tool tests...)
│   ├── presets.test.ts   # Preset tools tests (to be split)
│   └── validation.test.ts # Validation tools tests (to be split)
├── utils/                # Utility tests
│   ├── schema-loader.test.ts
│   └── validators.test.ts
└── integration/          # Integration tests (one file per tool)
    ├── helpers.ts        # Shared test utilities
    ├── server-init.test.ts        # Server initialization tests
    ├── get-schema-stats.test.ts   # get_schema_stats integration
    ├── get-categories.test.ts     # get_categories integration
    ├── get-category-tags.test.ts  # get_category_tags integration
    ├── get-tag-values.test.ts     # get_tag_values integration
    ├── get-tag-info.test.ts       # get_tag_info integration
    └── search-tags.test.ts        # search_tags integration
.github/
└── workflows/
    ├── test.yml          # CI testing workflow
    ├── release.yml       # Release automation
    └── dependabot.yml    # Dependency updates
```

### Architectural Layers

The server follows a modular architecture with distinct layers:
1. **Schema Layer**: Loads and indexes the tagging schema
2. **Tool Layer**: Implements MCP tools that query the schema (one file per tool)
3. **Validation Layer**: Provides tag validation logic
4. **Server Layer**: MCP server setup and tool registration

All layers are fully tested using Node.js native test runner with TDD approach.

### Naming Conventions

- **Tool files**: `kebab-case` matching tool name (e.g., `get-schema-stats.ts` for `get_schema_stats` tool)
- **Test files**: Tool name + `.test.ts` suffix (e.g., `get-schema-stats.test.ts`)
- **Shared types**: Grouped in `tools/types.ts` to avoid duplication
- **Tool ordering**: Tools returned in **alphabetical order** by name in MCP ListToolsRequest for API predictability

## Development Status

**Current Phase: Phase 3 - COMPLETED ✅**

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
- ✅ Unit tests written and passing (19 tests, 8 suites)
- ✅ Integration tests implemented
- ✅ CI/CD pipeline configured and running tests automatically

Phase 3 (Core Tool Implementation) is partially completed:
- ✅ Schema Exploration Tools (3.4):
  - `get_schema_stats` - Get schema statistics
  - `get_categories` - List all tag categories
  - `get_category_tags` - Get tags in a specific category
- ✅ Tag Query Tools (3.1 - COMPLETED ✅):
  - `get_tag_info` - Get comprehensive information about a tag key (values, type, field definition)
  - `get_tag_values` - Get all possible values for a tag key
  - `search_tags` - Search for tags by keyword
  - `get_related_tags` - Find tags commonly used together (with frequency counts and examples)
- ✅ Preset Tools (3.2 - COMPLETED ✅):
  - `search_presets` - Search for presets by keyword or tag (with geometry filtering and limits)
  - `get_preset_details` - Get complete preset information (tags, geometry, fields, metadata)
  - `get_preset_tags` - Get recommended tags for a preset (identifying tags + addTags)
- ✅ Validation Tools (3.3 - COMPLETED ✅):
  - `validate_tag` - Validate single tag key-value pairs (checks deprecation, field options, empty values) ✅
  - `validate_tag_collection` - Validate collections of tags with aggregated statistics ✅
  - `check_deprecated` - Check if tag is deprecated with replacement suggestions ✅
  - `suggest_improvements` - Suggest improvements for tag collections (missing fields, deprecation warnings, preset matching) ✅

Phase 4 (Testing) has been COMPLETED ✅:
- ✅ Node.js test runner configured
- ✅ Unit tests for all implemented tools (263 tests, 111 suites passing)
- ✅ Integration tests for MCP server (107 tests, 55 suites passing)
  - Modular structure: One integration test file per tool
  - Shared test utilities in `helpers.ts`
  - Server initialization tests separated
  - Order-independent test assertions (no hardcoded tool positions)
- ✅ Testing with real OpenStreetMap data
- ✅ GitHub Actions CI/CD pipeline running tests
- ✅ **JSON Data Integrity Tests**: All tools validated against source JSON files
  - Unit tests import JSON data directly from @openstreetmap/id-tagging-schema
  - Tests verify exact match between tool outputs and JSON source data
  - Ensures compatibility when schema package updates
  - Provider pattern for comprehensive data validation
  - **100% coverage for tag tools**: ALL 799 tag keys tested (no hardcoded values)
  - **100% coverage for preset tools**: ALL 1707 presets tested (no hardcoded values)
  - Bidirectional validation ensures complete data integrity

**Code Quality & Architecture**:
- ✅ **Alphabetical Tool Ordering**: Tools returned in alphabetical order for predictable API
- ✅ **Test Robustness**: Tests check tool existence, not array positions (order-independent)
- ✅ **Modular Architecture**: One file per tool for clarity and maintainability

**Bug Fixes**:
- ✅ **search_tags fields.json coverage** (TDD approach):
  - **Issue**: search_tags only searched preset.tags and preset.addTags, missing tag keys that exist solely in fields.json (e.g., "wheelchair")
  - **Root Cause**: Tool ignored fields.json as a data source
  - **Fix**: Modified search_tags to search fields.json FIRST for matching keys, then presets
  - **TDD RED**: Added failing test "should find tag keys from fields.json (BUG FIX TEST)" in tests/tools/search-tags.test.ts
  - **TDD GREEN**: Implemented fix in src/tools/search-tags.ts to query fields.json before presets
  - **Test Coverage**: Updated both unit and integration tests to validate against fields.json + presets.json
  - **Result**: search_tags now returns results from both data sources (e.g., wheelchair=yes, wheelchair=limited, wheelchair=no)
- ✅ **Alphabetical tool sorting** (API improvement):
  - **Issue**: Tools returned in arbitrary order, making API unpredictable; tests relied on hardcoded positions
  - **Fix**: Sorted tools alphabetically in ListToolsRequestSchema (src/index.ts)
  - **Test Improvement**: Refactored tests to check tool existence vs. collection (order-independent)
  - **Result**: Predictable tool listing, robust tests that won't break when adding new tools
- ✅ **Tag key format: colon vs slash separator** (TDD approach):
  - **Issue**: Tools returned tag keys with slash separator (e.g., `toilets/wheelchair`) instead of proper OSM format with colon (e.g., `toilets:wheelchair`)
  - **Root Cause**: In @openstreetmap/id-tagging-schema, field map keys are **FILE PATHS** with slash separators (e.g., `fields["toilets/wheelchair"]` refers to `data/fields/toilets/wheelchair.json`), but the actual OSM tag key is stored in the `field.key` property with colon separators
  - **Key Insight**: Slash-separated map keys are NOT tag names - they are file paths. The ONLY source of truth for OSM tags is the `field.key` property in the JSON
  - **Examples**:
    - File path: `parking/side/parking` → data/fields/parking/side/parking.json → **Actual OSM tag**: `parking:both`
    - File path: `toilets/wheelchair` → data/fields/toilets/wheelchair.json → **Actual OSM tag**: `toilets:wheelchair`
  - **Fix**:
    - **get_tag_info**: Use `field.key` (actual OSM tag) instead of map key (file path); convert input `:` → `/` for field lookup; use actualKey for preset lookups
    - **get_tag_values**: Same approach as get_tag_info
    - **search_tags**: Use `field.key` for returned results instead of map key (file path); skip fields without `key` property
  - **TDD RED**: Added failing tests in get-tag-info.test.ts, get-tag-values.test.ts, search-tags.test.ts
  - **TDD GREEN**: Implemented fixes in src/tools/get-tag-info.ts, get-tag-values.ts, search-tags.ts
  - **Test Updates**: Updated provider patterns in unit and integration tests to:
    - Collect keys using `field.key` values (actual OSM tags) instead of `Object.keys(fields)` (file paths)
    - Use reverse lookup (iterate field.values) for validation since file path → OSM tag mapping is not 1:1
    - Handle non-trivial mappings (e.g., file path `parking/side/parking` → OSM tag `parking:both`)
  - **Result**: All tools now return and accept proper OSM tag keys with colon separators; 113 tests passing

**Infrastructure & Distribution**:
- ✅ **Docker Support** (Containerization):
  - Multistage Dockerfile with optimized builds
  - Stage 1 (builder): Installs dependencies and compiles TypeScript
  - Stage 2 (runtime): Minimal Alpine-based Node.js image with production dependencies only
  - Non-root user execution for security
  - Health checks configured
  - .dockerignore for optimized build context
  - GitHub Actions workflow for automated Docker builds
  - Images published to GitHub Container Registry (ghcr.io)
  - Multi-architecture support (amd64, arm64)
  - Tags: `dev` (master branch), `latest` (stable releases), `x.y.z` (versioned releases)
  - **Vulnerability Scanning**: Automated Trivy scanning for CRITICAL and HIGH severity issues
  - **Image Signing**: Cosign keyless signing with OIDC (Sigstore)
  - **Security Reports**: Trivy results uploaded to GitHub Security tab
  - **Signature Verification**: Users can verify image authenticity with `cosign verify`

**Next Phase: Phase 5 - Documentation**

See README.md for the complete development plan covering:
- Phase 1: Project Setup ✅
- Phase 2: Schema Integration ✅
- Phase 3: Core Tool Implementation ✅ (All 14 tools implemented)
- Phase 4: Testing ✅
- Phase 5: Documentation (Next)
- Phase 6: Optimization & Polish
- Phase 7: Distribution & Deployment (Future - npm provenance, containers, additional transports, public deployment)

## Example Use Cases

**Tag Information Query:**
```typescript
// get_tag_info for "parking"
// Returns:
// - All values: surface, underground, multi-storey, street_side, lane, etc.
// - Field type information
// - Whether field definition exists
```

**Related Tags Discovery:**
```typescript
// get_related_tags for "amenity=restaurant"
// Returns tags sorted by frequency:
// - cuisine=* (appears in 80% of restaurant presets)
// - opening_hours=* (70%)
// - wheelchair=* (60%)
// - Each with frequency count and example preset names
```

**Tag Search:**
```typescript
// search_tags for "wheelchair"
// Returns: wheelchair=yes, wheelchair=limited, wheelchair=no
// Searches both fields.json and presets for comprehensive results
```

**Preset Search:**
```typescript
// search_presets for "restaurant"
// Returns: amenity/restaurant, amenity/fast_food/*, cuisine-specific presets
// Each with full tags, geometry types
//
// search_presets for "amenity=restaurant"
// Returns: all presets with amenity=restaurant tag
//
// search_presets for "building" with geometry="area"
// Returns: only presets supporting area geometry
```

**Preset Details:**
```typescript
// get_preset_details for "amenity/restaurant"
// Returns:
// - id: "amenity/restaurant"
// - tags: { amenity: "restaurant" }
// - geometry: ["point", "area"]
// - fields: ["name", "cuisine", "diet_multi", "address", ...]
// - moreFields: ["{@templates/internet_access}", "outdoor_seating", ...]
// - icon: "maki-restaurant"
```

**Preset Tags:**
```typescript
// get_preset_tags for "amenity/restaurant"
// Returns:
// - tags: { amenity: "restaurant" } (identifying tags)
// - addTags: {} (additional recommended tags, if any)
```

**Category Exploration:**
```typescript
// get_categories
// Returns all categories: "Building", "Highway", "Amenity", etc. with preset counts
//
// get_category_tags for "Building"
// Returns all preset IDs in the Building category
```

## License

GNU General Public License v3.0 (GPL-3.0)

## Key Resources

- MCP Documentation: https://modelcontextprotocol.io
- OpenStreetMap Tagging Schema: https://github.com/openstreetmap/id-tagging-schema
- OSM Wiki Tags: https://wiki.openstreetmap.org/wiki/Tags

## Future Plans (Phase 7: Distribution & Deployment)

### 1. NPM Publishing with Provenance

**Goal**: Establish trust and transparency in package distribution through npm provenance signing.

**Implementation**:
- **GitHub Actions Workflow**: Automated publishing triggered by version tags
- **NPM Provenance**: Enable build provenance attestations linking to GitHub Actions builds
- **Trusted Publishing**: Configure npm to only accept packages from verified GitHub Actions workflows
- **SLSA Compliance**: Achieve SLSA Level 2+ for supply chain security
- **Verification**: Users can verify package authenticity with `npm audit signatures`

**Benefits**:
- Users can verify packages were built by GitHub Actions from this repository
- Protection against supply chain attacks
- Transparent build process
- Industry standard for secure package distribution

**Resources**:
- npm provenance: https://docs.npmjs.com/generating-provenance-statements
- GitHub Actions trusted publishing: https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds

### 2. Container Image & GitHub Container Registry ✅ IMPLEMENTED

**Goal**: Provide containerized deployment option for isolated, reproducible environments.

**Status**: ✅ **COMPLETED** - Full implementation with security scanning and image signing

**Implementation**:
- ✅ **Dockerfile**: Multi-stage build optimized for size and security
  - Stage 1: Build TypeScript sources
  - Stage 2: Production runtime with minimal dependencies
  - Non-root user execution
  - Health check support
- ✅ **GitHub Container Registry (ghcr.io)**: Publish container images
- ✅ **Multi-Architecture**: Support amd64 and arm64 (Apple Silicon, AWS Graviton)
- ✅ **Image Scanning**: Automated vulnerability scanning with Trivy
  - Scans for CRITICAL and HIGH severity vulnerabilities
  - Results uploaded to GitHub Security tab (SARIF format)
  - Runs on every build
- ✅ **Versioning**: Semantic versioning + `latest` tag
- ✅ **Image Signing**: Cosign keyless signatures for image verification
  - Uses Sigstore with OIDC (GitHub Actions identity)
  - Signature verification with `cosign verify`
  - Tamper-proof supply chain

**Benefits**:
- Portable deployment across environments
- Isolated execution environment
- Easy orchestration with Kubernetes/Docker Compose
- Reproducible builds
- **Security**: Vulnerability scanning and signed images for supply chain security

**Usage**:
```bash
# Pull and run
docker run -i ghcr.io/gander-tools/osm-tagging-schema-mcp:latest

# Verify image signature
cosign verify ghcr.io/gander-tools/osm-tagging-schema-mcp:latest \
  --certificate-identity-regexp=https://github.com/gander-tools \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com
```

### 3. Additional Transport Protocols

**Goal**: Support multiple transport protocols beyond stdio for diverse deployment scenarios.

**Planned Transports**:

**a) Server-Sent Events (SSE)**
- One-way server-to-client streaming
- Web browser compatible
- Long-polling fallback
- Use case: Web dashboards, monitoring tools

**b) HTTP/REST**
- Request/response over HTTP
- Standard REST endpoints
- OpenAPI/Swagger documentation
- Use case: Integration with web applications, API gateways

**c) WebSocket**
- Bidirectional real-time communication
- Persistent connection
- Lower latency than HTTP polling
- Use case: Interactive web applications

**Transport Configuration**:
```typescript
// Example configuration
{
  "transport": "sse" | "http" | "websocket" | "stdio",
  "port": 3000,
  "host": "0.0.0.0",
  "cors": { ... },
  "auth": { ... }
}
```

**Benefits**:
- Flexibility in deployment architecture
- Web browser accessibility
- Integration with existing infrastructure
- Support for public-facing services

### 4. Public Service Deployment Configuration

**Goal**: Enable deployment as a publicly accessible service with proper security, monitoring, and scalability.

**Deployment Options**:

**a) Docker Compose**
```yaml
services:
  osm-mcp:
    image: ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
    environment:
      - TRANSPORT=http
      - PORT=3000
      - RATE_LIMIT=100
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
```

**b) Kubernetes**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: osm-mcp-server
spec:
  replicas: 3  # Horizontal scaling
  template:
    spec:
      containers:
      - name: osm-mcp
        image: ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
        resources:
          limits: { cpu: "500m", memory: "512Mi" }
```

**Security & Operations**:
- **Authentication**: API key, OAuth 2.0, JWT tokens
- **Rate Limiting**: Per-IP, per-user limits
- **Health Checks**: `/health` and `/ready` endpoints
- **Metrics**: Prometheus metrics for monitoring
  - Request count, latency, error rate
  - Cache hit ratio
  - Schema load time
- **Logging**: Structured JSON logs for observability
- **TLS/HTTPS**: Certificate management (Let's Encrypt)
- **Horizontal Scaling**: Stateless design for load balancing

**Monitoring Stack**:
- Prometheus: Metrics collection
- Grafana: Dashboards and visualization
- Loki: Log aggregation
- Alertmanager: Alert routing

**Benefits**:
- Production-ready deployment
- Scalable architecture
- Observability and debugging
- Security best practices
- Cost-effective resource usage

**Timeline**: Phase 7 will be implemented after Phase 6 (Optimization & Polish) is completed.

## Future Enhancements (Schema-Builder Inspired)

Based on analysis of [schema-builder](https://github.com/ideditor/schema-builder), the following enhancements are planned for future phases. These will extend validation capabilities and add advanced features while maintaining 100% compatibility with the current implementation.

### 1. Enhanced Tag Validation (Phase 3.3 Extension)

**Inspired by**: schema-builder's validation system and constraint checking

**New validation capabilities**:
- **Geometry Constraints**: Validate if a tag is appropriate for a geometry type (point/line/area/relation)
  - Example: `amenity=parking` is typically for `area`, not `point`
  - Tool: `validate_tag_for_geometry(tag, geometry) → { valid, warnings }`

- **Prerequisite Tag Validation**: Check if required prerequisite tags are present
  - Example: `toilets:wheelchair` requires `toilets≠no`
  - Tool: `validate_prerequisites(tags, field) → { canDisplay, missingPrerequisites }`

- **Field Type Constraints**: Validate values against field type rules
  - Number fields: min/max values, increment constraints
  - URL fields: pattern matching, URL format validation
  - Combo fields: allowed values, custom values settings

**Implementation approach**: Extend existing `validate_tag` and `validate_tag_collection` tools with additional constraint checks from field definitions.

### 2. Field Inheritance Resolution

**Inspired by**: schema-builder's preset field inheritance system (`{preset_name}` references)

**Functionality**: Resolve complete field lists for presets including inherited fields from parent presets.

**New tool**: `get_preset_all_fields(presetId) → { inherited, own, all }`
- `inherited`: Fields from parent presets
- `own`: Fields defined directly in the preset
- `all`: Complete resolved field list

**Use case**: When editing a feature, know all applicable fields including those inherited from broader categories.

### 3. Conditional Field Analysis

**Inspired by**: schema-builder's `prerequisiteTag` logic for conditional field display

**Functionality**: Determine which fields should be displayed based on current tag values.

**New tool**: `get_conditional_fields(tags) → [{ field, prerequisite, visible }]`
- Evaluates prerequisite conditions
- Returns field visibility status
- Handles complex prerequisite logic (key existence, value matching, valueNot)

**Use case**: Build dynamic forms that show/hide fields based on other field values.

### 4. Advanced Deprecation Transformations

**Inspired by**: schema-builder's deprecation mappings with placeholder transformations (`$1`, `$2`)

**Enhanced deprecation handling**:
- **Placeholder substitution**: Support transformations like `highway=crossing` → `highway=footway, footway=crossing`
- **Multi-tag replacements**: One deprecated tag can map to multiple replacement tags
- **Conditional replacements**: Different replacements based on additional tag context

**Enhanced tool**: `check_deprecated(tag) → { deprecated, replacement, transformationRule }`
- Returns structured replacement with transformation details
- Supports complex tag splitting and recombination
- Provides human-readable transformation explanation

### 5. Tag Quality Scoring

**Inspired by**: schema-builder's field importance and usage patterns

**Functionality**: Score tag completeness and quality for a feature.

**New tool**: `score_tag_quality(tags, presetId) → { score, missing, suggested }`
- `score`: 0-100 quality score
- `missing`: Required/important fields that are missing
- `suggested`: Optional but commonly used fields

**Scoring factors**:
- Presence of required fields (from preset)
- Inclusion of commonly used optional fields
- Appropriate geometry type
- No deprecated tags
- Valid field values

### Implementation Priority

**Phase 3.3 (Validation Tools)**:
- Implement enhanced validation (#1)
- Basic deprecation improvements (#4)

**Phase 5+ (Advanced Features)**:
- Field inheritance resolution (#2)
- Conditional field analysis (#3)
- Tag quality scoring (#5)

### Compatibility Notes

- All enhancements are **additive** - existing tools remain unchanged
- Current implementation is **100% compliant** with schema-builder data format
- No breaking changes to existing tool APIs
- New tools follow same naming conventions and error handling patterns

**Reference**: Schema-builder documentation at https://github.com/ideditor/schema-builder/blob/main/README.md

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

4. **Testing Requirements**
   - **Run tests when code changes** (src/, tests/ directories)
   - **Skip tests for documentation-only changes** (README.md, CLAUDE.md, *.md files)
   - Before pushing code changes, ensure:
     - `npm run test:unit` passes
     - `npm run test:integration` passes
     - `npm run lint` passes
     - `npm run typecheck` passes

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
