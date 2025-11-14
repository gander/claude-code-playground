# Project: OpenStreetMap Tagging Schema MCP Server

> **⚠️ IMPORTANT**: This document reflects the ACTUAL current state of the codebase.
> **Last Updated**: 2025-11-14
> **Current Status**: 8 tools (optimized set) | Build issue present | Production-ready

## Project Overview

This is a Model Context Protocol (MCP) server built with TypeScript that provides tools for querying and validating OpenStreetMap (OSM) tags using the `@openstreetmap/id-tagging-schema` library.

**Development Status**: Production-ready with optimized tool set. Originally planned 14 tools, reduced to 8 after removing redundant functionality.

## Purpose

The MCP server exposes OpenStreetMap's tagging schema as a set of queryable tools, enabling AI assistants and applications to:
- Query available OSM tags and their possible values
- Discover tag parameters, constraints, and relationships
- Find compatible tags that work together
- Access preset configurations
- Identify deprecated keys/values and suggest replacements
- Validate tag collections for correctness

## Core Functionality

**Current Status**: 8 tools (optimized, complete set)

### Complete Tool Set (8 tools)

**Validation Tools** (4 tools):
- ✅ **validate_tag**: Validate a single tag key-value pair
- ✅ **validate_tag_collection**: Validate complete tag collections and report all issues
- ✅ **check_deprecated**: Check if tags are deprecated and get replacement suggestions
- ✅ **suggest_improvements**: Analyze tag collections and provide recommendations

**Tag Query Tools** (2 tools):
- ✅ **get_tag_values**: Retrieve all valid values for a tag key with descriptions
- ✅ **search_tags**: Search for tags by keyword

**Preset Tools** (2 tools):
- ✅ **search_presets**: Search for presets by name or tag filters
- ✅ **get_preset_details**: Get complete preset configuration including tags and fields

### Redundant Tools Removed

During development, 6 additional tools were considered but **intentionally not implemented** due to redundancy:

**Not Implemented (redundant functionality):**
- ~~get_tag_info~~ - Functionality covered by `get_tag_values` and `search_tags`
- ~~get_related_tags~~ - Relationship info available via `search_presets` and `get_preset_details`
- ~~get_preset_tags~~ - Tag information already in `get_preset_details` output
- ~~get_schema_stats~~ - Statistics can be derived from existing tools
- ~~get_categories~~ - Category exploration possible via `search_presets`
- ~~get_category_tags~~ - Covered by `search_presets` with filtering

**Design Philosophy**: Maintain minimal, non-overlapping tool set rather than redundant convenience wrappers.

## Technical Stack

- **Runtime**: Node.js 22+
- **Language**: TypeScript 5.9
- **Package**: @gander-tools/osm-tagging-schema-mcp
- **MCP SDK**: @modelcontextprotocol/sdk ^1.21.1
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

### Documentation Guidelines

#### Documentation Structure

The project maintains comprehensive documentation in multiple locations:

**User-Facing Documentation (docs/):**
- `docs/installation.md` - Installation instructions for all methods (npx, source, Docker)
- `docs/configuration.md` - Configuration for Claude Code/Desktop and custom clients
- `docs/usage.md` - Usage examples, workflows, and best practices
- `docs/api/` - API reference for all 14 tools
  - `docs/api/README.md` - API overview and quick reference
  - `docs/api/{tool_name}.md` - Detailed documentation per tool (pattern established)
  - `docs/api/NOTE.md` - Documentation pattern guide
- `docs/troubleshooting.md` - Common issues and solutions

**Developer Documentation (root):**
- `README.md` - Compact overview with links to detailed docs
- `CONTRIBUTING.md` - Contribution guidelines (TDD workflow, standards)
- `DEVELOPMENT.md` - Development setup, commands, debugging
- `ROADMAP.md` - Development plan and future features
- `CHANGELOG.md` - Project history (Keep a Changelog format)
- `CLAUDE.md` - Technical implementation notes (this file)

#### Documentation Update Workflow

When completing a phase or major feature:

1. **Update docs/** (if user-facing changes):
   - Installation changes → `docs/installation.md`
   - New tools/features → `docs/usage.md` and `docs/api/`
   - Configuration changes → `docs/configuration.md`
   - New issues/solutions → `docs/troubleshooting.md`

2. **Update root documentation**:
   - README.md → Update "Project Status" section
   - ROADMAP.md → Mark phase/tasks as complete
   - CHANGELOG.md → Add entry in [Unreleased] section
   - CLAUDE.md → Update "Development Status" section

3. **API Documentation Pattern**:
   All API docs follow this structure (see `docs/api/get_tag_info.md` as template):
   - Description
   - Category
   - Input Parameters (table with details)
   - Output (TypeScript schema)
   - Examples (multiple scenarios)
   - Error Scenarios
   - Use Cases
   - Related Tools
   - Notes
   - Data Source
   - Version History

#### Documentation Maintenance

- Keep README.md compact - link to detailed docs in `docs/`
- Update all documentation together to maintain consistency
- Follow established patterns for new API documentation
- Use markdown features: tables, code blocks, links, details/summary
- Include practical examples with real OSM data
- Cross-link related documentation

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
├── index.ts                         # MCP server entry point
├── tools/                           # Tool implementations (one file per tool)
│   ├── index.ts                     # Tool registry exports
│   ├── types.ts                     # Shared type definitions for tools
│   ├── check-deprecated.ts          # ✅ Validation tool
│   ├── get-preset-details.ts        # ✅ Preset tool
│   ├── get-tag-values.ts            # ✅ Tag query tool
│   ├── search-presets.ts            # ✅ Preset tool
│   ├── search-tags.ts               # ✅ Tag query tool
│   ├── suggest-improvements.ts      # ✅ Validation tool
│   ├── validate-tag.ts              # ✅ Validation tool
│   └── validate-tag-collection.ts   # ✅ Validation tool
├── utils/                           # Helper functions
│   ├── schema-loader.ts             # ✅ Schema loader with caching
│   ├── logger.ts                    # ✅ Configurable logging
│   └── tag-parser.ts                # ✅ Text/JSON tag parser
└── types/                           # TypeScript type definitions
    ├── index.ts                     # ✅ Core type definitions
    └── tool-definition.ts           # ✅ OsmToolDefinition interface
tests/                               # Test files (TDD - one test file per tool)
├── index.test.ts                    # Server tests
├── tools/                           # Unit tests (one file per tool)
│   ├── check-deprecated.test.ts     # ✅ Present
│   ├── get-preset-details.test.ts   # ✅ Present
│   ├── get-tag-values.test.ts       # ✅ Present
│   ├── search-presets.test.ts       # ✅ Present
│   ├── search-tags.test.ts          # ✅ Present
│   ├── suggest-improvements.test.ts # ✅ Present
│   ├── validate-tag.test.ts         # ✅ Present
│   └── validate-tag-collection.test.ts # ✅ Present
├── utils/                           # Utility tests
│   ├── schema-loader.test.ts        # ✅ Present
│   ├── logger.test.ts               # ✅ Present
│   └── tag-parser.test.ts           # ✅ Present
└── integration/                     # Integration tests (one file per tool)
    ├── helpers.ts                   # ✅ Shared test utilities
    ├── server-init.test.ts          # ✅ Server initialization tests
    ├── sse-transport.test.ts        # ✅ HTTP/SSE transport tests
    ├── check-deprecated.test.ts     # ✅ Present
    ├── get-preset-details.test.ts   # ✅ Present
    ├── get-tag-values.test.ts       # ✅ Present
    ├── search-presets.test.ts       # ✅ Present
    ├── search-tags.test.ts          # ✅ Present
    ├── suggest-improvements.test.ts # ✅ Present
    ├── validate-tag.test.ts         # ✅ Present
    └── validate-tag-collection.test.ts # ✅ Present
.github/workflows/                   # CI/CD workflows
    ├── test.yml                     # ✅ CI testing workflow
    ├── docker.yml                   # ✅ Docker build & publish
    ├── publish.yml                  # ✅ npm publishing
    ├── security.yml                 # ✅ Security scanning
    ├── codeql.yml                   # ✅ Code scanning
    ├── cleanup.yml                  # ✅ Package cleanup
    └── dependency-review.yml        # ✅ Dependency review
docs/                                # User documentation
    ├── installation.md              # ✅ Installation guide
    ├── configuration.md             # ✅ Configuration guide
    ├── usage.md                     # ✅ Usage examples
    ├── deployment.md                # ✅ Deployment guide
    ├── security.md                  # ✅ Security documentation
    ├── troubleshooting.md           # ✅ Troubleshooting guide
    └── api/                         # API documentation
        ├── README.md                # ✅ API overview
        ├── get_tag_info.md          # ✅ Example (for planned tool)
        └── NOTE.md                  # ✅ Documentation pattern
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

## MCP SDK Tool Structure

**Status**: ✅ IMPLEMENTED - Using modern MCP SDK v1.21.1 tool registration API

This section documents the tool structure pattern used throughout the codebase. The migration from deprecated `Server` class to `McpServer` class is complete.

### Implementation Status

1. ✅ **Modern MCP SDK**: Uses `McpServer` class from `@modelcontextprotocol/sdk`
2. ✅ **Structured Tool Registration**: Uses `registerTool` method with configuration objects
3. ✅ **Standardized Interface**: All tools implement `OsmToolDefinition` interface
4. ✅ **Zero Breaking Changes**: External API remains fully compatible

### Current Architecture

**MCP SDK v1.21.1 - McpServer API**:

```typescript
McpServer.registerTool<InputArgs extends ZodRawShape | ZodType<object>, OutputArgs extends ZodRawShape | ZodType<object>>(
    name: string,
    config: {
        title?: string;
        description?: string;
        inputSchema?: InputArgs;
        outputSchema?: OutputArgs;
        annotations?: ToolAnnotations;
        _meta?: Record<string, unknown>;
    },
    cb: ToolCallback<InputArgs>
): RegisteredTool
```

### New Tool Structure

**Each tool must conform to this interface**:

```typescript
interface ToolDefinition<InputArgs, OutputArgs> {
    name: string;
    config: () => {
        title?: string;
        description?: string;
        inputSchema?: InputArgs;
        outputSchema?: OutputArgs;
        annotations?: ToolAnnotations;
        _meta?: Record<string, unknown>;
    };
    handler: ToolCallback<InputArgs>;
}
```

**Key Requirements**:
1. **name**: Tool identifier (e.g., "get_tag_info")
2. **config()**: Function that returns tool configuration
   - Must be a function (not a static object) to allow dynamic generation
   - Returns schema definitions, descriptions, and metadata
   - **inputSchema**: Zod schema for input validation (e.g., `{ tagKey: z.string() }`)
   - **outputSchema**: Zod schema for output validation (optional)
3. **handler**: Async tool implementation callback function
   - **Async function**: Use parameter destructuring for clean code
   - **No parameters**: `async (_args, _extra) => { ... }`
   - **With parameters**: `async ({ param1, param2 }, _extra) => { ... }`
   - **TypeScript typing**: Arguments are automatically typed by Zod schema (inferred from inputSchema)
   - **Pre-validated inputs**: Zod validates inputs before calling handler - no additional validation needed
   - **Returns**: Object with `content` array and optional `structuredContent`

### Handler Function Details

**Input Validation with Zod v3**:
- `inputSchema` in `config()` defines Zod validation rules
- MCP SDK validates inputs automatically before calling handler
- Handler receives fully validated and typed arguments
- No manual input validation logic needed in handler

**Zod Schema Format (MCP-specific)**:
```typescript
// ✅ MCP FORMAT - Object with Zod field validators
inputSchema: {
    weightKg: z.number().positive().describe('Body weight in kilograms'),
    heightM: z.number().positive().describe('Body height in meters')
}

// ❌ NOT standard Zod object schema
inputSchema: z.object({
    weightKg: z.number(),
    heightM: z.number()
})
```

**Using Descriptions and Constraints**:
```typescript
inputSchema: {
    email: z.string()
        .email()
        .describe('User email address'), // ← parameter description

    age: z.number()
        .int()
        .positive()
        .max(120)
        .optional()
        .default(18)
        .describe('User age (18 if not provided)'),

    role: z.enum(['admin', 'user', 'guest'])
        .describe('User role in the system'),

    tags: z.array(z.string())
        .min(1)
        .describe('List of tags (at least one required)')
}
```

**Handler Signature**:
```typescript
// No parameters - use _args
async (_args, _extra) => {
    return { content: [{ type: 'text', text: 'result' }] };
}

// With parameters - use destructuring
async ({ param1, param2 }, _extra) => {
    // params are already validated by Zod
    // params are typed by TypeScript (inferred from inputSchema)

    return {
        content: [{ type: 'text', text: 'result' }],
        structuredContent: { key: 'value' }
    };
}
```

**Example from MCP SDK Documentation**:
```typescript
// Create server
const server = new McpServer({
    name: 'my-app',
    version: '1.0.0'
});

// Register tool with Zod validation
server.registerTool(
    'calculate-bmi',
    {
        title: 'BMI Calculator',
        description: 'Calculate Body Mass Index',
        inputSchema: {
            weightKg: z.number(),
            heightM: z.number()
        },
        outputSchema: { bmi: z.number() }
    },
    async ({ weightKg, heightM }) => {
        const output = { bmi: weightKg / (heightM * heightM) };
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(output)
                }
            ],
            structuredContent: output
        };
    }
);
```

### Tool Registration Pattern

**Current implementation in src/index.ts**:

```typescript
import { tools } from "./tools/index.js";

export function createServer(): McpServer {
    const mcpServer = new McpServer(
        {
            name: "osm-tagging-schema",
            version: pkg.version,
        },
        {
            capabilities: {
                tools: {},
            },
        },
    );

    // Register all tools in a loop
    for (const tool of tools) {
        mcpServer.registerTool(tool.name, tool.config(), tool.handler);
    }

    return mcpServer;
}
```

**Tool exports in src/tools/index.ts**:

```typescript
import type { OsmToolDefinition } from "../types/index.js";
import CheckDeprecated from "./check-deprecated.js";
import GetPresetDetails from "./get-preset-details.js";
import GetTagValues from "./get-tag-values.js";
import SearchPresets from "./search-presets.js";
import SearchTags from "./search-tags.js";
import SuggestImprovements from "./suggest-improvements.js";
import ValidateTag from "./validate-tag.js";
import ValidateTagCollection from "./validate-tag-collection.js";

// All available tools (sorted alphabetically)
export const tools: OsmToolDefinition<any>[] = [
    CheckDeprecated,
    GetPresetDetails,
    GetTagValues,
    SearchPresets,
    SearchTags,
    SuggestImprovements,
    ValidateTag,
    ValidateTagCollection,
];
```

### Adding New Tools

**To implement a missing tool** (e.g., `get_tag_info`):

1. **Create tool file**: `src/tools/get-tag-info.ts`
2. **Implement OsmToolDefinition interface**:
   - `name`: Tool identifier (e.g., "get_tag_info")
   - `config()`: Returns tool configuration with inputSchema
   - `handler`: Async function with SchemaLoader parameter
3. **Export tool**: Add import/export in `src/tools/index.ts`
4. **Write tests**:
   - Unit tests: `tests/tools/get-tag-info.test.ts`
   - Integration tests: `tests/integration/get-tag-info.test.ts`
5. **Document**: Add API documentation in `docs/api/get_tag_info.md`

**Example tool structure** (see existing tools for reference):

```typescript
import type { OsmToolDefinition } from "../types/index.js";
import { z } from "zod";

const GetTagInfo: OsmToolDefinition<{ tagKey: z.ZodString }> = {
    name: "get_tag_info",
    config: () => ({
        description: "Get comprehensive information about a tag key",
        inputSchema: {
            tagKey: z.string().describe("The OSM tag key to query"),
        },
    }),
    handler: async ({ tagKey }, { loader }) => {
        const schema = await loader.loadSchema();
        // Implementation here
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    },
};

export default GetTagInfo;
```

### Architecture Benefits

1. ✅ **Future-Proof**: Uses modern MCP SDK API (not deprecated)
2. ✅ **Type Safety**: TypeScript generics for input/output schemas with Zod validation
3. ✅ **Consistent Structure**: All tools follow same pattern
4. ✅ **Easy to Extend**: Adding new tools is straightforward
5. ✅ **Maintainable**: One file per tool, clear separation of concerns

### References

- MCP SDK v1.21.1 Documentation: https://modelcontextprotocol.io
- GitHub Repository: https://github.com/modelcontextprotocol/typescript-sdk
- Tool Definition Interface: `src/types/tool-definition.ts`

## Data Sources and Usage Patterns

This section documents key architectural decisions about data sources from `@openstreetmap/id-tagging-schema` and their appropriate use in the MCP server context.

### Schema Data Files Analysis

The schema library provides multiple JSON data files, each serving a distinct purpose:

| File | Size | Entries | Purpose | Usage in Project |
|------|------|---------|---------|------------------|
| `presets.json` | 672 KB | 1,707 | Feature presets with tags, geometry, fields | ✅ Core data - ALL tools |
| `fields.json` | 150 KB | 714 | Tag field definitions (types, options, validation) | ✅ Core data - ALL tools |
| `translations/en.json` | 476 KB | 1,707 presets<br>714 fields<br>17 categories | **UI strings only**: names, labels, descriptions | ⚠️ LIMITED - 2 tools only |
| `deprecated.json` | 81 KB | 529 | Deprecated tag mappings | ✅ Validation tools (4 tools) |
| `preset_categories.json` | 7 KB | 17 | Category membership | ✅ Category tools (2 tools) |
| `preset_defaults.json` | 1.5 KB | ~10 | Default presets per geometry | ✅ Schema exploration |

**IMPORTANT**: Files are **complementary** - each contains unique data that cannot be replaced by others.

### Translations File (`translations/en.json`) - Usage Guidelines

**Structure**:
```json
{
  "en": {
    "presets": {
      "categories": { "category-building": { "name": "Building Features" } },
      "fields": {
        "parking": {
          "label": "Type",
          "options": {
            "surface": { "title": "Surface", "description": "..." },
            "underground": { "title": "Underground", "description": "..." }
          }
        }
      },
      "presets": {
        "amenity/parking": { "name": "Parking Lot", "terms": "..." }
      }
    }
  }
}
```

**What translations contain**:
- ✅ Human-readable names for presets (e.g., "Parking Lot" for `amenity/parking`)
- ✅ Field labels and option descriptions (e.g., "Type" label, "Surface" option title)
- ✅ Search terms for presets (e.g., "automobile parking, car lot")
- ✅ Category display names (e.g., "Building Features")

**What translations DO NOT contain**:
- ❌ Tag structure and definitions (that's in `presets.json` and `fields.json`)
- ❌ Field types, validation rules, constraints (that's in `fields.json`)
- ❌ Deprecated tag mappings (that's in `deprecated.json`)
- ❌ Geometry types, preset membership (that's in `presets.json`)

**Current usage** (2/14 tools):
1. `get_tag_info` - Uses preset names and field option descriptions
2. `get_tag_values` - Uses field option titles and descriptions

**TypeScript interface**:
```typescript
// Current interface (src/types/index.ts:121)
export interface SchemaData {
  translations?: Record<string, unknown>;  // Dynamic, untyped
}

// Access pattern in code
const fieldStrings = (schema.translations as Record<string, any>)?.en?.presets?.fields?.[fieldKey];
```

**TypeScript type definitions**:
- ❌ **NOT PROVIDED** by `@openstreetmap/id-tagging-schema` package
- Package has no `.d.ts` files or `types` field in `package.json`
- Project maintains own interfaces in `src/types/index.ts`

**Recommendations**:
- ✅ **Keep all data files** - each serves unique purpose
- ✅ **Expand translations usage** - only 2/14 tools currently use them
- ⚠️ **Add TypeScript interfaces** for translations structure (type safety)
- ✅ **Schema loader loads all files** in parallel for optimal performance

### Validation Tools - MCP Server Context

**Purpose**: This is an **MCP server for AI assistants**, not a form-building UI like iD editor or StreetComplete.

**Key difference**:
- **Form-based editors**: Validation = "what to show, when to show, how to show"
- **MCP server**: Validation = "data quality analysis, education, error detection"

#### Validation Tools (4/14 tools)

| Tool | Function | MCP Use Case | Value for AI |
|------|----------|--------------|--------------|
| `validate_tag` | Validate single tag | ✅ Typo detection, value checking | ⭐⭐⭐ High |
| `validate_tag_collection` | Validate tag collection | ✅ Data quality analysis | ⭐⭐⭐ High |
| `check_deprecated` | Check deprecated tags | ✅ Schema updates, migration help | ⭐⭐⭐ High |
| `suggest_improvements` | Suggest missing fields | ✅ Data completeness | ⭐⭐ Medium |

#### Use Cases for AI Assistants

**1. Educational / Explaining**
```
User: "Can I use amenity=parking_lot?"
AI: *uses validate_tag*
AI: "Tag 'amenity=parking_lot' doesn't exist in schema.
     Did you mean 'amenity=parking'?"
```

**2. Data Quality Analysis**
```
User: "Analyze these OSM exports for issues"
AI: *uses validate_tag_collection*
AI: "Found 3 deprecated tags:
     - highway=ford → ford=yes
     - amenity=ev_charging → amenity=charging_station"
```

**3. Code Review / Import Validation**
```python
# Import script
tags = {"amenity": "restraunt"}  # typo!
```
AI detects typos in tag values using validation tools.

**4. Data Completeness Check**
```
User: "Check if restaurant data is complete"
AI: *uses suggest_improvements*
AI: "Missing common tags: cuisine, opening_hours, wheelchair"
```

#### Features Relevant vs. Not Relevant

**✅ Useful for MCP server**:

1. **Deprecated tag checking** ⭐⭐⭐
   - OSM schema evolves, AI should know current tags
   - Tools: `check_deprecated`, `validate_tag`

2. **Value validation** ⭐⭐⭐
   - Detect typos, incorrect values
   - Tools: `validate_tag` (checks `field.options`)

3. **Completeness suggestions** ⭐⭐
   - Help users complete data
   - Tools: `suggest_improvements`

4. **Geometry validation** ⭐⭐ (NOT YET IMPLEMENTED)
   - Check if tag appropriate for geometry type
   - Example: `amenity=parking` typically `area`, not `point`

**❌ NOT useful for MCP server** (form-specific):

1. **`prerequisiteTag` validation** (50 fields in schema)
   - **Purpose**: Show field X only when field Y has value Z
   - **Example**: Show "voltage" only when "electrified ≠ no"
   - **MCP value**: ❌ None - only relevant for dynamic forms
   - **AI alternative**: Explain field relationships in text

2. **Field display logic**
   - **Purpose**: UI conditional rendering
   - **MCP value**: ❌ None - AI doesn't build forms

**🔄 Consider adding** (future enhancements):

1. **Geometry-based validation** ⭐⭐⭐
```typescript
{
  "tags": { "amenity": "parking" },
  "geometry": "point"  // ← Warning: parking usually "area"
}
```

2. **Value type validation** ⭐⭐
```typescript
{
  "key": "maxspeed",
  "value": "fast"  // ← Error: should be number (e.g., "50")
}
```
Currently: Validates `field.options` only, not `field.type` (number/url/email).

3. **Tag combination validation** ⭐
```typescript
{
  "tags": {
    "amenity": "restaurant",
    "shop": "bakery"  // ← Warning: conflicting tags
  }
}
```

#### Summary

**Validation in MCP context**:
- **Purpose**: Data quality, education, error detection (NOT form building)
- **Current tools**: All 4 validation tools are useful and should be kept
- **Omit**: Form-specific features like `prerequisiteTag` logic
- **Expand**: Geometry validation, type validation, combination checks

## Development Status

**Current Phase: Phase 7 - PRODUCTION READY ✅**

**Status**: Production-ready MCP server with 8 optimized tools providing complete OSM tagging schema functionality.

### Actual Implementation Status

**Phase 1: Project Setup ✅ COMPLETE**
- ✅ Project structure initialized with TypeScript 5.9
- ✅ Dependencies installed (@modelcontextprotocol/sdk, @openstreetmap/id-tagging-schema)
- ✅ BiomeJS 2.3.4 configured for code quality
- ✅ Node.js test runner configured
- ✅ GitHub Actions CI/CD pipeline set up
- ✅ Dependabot configured for automated dependency updates
- ✅ MCP server implementation with McpServer class (modern API)

**Phase 2: Schema Integration ✅ COMPLETE**
- ✅ Type definitions created for schema structures (Preset, Field, DeprecatedTag, etc.)
- ✅ Schema loader utility implemented with full test coverage
- ✅ Caching mechanism with configurable TTL
- ✅ Indexing system for fast tag lookups (byKey, byTag, byGeometry, byFieldKey)
- ✅ Query operations (findPresetsByKey, findPresetsByTag, findPresetsByGeometry)
- ✅ Integration tests implemented
- ✅ CI/CD pipeline configured

**Phase 3: Core Tool Implementation ✅ COMPLETE (8 tools - optimized set)**

**All Tools Implemented** (8/8):
- ✅ `check_deprecated` - Check if tag is deprecated with replacement suggestions
- ✅ `get_preset_details` - Get complete preset information (tags, geometry, fields, metadata)
- ✅ `get_tag_values` - Get all possible values for a tag key
- ✅ `search_presets` - Search for presets by keyword or tag (with geometry filtering and limits)
- ✅ `search_tags` - Search for tags by keyword
- ✅ `suggest_improvements` - Suggest improvements for tag collections (missing fields, deprecation warnings)
- ✅ `validate_tag` - Validate single tag key-value pairs (checks deprecation, field options, empty values)
- ✅ `validate_tag_collection` - Validate collections of tags with aggregated statistics

**Redundancy Optimization**:
- 6 additional tools considered during planning phase
- All deemed redundant after analyzing functionality overlap
- Current 8 tools provide complete coverage without duplication
- Design favors composition over convenience wrappers

**Phase 4: Testing ✅ COMPLETE**
- ✅ Node.js test runner configured
- ✅ Comprehensive test suite for all 8 tools
- ✅ Unit tests for all implemented tools
- ✅ Integration tests for MCP server
- ✅ Modular structure: One integration test file per tool
- ✅ Shared test utilities in `helpers.ts`
- ✅ Testing with real OpenStreetMap data
- ℹ️ **Note**: TypeScript shows zod import warnings (transitive dependency works at runtime)

**Phase 5: Documentation ✅ COMPLETE (for implemented tools)**
- ✅ Comprehensive user documentation in `docs/` directory
  - `docs/installation.md`: Complete installation guide (npx, source, Docker)
  - `docs/configuration.md`: Configuration for Claude Code/Desktop and custom clients
  - `docs/usage.md`: Usage examples, workflows, and best practices
  - `docs/troubleshooting.md`: Common issues and solutions
  - `docs/deployment.md`: Docker Compose deployment guide
  - `docs/security.md`: Security, provenance, SLSA, and SBOM documentation
- ✅ API documentation framework
  - `docs/api/README.md`: API overview structure
  - `docs/api/get_tag_info.md`: Example API documentation (for planned tool)
  - `docs/api/NOTE.md`: Documentation pattern guide
- ✅ Enhanced developer documentation
  - `CONTRIBUTING.md`: Contribution guidelines with TDD workflow
  - `DEVELOPMENT.md`: Development setup, commands, debugging, troubleshooting
  - `ROADMAP.md`: Development roadmap
  - `CHANGELOG.md`: Project changelog (Keep a Changelog format)
- ✅ Compact README.md with clear navigation

**Phase 6: Optimization & Polish ✅ COMPLETE**
- ✅ Schema loading optimization (always-on indexing, preloading at startup)
- ✅ Logging and debugging support (configurable log levels, structured output)
- ✅ Schema update handling (version tracking, graceful error handling)
- ✅ Package size optimization (59% reduction via `files` field in package.json)
- ✅ Tag parser utility for text and JSON input formats

**Phase 7: Distribution & Deployment ✅ COMPLETE**
- ✅ **NPM Publishing**: Package published with SLSA Level 3 provenance and SBOM
- ✅ **Docker Support**: Multi-stage builds, multi-arch (amd64/arm64), image signing (Cosign)
- ✅ **Container Registry**: Images published to GitHub Container Registry (ghcr.io)
- ✅ **Security Scanning**: Trivy vulnerability scanning, security reports
- ✅ **Transport Protocols**: stdio (default), HTTP/SSE for web clients
- ✅ **Docker Compose**: Production, development, and test configurations
- ✅ **Health Checks**: `/health` (liveness) and `/ready` (readiness) endpoints

### Known Issues & Current Work

**Known Issue**:
1. ⚠️ **Missing Build Dependency**: `zod` package not listed in package.json (causes TypeScript compilation warnings, but builds successfully)
   - Impact: TypeScript shows import errors for zod
   - Workaround: zod is transitive dependency via @modelcontextprotocol/sdk
   - Fix: Add explicit `zod` dependency to package.json devDependencies

**Architecture Status**:
- ✅ **Modern MCP SDK**: Using `McpServer` class (migration complete)
- ✅ **Modular Architecture**: One file per tool for clarity and maintainability
- ✅ **Alphabetical Tool Ordering**: Tools returned in alphabetical order for predictable API
- ✅ **Tool Definition Interface**: `OsmToolDefinition` interface established
- ✅ **Optimized Tool Set**: 8 non-redundant tools providing complete functionality

**Historical Bug Fixes** (from previous development):
- ✅ search_tags fields.json coverage (searches both fields.json and presets)
- ✅ Alphabetical tool sorting (predictable API)
- ✅ Tag key format handling (colon vs slash separators, field.key as source of truth)

### Future Enhancements

**Potential Additions** (See ROADMAP.md):
- Advanced validation features (geometry constraints, field inheritance)
- Authentication and rate limiting for public deployments
- Additional tools only if community feedback identifies gaps in current coverage

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

### 1. NPM Publishing with Provenance ✅ IMPLEMENTED

**Goal**: Establish trust and transparency in package distribution through npm provenance signing.

**Status**: ✅ **COMPLETED** - Full implementation with SLSA Level 3 attestations

**Implementation**:
- ✅ **GitHub Actions Workflow**: Automated publishing triggered by version tags (.github/workflows/publish.yml)
  - Comprehensive validation (tests, linting, type checking)
  - Automated version verification
  - GitHub release creation with security information
- ✅ **NPM Provenance**: Build provenance attestations linking to GitHub Actions builds
  - `.npmrc` configured with `provenance=true`
  - `--provenance` flag in publish command
  - OIDC token authentication (id-token: write permission)
- ✅ **SLSA Level 3 Attestations**: Comprehensive build provenance
  - Build provenance attestations for npm tarball
  - SBOM (Software Bill of Materials) in CycloneDX format
  - SBOM attestations for supply chain transparency
  - Non-falsifiable (signed by GitHub Actions)
- ✅ **Security Documentation**: Complete user and maintainer guides
  - `docs/security.md`: Comprehensive security and provenance documentation
  - `CONTRIBUTING.md`: Publishing guide with verification steps
  - `README.md`: Security badges (NPM Provenance, SLSA Level 3)
- ✅ **Verification**: Multiple verification methods
  - npm provenance: `npm audit signatures`
  - SLSA attestations: `gh attestation verify`
  - SBOM access via GitHub releases

**Benefits**:
- ✅ Users can verify packages were built by GitHub Actions from this repository
- ✅ Protection against supply chain attacks
- ✅ Transparent build process with SBOM
- ✅ Industry standard for secure package distribution (SLSA Level 3)
- ✅ Complete dependency transparency
- ✅ Tamper-proof supply chain

**Resources**:
- npm provenance: https://docs.npmjs.com/generating-provenance-statements
- GitHub Actions trusted publishing: https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds
- SLSA Framework: https://slsa.dev/
- CycloneDX SBOM: https://cyclonedx.org/

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

### 3. Additional Transport Protocols ✅ IMPLEMENTED

**Goal**: Support multiple transport protocols beyond stdio for diverse deployment scenarios.

**Status**: ✅ **COMPLETED** - HTTP Streamable transport implemented with SSE support

**Supported Transports**:

**a) stdio (Standard Input/Output)** ✅
- Default transport for MCP clients
- Process-based communication
- Use case: CLI tools, Claude Desktop integration
- **Configuration**: No environment variables needed (default)

**b) HTTP Streamable** ✅
- HTTP-based streaming with Server-Sent Events
- Full MCP Streamable HTTP transport specification
- Stateful session management with UUID session IDs
- Compatible with web browsers and HTTP clients
- Use case: Web applications, API gateways, scalable deployments
- **Configuration**: `TRANSPORT=http` (recommended)

**c) SSE (Server-Sent Events)** ✅
- Alias for HTTP transport (backward compatibility)
- Same implementation as HTTP transport
- **Configuration**: `TRANSPORT=sse` (legacy, kept for compatibility)

**Transport Configuration** ✅:
```bash
# Environment variables
TRANSPORT=stdio|http|sse    # Default: stdio
PORT=3000                   # Default: 3000 (HTTP/SSE only)
HOST=0.0.0.0                # Default: 0.0.0.0 (HTTP/SSE only)
```

**Usage Examples** ✅:
```bash
# stdio transport (default)
npx @gander-tools/osm-tagging-schema-mcp

# HTTP transport (recommended)
TRANSPORT=http npx @gander-tools/osm-tagging-schema-mcp

# SSE transport (legacy, same as http)
TRANSPORT=sse npx @gander-tools/osm-tagging-schema-mcp

# HTTP with custom port
TRANSPORT=http PORT=8080 npx @gander-tools/osm-tagging-schema-mcp

# npm scripts
npm run start:http  # Start with HTTP transport on port 3000
npm run start:sse   # Start with SSE transport on port 3000 (legacy)
npm run dev:http    # Development mode with HTTP transport
npm run dev:sse     # Development mode with SSE transport (legacy)

# Docker with HTTP
docker run -e TRANSPORT=http -e PORT=3000 -p 3000:3000 \
  ghcr.io/gander-tools/osm-tagging-schema-mcp:dev
```

**Implementation Details** ✅:
- Uses `StreamableHTTPServerTransport` from MCP SDK (not deprecated `SSEServerTransport`)
- Session management: Tracks multiple sessions with UUID-based session IDs
- Session lifecycle: `onsessioninitialized` and `onsessionclosed` callbacks
- HTTP request routing: GET for SSE streams, POST for JSON-RPC messages, DELETE for session termination
- Error handling: Graceful error responses with proper HTTP status codes

**Test Coverage** ✅:
- Environment variable parsing tests
- HTTP server creation tests
- StreamableHTTPServerTransport integration tests
- Session ID generation and tracking tests
- 12 SSE transport tests passing (100% coverage)

**Benefits** ✅:
- Flexibility in deployment architecture
- Web browser accessibility
- Integration with existing HTTP infrastructure
- Support for public-facing services
- Backward compatibility with stdio transport

### 4. Public Service Deployment Configuration ✅ IMPLEMENTED

**Goal**: Enable deployment as a publicly accessible service with proper security and operations.

**Status**: ✅ **COMPLETED** - Production-ready Docker Compose deployment with health checks

**Implementation**:

**Health Check Endpoints** ✅:
- **Liveness probe**: `/health` endpoint returns server status
  - Simple check: Is the server running?
  - Response: `{ status: "ok", service: "osm-tagging-schema-mcp", timestamp: "..." }`
- **Readiness probe**: `/ready` endpoint validates schema loaded
  - Complex check: Is the server ready to handle requests?
  - Response includes schema stats: presets count, fields count, version
  - Returns 503 if schema not loaded yet
- **Docker integration**: Health checks work with both stdio and HTTP transports
  - HTTP: Uses `/health` endpoint
  - stdio: Falls back to Node.js check

**Docker Compose Configurations** ✅:
- **Production**: `docker-compose.yml`
  - Latest stable image
  - HTTP transport on port 3000
  - Resource limits: 512MB RAM, 1 CPU
  - Read-only filesystem for security
  - Automated health checks
  - Network isolation
- **Development**: `docker-compose.dev.yml`
  - Development image with debug logging
  - Higher resource limits (1GB RAM, 2 CPU)
  - Hot reload support
- **Testing**: `docker-compose.test.yml`
  - Local build configuration
  - Debug logging enabled

**Documentation** ✅:
- Comprehensive deployment guide: `docs/deployment.md`
  - Quick start instructions
  - Production deployment checklist
  - Configuration options (environment variables, ports, resources)
  - Health check documentation
  - Monitoring and logging
  - Scaling strategies (vertical and horizontal)
  - Security best practices
  - Troubleshooting guide
- Docker Compose quick start in `docs/configuration.md`
- Updated README.md with deployment link

**Security Features** ✅:
- **No new privileges**: Security option enabled
- **Read-only filesystem**: Immutable runtime
- **Non-root user**: Container runs as unprivileged user
- **Network isolation**: Bridge network with optional custom configuration

**Future Security Enhancements** (not yet implemented):
- **Authentication**: API key, JWT, OAuth 2.0
- **Rate Limiting**: Per-IP and per-user quotas
- **TLS/HTTPS**: Certificate management (Let's Encrypt)

**Benefits** ✅:
- Production-ready deployment with Docker Compose
- Automated health monitoring and recovery
- Easy configuration and management
- Reproducible deployments
- Security-hardened containers

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
