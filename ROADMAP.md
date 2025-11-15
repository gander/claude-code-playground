# Development Roadmap

## TL;DR

**Current Status:** ✅ Production Ready (Phase 6 Complete)

**What's Done:**
- ✅ 14 fully functional MCP tools for OSM tagging (query, presets, validation, exploration)
- ✅ Comprehensive testing: 406 tests with 100% pass rate, full JSON data integrity validation
- ✅ Multiple deployment options: npx, Docker, source installation
- ✅ Security: npm provenance (SLSA Level 3), Docker image signing, SBOM generation
- ✅ Transport protocols: stdio (default), HTTP/SSE for web clients
- ✅ Complete documentation: installation, configuration, usage, API reference, troubleshooting

**What's Next (Phase 7):**
- Service infrastructure: Authentication, rate limiting
- Advanced validation: Geometry constraints, field inheritance, quality scoring
- Additional tools based on community feedback

**Quick Links:**
- [Installation](./docs/installation.md) - Get started in 2 minutes with npx
- [API Reference](./docs/api/) - Explore all 14 tools
- [Contributing](./CONTRIBUTING.md) - Join the project

---

## Development Phases

### Phase 1: Project Setup ✅

**Status:** Complete

**Achievements:**
- TypeScript 5.9 project with Node.js 22+
- MCP SDK and OSM tagging schema integration
- BiomeJS for code quality
- Node.js native test runner
- GitHub Actions CI/CD pipeline

### Phase 2: Schema Integration ✅

**Status:** Complete

**Achievements:**
- Schema loader with caching and indexing
- Type definitions for schema structures
- Fast lookup system (byKey, byTag, byGeometry, byFieldKey)
- 19 unit tests passing
- Integration tests for MCP server

### Phase 3: Core Tool Implementation ✅

**Status:** Complete - All 14 Tools Implemented

**Tag Query Tools:**
- ✅ `get_tag_info` - Comprehensive tag key information
- ✅ `get_tag_values` - All possible values for a tag
- ✅ `get_related_tags` - Find commonly used tag combinations
- ✅ `search_tags` - Search tags by keyword

**Preset Tools:**
- ✅ `search_presets` - Search presets by keyword/tag
- ✅ `get_preset_details` - Complete preset configuration
- ✅ `get_preset_tags` - Recommended tags for presets

**Validation Tools:**
- ✅ `validate_tag` - Single tag validation
- ✅ `validate_tag_collection` - Collection validation with statistics
- ✅ `check_deprecated` - Deprecation checking with replacements
- ✅ `suggest_improvements` - Tag collection improvement suggestions

**Schema Exploration Tools:**
- ✅ `get_categories` - List all categories
- ✅ `get_category_tags` - Tags in specific categories
- ✅ `get_schema_stats` - Schema statistics with version info

### Phase 4: Testing ✅

**Status:** Complete

**Achievements:**
- 299 unit tests passing
- 107 integration tests passing
- JSON Data Integrity Tests against source schema data
- 100% coverage: ALL 799 tag keys + ALL 1707 presets validated
- Bidirectional validation for complete data integrity
- Order-independent test assertions
- Modular test structure (one file per tool)

### Phase 5: Documentation ✅

**Status:** Complete

**User Documentation:**
- ✅ Installation guide (npx, Docker, source)
- ✅ Configuration guide (Claude Code/Desktop, custom clients)
- ✅ Usage guide (examples, workflows, best practices)
- ✅ Complete API reference for all 14 tools
- ✅ Troubleshooting guide
- ✅ Deployment guide (Docker Compose)
- ✅ Security documentation (provenance, SLSA, SBOM)

**Developer Documentation:**
- ✅ Contribution guidelines with TDD workflow
- ✅ Development guide with setup and debugging
- ✅ Development roadmap (this file)
- ✅ Changelog with version history
- ✅ Technical implementation notes

### Phase 6: Optimization & Polish ✅

**Status:** Complete

**Schema Optimization:**
- ✅ Always-on indexing (removed optional indexing)
- ✅ Schema preloading at server startup (warmup method)
- ✅ Field key index for O(1) lookups
- ✅ Single-pass indexing during schema load

**Logging & Debugging:**
- ✅ Configurable log levels (SILENT, ERROR, WARN, INFO, DEBUG)
- ✅ LOG_LEVEL environment variable
- ✅ Structured output with timestamps
- ✅ Comprehensive server lifecycle logging

**Schema Updates:**
- ✅ Version tracking from package metadata
- ✅ Version information in get_schema_stats
- ✅ Schema structure validation
- ✅ Graceful error handling
- ✅ Version logging on load/reload

**Publication:**
- ✅ Package content optimization (59% size reduction)
- ✅ Files whitelist in package.json
- ✅ Pre-publication verification workflow
- ✅ npm publishing with provenance (SLSA Level 3)
- ✅ SBOM generation (CycloneDX format)

### Phase 7: Distribution & Deployment ✅

**Status:** Complete

**Completed Features:**

**Distribution & Security:**
- ✅ npm publishing with provenance (SLSA Level 3)
- ✅ SBOM generation and attestations
- ✅ Multi-stage Docker images (Alpine Linux)
- ✅ Multi-architecture support (amd64, arm64)
- ✅ Trivy vulnerability scanning
- ✅ Cosign image signing (keyless OIDC)
- ✅ GitHub Container Registry publishing

**Transport & Deployment:**
- ✅ stdio transport (default for CLI/desktop)
- ✅ HTTP Streamable transport (web clients)
- ✅ SSE transport (legacy alias)
- ✅ Docker Compose configurations
- ✅ Health check endpoints (/health, /ready)
- ✅ Resource limits and security hardening
- ✅ Comprehensive deployment documentation

### Phase 8: Schema Builder API Refactor 🔄

**Status:** In Planning

**Goal:** Align tool APIs with schema-builder patterns for better iD editor compatibility and enhanced localization support.

**Reference Documentation:**
- External: [ideditor/schema-builder README](https://github.com/ideditor/schema-builder/blob/main/README.md)
- Internal: `docs/examples.md` (current tool examples)

**Key Principles:**
1. **Backward Compatibility:** Breaking changes - will require major version bump (v1.0.0)
2. **Localization First:** All tools should return human-readable names from translations
3. **Template Expansion:** Support field references `{amenity}` and templates `@templates/contact`
4. **Flexible Input:** Accept multiple input formats (preset ID, tag notation, JSON object)

#### 8.1: Translation Infrastructure ⏳

**Objective:** Load and index English translations from schema package

**Tasks:**
- [ ] Add translations loader to `SchemaLoader` class
  - Load `/dist/translations/en.json` from schema package
  - Index by presets, fields, categories
  - Cache translations alongside schema data
- [ ] Create TypeScript interfaces for translation structure
  - `TranslationPreset`: name, terms
  - `TranslationField`: label, options (title, description)
  - `TranslationCategory`: name
- [ ] Add translation lookup utilities
  - `getPresetName(presetId: string): string`
  - `getFieldName(fieldKey: string): string`
  - `getFieldOptionName(fieldKey: string, optionValue: string): { title: string, description?: string }`
- [ ] Unit tests for translation loading and lookups
- [ ] Integration tests for translation data integrity

#### 8.2: validate_tag Refactor ⏳

**Current Response:**
```typescript
{
  valid: boolean,
  deprecated: boolean,
  message: string,
  fieldExists: boolean,      // REMOVE
  hasOptions: boolean,
  valueInOptions: boolean,
  replacement?: object,
  availableOptions?: string[] // REMOVE
}
```

**New Response:**
```typescript
{
  query: { key: string, value: string },  // ADD - original request
  names: {                                 // ADD - localized names
    key?: string,    // e.g., "Amenity" for "amenity"
    value?: string   // e.g., "Restaurant" for "restaurant"
  },
  valid: boolean,
  deprecated: boolean,
  message: string,
  hasOptions: boolean,
  valueInOptions: boolean,
  replacement?: object
}
```

**Changes:**
- **Remove:** `fieldExists` (internal detail, not useful for API consumers)
- **Remove:** `availableOptions` (use `get_tag_values` tool instead)
- **Add:** `query` - echo back the original request for context
- **Add:** `names` - localized names from translations

**Validation Logic:**
- `valid = true` if:
  - Key exists in schema AND value is valid (in options OR custom allowed)
  - OR key/value is deprecated (still valid, but warn)
- `valid = false` if:
  - Key or value is empty string
  - (Note: Unknown keys are still `valid = true` per OSM philosophy)

**Tasks:**
- [ ] Update `validate-tag.ts` implementation
  - Add translation lookups for key and value names
  - Remove `fieldExists` and `availableOptions` from response
  - Add `query` and `names` to response
- [ ] Update input schema (no changes needed)
- [ ] Update unit tests (`tests/tools/validate-tag.test.ts`)
  - Update all assertions to match new response format
  - Add tests for translation name lookups
- [ ] Update integration tests (`tests/integration/validate-tag.test.ts`)
- [ ] Update API documentation (`docs/api/validate_tag.md`)
- [ ] Update usage examples (`docs/examples.md`)

#### 8.3: get_tag_values Refactor ⏳

**Current Response:**
```typescript
[
  {
    value: string,
    name: string,
    description?: string  // OPTIONAL
  }
]
```

**New Response:**
```typescript
[
  {
    value: string,
    name: string,
    description: string  // MANDATORY - empty string if no description
  }
]
```

**Changes:**
- **Make description mandatory:** Always return `description` field
  - If translation has description → use it
  - If no description available → return empty string `""`
  - Never omit the field

**Tasks:**
- [ ] Update `get-tag-values.ts` implementation
  - Always include `description` field in response
  - Return empty string if no description found
- [ ] Update input schema (no changes needed)
- [ ] Update unit tests (`tests/tools/get-tag-values.test.ts`)
  - Update assertions to expect `description` field always present
- [ ] Update integration tests (`tests/integration/get-tag-values.test.ts`)
- [ ] Update API documentation (`docs/api/get_tag_values.md`)
- [ ] Update usage examples (`docs/examples.md`)

#### 8.4: search_tags Refactor ⏳

**Current Behavior:**
- Returns tags matching keyword in key or value
- **Problem:** Returns random value when match is in key only
- **Problem:** Doesn't distinguish between key-match and value-match

**New Behavior:**
- Search for keyword as:
  - Complete key match (e.g., "amenity")
  - Partial key match (e.g., "wheel" matches "wheelchair")
  - Complete value match (e.g., "restaurant")
  - Partial value match (e.g., "rest" matches "restaurant")
- **If found by key:** Return ALL values for that key (from `get_tag_values`)
  - Response: `[{ key: "amenity", values: [...] }]`
- **If found by value:** Return key + specific value
  - Response: `[{ key: "amenity", value: "restaurant" }]`

**Current Response:**
```typescript
[
  {
    key: string,
    value: string  // Sometimes random value when matched by key
  }
]
```

**New Response (Option A - Unified):**
```typescript
[
  {
    key: string,
    value?: string,     // Present if matched by value
    values?: Array<{    // Present if matched by key
      value: string,
      name: string,
      description: string
    }>,
    matchType: "key" | "value"
  }
]
```

**New Response (Option B - Separate Arrays):**
```typescript
{
  keyMatches: [
    {
      key: string,
      values: Array<{
        value: string,
        name: string,
        description: string
      }>
    }
  ],
  valueMatches: [
    {
      key: string,
      value: string,
      name?: string
    }
  ]
}
```

**Recommended:** Option B - clearer distinction, easier to process

**Tasks:**
- [ ] Update `search-tags.ts` implementation
  - Implement separate search logic for keys vs values
  - For key matches: call `get_tag_values` to get all values
  - For value matches: return specific key-value pair
  - Return structured response with `keyMatches` and `valueMatches`
- [ ] Update input schema (no changes needed)
- [ ] Update unit tests (`tests/tools/search-tags.test.ts`)
  - Test key-only matches return all values
  - Test value matches return specific pairs
  - Test partial matching for both keys and values
- [ ] Update integration tests (`tests/integration/search-tags.test.ts`)
- [ ] Update API documentation (`docs/api/search_tags.md`)
- [ ] Update usage examples (`docs/examples.md`)

#### 8.5: get_preset_details Refactor ⏳

**Current Input:**
- Only accepts preset ID: `"amenity/restaurant"`

**New Input (accept all formats):**
1. Preset ID (slash notation): `"amenity/restaurant"`
2. Tag notation (equals): `"amenity=restaurant"`
3. JSON object: `{"amenity": "restaurant"}`

**Current Response:**
```typescript
{
  id: string,
  name: string,
  tags: object,
  geometry: string[],
  icon: string,      // REMOVE
  fields: string[],
  moreFields: string[]
}
```

**New Response:**
```typescript
{
  id: string,
  name: string,
  tags: object,
  geometry: string[],
  fields: string[],      // With {field} and @templates expanded
  moreFields: string[]   // With {field} and @templates expanded
}
```

**Changes:**
- **Accept multiple input formats:** Parse preset ID, tag notation, or JSON object
- **Remove:** `icon` field (not essential for MCP context)
- **Expand field references:**
  - `{amenity}` → Replace with actual field key (e.g., for `amenity=restaurant` → `"restaurant"`)
  - `@templates/contact` → Expand to template fields (e.g., `["email", "website", "phone", "fax"]`)
  - `@templates/internet_access` → Expand to `["internet_access", "internet_access/fee", "internet_access/ssid"]`

**Field Reference Resolution (from schema-builder):**
- **Field inheritance:** `{amenity}` means use fields from preset with id matching the amenity value
- **Templates:** `@templates/X` expands to predefined field groups
  - Example templates: `contact`, `internet_access`, `building_fields`, etc.
  - Template definitions stored in schema data structure

**Tasks:**
- [ ] Update `get-preset-details.ts` input parsing
  - Add parser for `"key=value"` format → lookup preset by tag
  - Add parser for `{"key": "value"}` format → lookup preset by tags
  - Keep existing `"preset/id"` format support
- [ ] Implement field reference expansion
  - Create utility to expand `{fieldRef}` references
  - Create utility to expand `@templates/X` references
  - Load template definitions from schema
- [ ] Update response format
  - Remove `icon` field
  - Expand all field references before returning
- [ ] Update input schema to accept multiple formats
  ```typescript
  presetId: z.union([
    z.string(),  // "amenity/restaurant" or "amenity=restaurant"
    z.record(z.string())  // {"amenity": "restaurant"}
  ])
  ```
- [ ] Unit tests (`tests/tools/get-preset-details.test.ts`)
  - Test all three input formats
  - Test field reference expansion
  - Test template expansion
- [ ] Integration tests (`tests/integration/get-preset-details.test.ts`)
- [ ] Update API documentation (`docs/api/get_preset_details.md`)
- [ ] Update usage examples (`docs/examples.md`)

#### 8.6: validate_tag_collection Refactor ⏳

**Current Response:**
```typescript
{
  valid: boolean,
  tagResults: object,
  errors: string[],          // REMOVE
  warnings: string[],        // REMOVE
  deprecatedCount: number,
  errorCount: number,        // Was invalidCount
  warningCount: number       // REMOVE
}
```

**New Response:**
```typescript
{
  valid: boolean,
  tagResults: object,  // Using new validate_tag format
  validCount: number,        // ADD - count of valid tags
  deprecatedCount: number,
  errorCount: number
}
```

**Changes:**
- **Use new `validate_tag` format** for each tag in `tagResults`
- **Add:** `validCount` - number of valid (non-error) tags
- **Remove:** `errors`, `warnings`, `warningCount` arrays/counts
- **Keep:** `deprecatedCount`, `errorCount`
- **Rename:** `invalidCount` → `errorCount` (clearer terminology)

**Tasks:**
- [ ] Update `validate-tag-collection.ts` implementation
  - Use refactored `validate_tag` for each tag
  - Add `validCount` calculation
  - Remove `errors`, `warnings`, `warningCount`
  - Rename `invalidCount` to `errorCount`
- [ ] Update input schema (no changes needed)
- [ ] Update unit tests (`tests/tools/validate-tag-collection.test.ts`)
  - Update assertions for new response format
  - Test validCount calculation
- [ ] Update integration tests (`tests/integration/validate-tag-collection.test.ts`)
- [ ] Update API documentation (`docs/api/validate_tag_collection.md`)
- [ ] Update usage examples (`docs/examples.md`)

#### 8.7: suggest_improvements Refactor ⏳

**Current Response:**
```typescript
{
  suggestions: string[],  // Array of strings
  warnings: string[],     // REMOVE
  matchedPresets: string[]
}
```

**New Response:**
```typescript
{
  suggestions: [
    {
      operation: "add" | "remove" | "update",
      message: string,  // "Reason to {operation} the {key} - explanation"
      key: string
    }
  ],
  matchedPresets: string[]
}
```

**Changes:**
- **Structured suggestions:** Array of objects instead of strings
  - `operation`: Type of change ("add", "remove", "update")
  - `message`: Human-readable explanation with reason
  - `key`: Tag key being suggested
- **Remove:** `warnings` field (deprecation warnings now in `validate_tag_collection`)
- **Keep:** `matchedPresets`

**Example Suggestions:**
```json
[
  {
    "operation": "add",
    "message": "Add 'cuisine' to specify the type of food served at this restaurant",
    "key": "cuisine"
  },
  {
    "operation": "add",
    "message": "Add 'opening_hours' to help visitors know when the restaurant is open",
    "key": "opening_hours"
  },
  {
    "operation": "remove",
    "message": "Remove 'building' because it conflicts with amenity=restaurant point geometry",
    "key": "building"
  },
  {
    "operation": "update",
    "message": "Update 'wheelchair' to use standard values (yes/no/limited)",
    "key": "wheelchair"
  }
]
```

**Tasks:**
- [ ] Update `suggest-improvements.ts` implementation
  - Change suggestions from strings to structured objects
  - Determine operation type (add/remove/update) based on analysis
  - Generate contextual messages with reasons
  - Remove `warnings` field
- [ ] Update input schema (no changes needed)
- [ ] Update unit tests (`tests/tools/suggest-improvements.test.ts`)
  - Update assertions for new suggestion format
  - Test operation type detection
- [ ] Update integration tests (`tests/integration/suggest-improvements.test.ts`)
- [ ] Update API documentation (`docs/api/suggest_improvements.md`)
- [ ] Update usage examples (`docs/examples.md`)

#### 8.8: Localization Enhancements ⏳

**Objective:** Add translation lookups to all applicable tools

**Tasks:**
- [ ] Update `search_presets` to include preset names from translations
- [ ] Update tool responses to include localized names where applicable
- [ ] Add translation fallback logic (English → key if missing)
- [ ] Document translation usage in API docs

#### 8.9: Template System Implementation ⏳

**Objective:** Support field templates like `@templates/contact`

**Template Definitions (from schema):**
Common templates used in iD editor:
- `@templates/contact`: `["contact:email", "contact:phone", "contact:website", "contact:fax"]`
- `@templates/internet_access`: `["internet_access", "internet_access/fee", "internet_access/ssid"]`
- `@templates/building_fields`: `["building:levels", "building:material", "roof:shape", "roof:colour"]`

**Tasks:**
- [ ] Extract template definitions from schema data
- [ ] Create template expansion utility
- [ ] Add template tests with real schema templates
- [ ] Document template system in CLAUDE.md

#### 8.10: Documentation & Testing ⏳

**Tasks:**
- [ ] Update CHANGELOG.md with breaking changes for v1.0.0
- [ ] Update README.md with new API examples
- [ ] Update all API documentation files
- [ ] Update docs/examples.md with new response formats
- [ ] Update CLAUDE.md with refactoring notes
- [ ] Run full test suite and fix any breaking tests
- [ ] Update integration test snapshots
- [ ] Create migration guide for v0.x → v1.0.0 users

**Documentation Files to Update:**
- [ ] `docs/api/validate_tag.md`
- [ ] `docs/api/get_tag_values.md`
- [ ] `docs/api/search_tags.md`
- [ ] `docs/api/get_preset_details.md`
- [ ] `docs/api/validate_tag_collection.md`
- [ ] `docs/api/suggest_improvements.md`
- [ ] `docs/examples.md`
- [ ] `docs/usage.md`
- [ ] `README.md`

### Phase 9: Advanced Validation Features ⏳

**Status:** Planned

**Advanced Validation** (based on [ideditor/schema-builder](https://github.com/ideditor/schema-builder)):
- ⏳ Geometry constraints validation
- ⏳ Prerequisite tag validation
- ⏳ Field type constraints (number ranges, URL patterns)
- ⏳ Field inheritance resolution - `get_preset_all_fields(presetId)`
- ⏳ Conditional field analysis - `get_conditional_fields(tags)`
- ⏳ Advanced deprecation transformations (placeholder substitution)
- ⏳ Tag quality scoring - `score_tag_quality(tags, presetId)`

### Phase 10: Service Infrastructure ⏳

**Status:** Planned

**Service Infrastructure:**
- ⏳ Authentication (API key, JWT, OAuth 2.0)
- ⏳ Rate limiting (per-IP, per-user quotas)
- ⏳ TLS/HTTPS support with Let's Encrypt

**Implementation Priority:**
1. **Phase 8:** Schema Builder API Refactor (CURRENT)
2. **Phase 9:** Advanced validation features
3. **Phase 10:** Service infrastructure

**Note:** All enhancements will maintain backward compatibility within major versions.

---

## Contributing

Want to help? See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- TDD workflow and coding standards
- Testing requirements (>90% coverage)
- Pull request process
- Development setup

## Project Information

- **Repository:** https://github.com/gander-tools/osm-tagging-schema-mcp
- **npm Package:** https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp
- **Docker Images:** https://github.com/gander-tools/osm-tagging-schema-mcp/pkgs/container/osm-tagging-schema-mcp
- **License:** GNU General Public License v3.0
