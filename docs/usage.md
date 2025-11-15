# Usage Guide

This guide provides practical examples of using the OSM Tagging Schema MCP Server tools.

## Table of Contents

- [Getting Started](#getting-started)
- [Common Use Cases](#common-use-cases)
- [Tool Categories](#tool-categories)
  - [Tag Query Tools](#tag-query-tools)
  - [Preset Discovery Tools](#preset-discovery-tools)
  - [Validation Tools](#validation-tools)
  - [Schema Exploration Tools](#schema-exploration-tools)
- [Workflow Examples](#workflow-examples)
- [Best Practices](#best-practices)

## Getting Started

After installation and configuration (see [Installation](./installation.md) and [Configuration](./configuration.md)), you can use the tools through your MCP client.

### Basic Tool Usage

**In Claude Code CLI or Claude Desktop**, simply ask natural language questions:

```
"What tags are available for restaurants?"
"Validate this OSM feature: amenity=restaurant, cuisine=italian"
"What presets are available for buildings?"
```

**Programmatically** (using MCP SDK):

```typescript
const response = await client.callTool({
  name: "get_tag_info",
  arguments: {
    tagKey: "amenity"
  }
});
```

## Common Use Cases

### 1. Exploring Available Tags

**Question:** "What tags can I use for a parking facility?"

**Tool:** `get_tag_info`

```json
{
  "name": "get_tag_info",
  "arguments": {
    "tagKey": "parking"
  }
}
```

**Response:** All possible values for `parking` tag (surface, underground, multi-storey, etc.)

---

### 2. Finding Related Tags

**Question:** "What other tags are commonly used with amenity=restaurant?"

**Tool:** `get_related_tags`

```json
{
  "name": "get_related_tags",
  "arguments": {
    "tag": "amenity=restaurant",
    "limit": 10
  }
}
```

**Response:** Top 10 related tags sorted by frequency (cuisine, opening_hours, wheelchair, etc.)

---

### 3. Searching for Presets

**Question:** "Find all presets for hospitals"

**Tool:** `search_presets`

```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "hospital",
    "limit": 20
  }
}
```

**Response:** All hospital-related presets (amenity/hospital, healthcare/hospital, etc.)

---

### 4. Validating Tags

**Question:** "Is this tag combination valid?"

**Tool:** `validate_tag_collection`

**Format 1: Object format**
```json
{
  "name": "validate_tag_collection",
  "arguments": {
    "tags": {
      "amenity": "parking",
      "parking": "surface",
      "capacity": "50",
      "fee": "yes",
      "access": "customers"
    }
  }
}
```

**Format 2: Text format (key=value lines)**
```json
{
  "name": "validate_tag_collection",
  "arguments": {
    "tags": "amenity=parking\nparking=surface\ncapacity=50\nfee=yes\naccess=customers"
  }
}
```

**Format 3: JSON string**
```json
{
  "name": "validate_tag_collection",
  "arguments": {
    "tags": "{\"amenity\": \"parking\", \"parking\": \"surface\"}"
  }
}
```

**Response:** Validation results with any errors or warnings

**Note:** The text format supports comments (lines starting with `#`) and empty lines for better readability.

---

### 5. Validating and Checking for Deprecated Tags

**Question:** "Is amenity=park_bench valid or deprecated?"

**Tool:** `validate_tag`

```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "amenity",
    "value": "park_bench"
  }
}
```

**Response:** Validation result with deprecation status and suggested replacement if deprecated

---

### 6. Getting Improvement Suggestions

**Question:** "What tags am I missing for my restaurant feature?"

**Tool:** `suggest_improvements`

**Format 1: Object format**
```json
{
  "name": "suggest_improvements",
  "arguments": {
    "tags": {
      "amenity": "restaurant",
      "name": "Pizza Place"
    }
  }
}
```

**Format 2: Text format (key=value lines)**
```json
{
  "name": "suggest_improvements",
  "arguments": {
    "tags": "amenity=restaurant\nname=Pizza Place"
  }
}
```

**Response:** Suggestions for missing tags (cuisine, opening_hours, phone, website, etc.)

**Note:** Text format is especially useful when copying tag data from OSM editors or other sources.

## Tool Categories

### Tag Query Tools

#### `get_tag_info`

Get comprehensive information about a specific tag key.

**Example 1:** Basic tag info
```json
{
  "name": "get_tag_info",
  "arguments": {
    "tagKey": "building"
  }
}
```

**Returns:**
- All possible values (yes, house, commercial, etc.)
- Value type information
- Field definition status

**Example 2:** Complex tag with colons
```json
{
  "name": "get_tag_info",
  "arguments": {
    "tagKey": "toilets:wheelchair"
  }
}
```

---

#### `get_tag_values`

Get all valid values for a tag key.

**Example:**
```json
{
  "name": "get_tag_values",
  "arguments": {
    "tagKey": "highway"
  }
}
```

**Returns:** Array of values sorted alphabetically (motorway, trunk, primary, secondary, etc.)

**Use case:** Building a tag editor dropdown

---

#### `search_tags`

Search for tags by keyword.

**Example 1:** Search by keyword
```json
{
  "name": "search_tags",
  "arguments": {
    "keyword": "wheelchair",
    "limit": 20
  }
}
```

**Returns:** All tags containing "wheelchair" (wheelchair, toilets:wheelchair, etc.)

**Example 2:** Find accessibility tags
```json
{
  "name": "search_tags",
  "arguments": {
    "keyword": "access",
    "limit": 50
  }
}
```

---

#### `get_related_tags`

Find tags commonly used together.

**Example 1:** Related tags for a specific tag
```json
{
  "name": "get_related_tags",
  "arguments": {
    "tag": "amenity=cafe"
  }
}
```

**Returns:** Tags sorted by frequency:
- `cuisine=*` (80% frequency)
- `opening_hours=*` (65% frequency)
- `outdoor_seating=*` (45% frequency)

**Example 2:** Related tags by key only
```json
{
  "name": "get_related_tags",
  "arguments": {
    "tag": "shop",
    "limit": 15
  }
}
```

### Preset Discovery Tools

#### `search_presets`

Search for presets by name or tag.

**Example 1:** Search by keyword
```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "restaurant"
  }
}
```

**Example 2:** Search by tag
```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "amenity=restaurant"
  }
}
```

**Example 3:** Filter by geometry
```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "building",
    "geometry": "area",
    "limit": 30
  }
}
```

**Returns:** Matching presets with IDs and basic info

---

#### `get_preset_details`

Get complete information about a preset.

**Example:**
```json
{
  "name": "get_preset_details",
  "arguments": {
    "presetId": "amenity/restaurant"
  }
}
```

**Returns:**
- Preset ID
- Tags (amenity=restaurant)
- Geometry types (point, area)
- Fields (name, cuisine, diet_multi, etc.)
- More fields (optional tags)
- Icon name
- Match score

**Use case:** Building a feature editor

---

#### `get_preset_tags`

Get recommended tags for a preset.

**Example:**
```json
{
  "name": "get_preset_tags",
  "arguments": {
    "presetId": "amenity/parking"
  }
}
```

**Returns:**
- `tags`: Identifying tags (amenity=parking)
- `addTags`: Additional recommended tags (if any)

**Use case:** Auto-tagging features

### Validation Tools

#### `validate_tag`

Validate a single tag key-value pair. Includes deprecation checking, field option validation, and schema compliance.

**Example 1:** Valid tag
```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "amenity",
    "value": "restaurant"
  }
}
```

**Returns:**
```json
{
  "valid": true,
  "deprecated": false,
  "message": "Tag amenity=restaurant is valid"
}
```

**Example 2:** Deprecated tag
```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "amenity",
    "value": "park_bench"
  }
}
```

**Returns:**
```json
{
  "valid": true,
  "deprecated": true,
  "message": "Tag amenity=park_bench is deprecated. Consider using: leisure=picnic_table",
  "replacement": {
    "leisure": "picnic_table"
  }
}
```

**Example 3:** Unknown tag key
```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "custom_key",
    "value": "custom_value"
  }
}
```

**Returns:**
```json
{
  "valid": true,
  "deprecated": false,
  "message": "Tag key 'custom_key' not found in schema (custom tags are allowed in OpenStreetMap)"
}
```

---

#### `validate_tag_collection`

Validate a complete set of tags.

**Example:**
```json
{
  "name": "validate_tag_collection",
  "arguments": {
    "tags": {
      "amenity": "restaurant",
      "name": "Pizza Place",
      "cuisine": "pizza",
      "opening_hours": "Mo-Su 11:00-22:00",
      "wheelchair": "yes",
      "outdoor_seating": "yes"
    }
  }
}
```

**Returns:**
```json
{
  "valid": true,
  "tagResults": {
    "amenity": { "valid": true, "errors": [], "warnings": [] },
    "name": { "valid": true, "errors": [], "warnings": [] },
    ...
  },
  "errors": [],
  "warnings": [],
  "deprecatedCount": 0,
  "errorCount": 0,
  "warningCount": 0
}
```

**Use case:** Feature validation before saving (includes deprecation checking)

---

#### `suggest_improvements`

Get suggestions for improving a tag collection.

**Example:**
```json
{
  "name": "suggest_improvements",
  "arguments": {
    "tags": {
      "amenity": "restaurant",
      "name": "Pizza Place"
    }
  }
}
```

**Returns:**
```json
{
  "suggestions": [
    "Consider adding 'cuisine' tag (common for amenity/restaurant)",
    "Consider adding 'phone' tag (common for amenity/restaurant)",
    "Consider adding 'opening_hours' tag (common for amenity/restaurant)",
    "Optional: Consider adding 'website' tag",
    "Optional: Consider adding 'outdoor_seating' tag"
  ],
  "warnings": [],
  "matchedPresets": ["amenity/restaurant", "amenity/fast_food"]
}
```

**Use case:** Quality improvement for OSM features

### Schema Exploration Tools

#### `get_categories`

List all available tag categories.

**Example:**
```json
{
  "name": "get_categories",
  "arguments": {}
}
```

**Returns:** Array of categories sorted alphabetically:
```json
[
  { "name": "Amenity", "count": 245 },
  { "name": "Building", "count": 89 },
  { "name": "Highway", "count": 67 },
  ...
]
```

---

#### `get_category_tags`

Get all tags in a specific category.

**Example:**
```json
{
  "name": "get_category_tags",
  "arguments": {
    "category": "Building"
  }
}
```

**Returns:** Array of preset IDs in that category

---

#### `get_schema_stats`

Get statistics about the schema.

**Example:**
```json
{
  "name": "get_schema_stats",
  "arguments": {}
}
```

**Returns:**
```json
{
  "presetCount": 1707,
  "fieldCount": 799,
  "categoryCount": 15,
  "deprecatedCount": 245
}
```

**Use case:** Schema overview, debugging

## Workflow Examples

### Workflow 1: Adding a New Restaurant

**Step 1:** Search for restaurant presets
```json
{
  "name": "search_presets",
  "arguments": { "keyword": "restaurant" }
}
```

**Step 2:** Get preset details
```json
{
  "name": "get_preset_details",
  "arguments": { "presetId": "amenity/restaurant" }
}
```

**Step 3:** Check recommended tags
```json
{
  "name": "get_preset_tags",
  "arguments": { "presetId": "amenity/restaurant" }
}
```

**Step 4:** Create initial tags
```json
{
  "amenity": "restaurant",
  "name": "La Trattoria",
  "cuisine": "italian"
}
```

**Step 5:** Get improvement suggestions
```json
{
  "name": "suggest_improvements",
  "arguments": { "tags": { ... } }
}
```

**Step 6:** Validate final tags
```json
{
  "name": "validate_tag_collection",
  "arguments": { "tags": { ... } }
}
```

### Workflow 2: Updating Old OSM Data

**Step 1:** Validate tags and check if deprecated
```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "amenity",
    "value": "park_bench"
  }
}
```

**Response includes deprecation status and replacement:**
```json
{
  "valid": true,
  "deprecated": true,
  "message": "Tag amenity=park_bench is deprecated. Consider using: leisure=picnic_table",
  "replacement": {
    "leisure": "picnic_table"
  }
}
```

**Step 2:** Validate replacement tags
```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "leisure",
    "value": "picnic_table"
  }
}
```

### Workflow 3: Building a Tag Editor

**Step 1:** Get schema statistics (for UI)
```json
{
  "name": "get_schema_stats",
  "arguments": {}
}
```

**Step 2:** List categories (for navigation)
```json
{
  "name": "get_categories",
  "arguments": {}
}
```

**Step 3:** Get tags in category (for display)
```json
{
  "name": "get_category_tags",
  "arguments": { "category": "Amenity" }
}
```

**Step 4:** Get tag values (for dropdown)
```json
{
  "name": "get_tag_values",
  "arguments": { "tagKey": "amenity" }
}
```

**Step 5:** Validate user input (real-time)
```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "amenity",
    "value": "restaurant"
  }
}
```

## Advanced Deployment

### HTTP Transport

For web clients and API integrations, use HTTP transport instead of stdio:

**Using npx:**
```bash
TRANSPORT=http PORT=3000 npx @gander-tools/osm-tagging-schema-mcp
```

**Using npm scripts:**
```bash
npm run start:http  # Start with HTTP transport on port 3000
npm run dev:http    # Development mode with hot reload
```

**Using Docker:**
```bash
docker run -e TRANSPORT=http -e PORT=3000 -p 3000:3000 \
  ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
```

**Environment Variables:**
- `TRANSPORT` - Transport type: `stdio` (default), `http`, or `sse`
- `PORT` - HTTP server port (default: 3000)
- `HOST` - HTTP server host (default: 0.0.0.0)
- `LOG_LEVEL` - Logging level: `SILENT`, `ERROR`, `WARN`, `INFO`, `DEBUG`

**HTTP Endpoints:**
- `GET /sse` - Server-Sent Events stream for MCP messages
- `POST /sse` - Send JSON-RPC messages to MCP server
- `DELETE /sse/:sessionId` - Close a session
- `GET /health` - Liveness probe (server status)
- `GET /ready` - Readiness probe (schema loaded status)

### SSE Transport (Legacy)

SSE transport is a legacy alias for HTTP transport. Use `TRANSPORT=http` for new deployments:

```bash
# Legacy SSE transport (same as http)
TRANSPORT=sse PORT=3000 npx @gander-tools/osm-tagging-schema-mcp

# Recommended: Use http instead
TRANSPORT=http PORT=3000 npx @gander-tools/osm-tagging-schema-mcp
```

### Docker Compose Deployment

For production deployments, use Docker Compose for orchestration:

**Production Configuration (`docker-compose.yml`):**
```yaml
version: '3.8'

services:
  osm-tagging-schema-mcp:
    image: ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
    container_name: osm-tagging-schema-mcp
    restart: unless-stopped

    environment:
      TRANSPORT: http
      PORT: 3000
      LOG_LEVEL: INFO

    ports:
      - "3000:3000"

    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

    security_opt:
      - no-new-privileges:true

    read_only: true

    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1'
        reservations:
          memory: 256M
          cpus: '0.5'
```

**Start the service:**
```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Check health
curl http://localhost:3000/health
curl http://localhost:3000/ready

# Stop the service
docker-compose down
```

**Development Configuration (`docker-compose.dev.yml`):**
```yaml
version: '3.8'

services:
  osm-tagging-schema-mcp:
    image: ghcr.io/gander-tools/osm-tagging-schema-mcp:edge
    container_name: osm-tagging-schema-mcp-dev

    environment:
      TRANSPORT: http
      PORT: 3000
      LOG_LEVEL: DEBUG

    ports:
      - "3000:3000"

    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '2'
```

**Start development service:**
```bash
docker-compose -f docker-compose.dev.yml up
```

### Health Checks

**Liveness Probe (`/health`):**
```bash
# Check if server is running
curl http://localhost:3000/health

# Response:
# {
#   "status": "ok",
#   "service": "osm-tagging-schema-mcp",
#   "timestamp": "2025-01-15T10:30:00.000Z"
# }
```

**Readiness Probe (`/ready`):**
```bash
# Check if schema is loaded and ready
curl http://localhost:3000/ready

# Response (ready):
# {
#   "status": "ready",
#   "schemaLoaded": true,
#   "stats": {
#     "presets": 1707,
#     "fields": 799,
#     "categories": 15,
#     "version": "6.7.3"
#   }
# }

# Response (not ready):
# HTTP 503
# {
#   "status": "not_ready",
#   "schemaLoaded": false,
#   "error": "Schema not loaded yet"
# }
```

### Monitoring and Logging

**View Logs:**
```bash
# Docker
docker logs osm-tagging-schema-mcp

# Docker Compose
docker-compose logs -f

# Filter by log level
docker logs osm-tagging-schema-mcp 2>&1 | grep ERROR
```

**Log Levels:**
- `SILENT` - No logs (not recommended for production)
- `ERROR` - Only errors
- `WARN` - Errors and warnings (recommended for production)
- `INFO` - Errors, warnings, and info (good for troubleshooting)
- `DEBUG` - All logs including debug details (development only)

**Example:**
```bash
# Production: minimal logging
TRANSPORT=http LOG_LEVEL=WARN npx @gander-tools/osm-tagging-schema-mcp

# Development: detailed logging
TRANSPORT=http LOG_LEVEL=DEBUG npm run dev:http
```

📖 **For production deployment guide**, see [deployment.md](./deployment.md)

## Best Practices

### 1. Use Specific Tools

Choose the most specific tool for your task:
- ✅ `get_tag_values` for dropdown lists
- ❌ `search_tags` when you know the exact key

### 2. Validate Early and Often

```json
// Validate single tag as user types
{ "name": "validate_tag", "arguments": { "key": "...", "value": "..." } }

// Validate collection before saving
{ "name": "validate_tag_collection", "arguments": { "tags": { ... } } }
```

### 3. Use Suggestions to Improve Quality

```json
// After basic tagging
{ "name": "suggest_improvements", "arguments": { "tags": { ... } } }

// Apply suggestions
// Validate again
{ "name": "validate_tag_collection", "arguments": { "tags": { ... } } }
```

### 4. Check for Deprecation

Before using old data, validate tags (includes deprecation checking):
```json
{ "name": "validate_tag", "arguments": { "key": "...", "value": "..." } }
```

### 5. Limit Result Sizes

For large queries, use `limit` parameter:
```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "building",
    "limit": 50
  }
}
```

### 6. Combine Tools for Rich Experiences

```typescript
// Get tag info
const tagInfo = await client.callTool({
  name: "get_tag_info",
  arguments: { tagKey: "amenity" }
});

// For each value, get related tags
for (const value of tagInfo.values) {
  const related = await client.callTool({
    name: "get_related_tags",
    arguments: { tag: `amenity=${value}` }
  });
}
```

## Next Steps

- [API Documentation](./api/) - Detailed tool reference
- [Troubleshooting](./troubleshooting.md) - Common issues
- [Examples](../README.md#example-queries) - More examples

## Getting Help

- **Issues**: Report problems on [GitHub Issues](https://github.com/gander-tools/osm-tagging-schema-mcp/issues)
- **Questions**: Ask on [GitHub Discussions](https://github.com/gander-tools/osm-tagging-schema-mcp/discussions)
- **Documentation**: See [README.md](../README.md)
