# Usage Guide

This guide provides practical examples of using the OSM Tagging Schema MCP Server tools.

## Table of Contents

- [Getting Started](#getting-started)
- [Common Use Cases](#common-use-cases)
- [Tool Categories](#tool-categories)
  - [Tag Query Tools](#tag-query-tools)
  - [Preset Discovery Tools](#preset-discovery-tools)
  - [Validation Tools](#validation-tools)
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

**Question:** "What values can I use for the parking tag?"

**Tool:** `get_tag_values`

```json
{
  "name": "get_tag_values",
  "arguments": {
    "tagKey": "parking"
  }
}
```

**Response:** All possible values for `parking` tag (surface, underground, multi-storey, etc.) with descriptions

---

### 2. Searching for Tags by Keyword

**Question:** "What tags are related to wheelchair accessibility?"

**Tool:** `search_tags`

```json
{
  "name": "search_tags",
  "arguments": {
    "query": "wheelchair"
  }
}
```

**Response:** All tags containing "wheelchair" (wheelchair, toilets:wheelchair, etc.)

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

#### `get_tag_values`

Get all valid values for a tag key with localized names.

**Example:**
```json
{
  "name": "get_tag_values",
  "arguments": {
    "tagKey": "highway"
  }
}
```

**Returns:** Object with key information and detailed value list:
```json
{
  "key": "highway",
  "keyName": "Highway",
  "values": ["motorway", "trunk", "primary", "secondary", "..."],
  "valuesDetailed": [
    {
      "value": "motorway",
      "valueName": "Motorway",
      "description": "A restricted access major divided highway..."
    },
    {
      "value": "trunk",
      "valueName": "Trunk",
      "description": "The most important roads in a country's system..."
    }
  ]
}
```

**Use case:** Building a tag editor dropdown with human-readable labels

---

#### `search_tags`

Search for tags by keyword with localized names. Returns separate lists for key matches and value matches.

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

**Returns:** Separate key and value matches with localized names:
```json
{
  "keyMatches": [
    {
      "key": "wheelchair",
      "keyName": "Wheelchair"
    },
    {
      "key": "toilets:wheelchair",
      "keyName": "Toilets Wheelchair"
    }
  ],
  "valueMatches": [
    {
      "key": "access",
      "keyName": "Access",
      "value": "wheelchair",
      "valueName": "Wheelchair"
    }
  ]
}
```

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

### Preset Discovery Tools

#### `search_presets`

Search for presets by name or tag with localized preset names.

**Example 1:** Search by keyword
```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "restaurant"
  }
}
```

**Returns:** Matching presets with localized names and tags:
```json
{
  "results": [
    {
      "id": "amenity/restaurant",
      "name": "Restaurant",
      "tags": { "amenity": "restaurant" },
      "tagsDetailed": [
        {
          "key": "amenity",
          "keyName": "Amenity",
          "value": "restaurant",
          "valueName": "Restaurant"
        }
      ],
      "geometry": ["point", "area"]
    }
  ]
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

**Returns (with localized names):**
```json
{
  "key": "amenity",
  "keyName": "Amenity",
  "value": "restaurant",
  "valueName": "Restaurant",
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

**Returns (with localized replacement details):**
```json
{
  "key": "amenity",
  "keyName": "Amenity",
  "value": "park_bench",
  "valueName": "Park Bench",
  "valid": true,
  "deprecated": true,
  "message": "Tag amenity=park_bench is deprecated. Consider using: Leisure=Picnic Table",
  "replacement": {
    "leisure": "picnic_table"
  },
  "replacementDetailed": [
    {
      "key": "leisure",
      "keyName": "Leisure",
      "value": "picnic_table",
      "valueName": "Picnic Table"
    }
  ]
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

Validate a complete set of tags with simplified aggregated statistics.

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

**Returns (simplified Phase 8.6 format):**
```json
{
  "validCount": 6,
  "deprecatedCount": 0,
  "errorCount": 0,
  "tagResults": {
    "amenity": {
      "key": "amenity",
      "keyName": "Amenity",
      "value": "restaurant",
      "valueName": "Restaurant",
      "valid": true,
      "deprecated": false,
      "message": "Tag amenity=restaurant is valid"
    },
    "name": {
      "key": "name",
      "keyName": "Name",
      "value": "Pizza Place",
      "valueName": "Pizza Place",
      "valid": true,
      "deprecated": false,
      "message": "Tag name=Pizza Place is valid"
    }
  }
}
```

**Use case:** Feature validation before saving (includes deprecation checking)

---

#### `suggest_improvements`

Get structured suggestions for improving a tag collection with localized names.

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

**Returns (structured Phase 8.7 format):**
```json
{
  "suggestions": [
    {
      "operation": "add_missing_field",
      "message": "Consider adding 'cuisine' tag (common for Restaurant preset)",
      "key": "cuisine",
      "keyName": "Cuisine"
    },
    {
      "operation": "add_missing_field",
      "message": "Consider adding 'phone' tag (common for Restaurant preset)",
      "key": "phone",
      "keyName": "Phone"
    },
    {
      "operation": "add_missing_field",
      "message": "Consider adding 'opening_hours' tag (common for Restaurant preset)",
      "key": "opening_hours",
      "keyName": "Opening Hours"
    }
  ],
  "matchedPresets": ["amenity/restaurant"],
  "matchedPresetsDetailed": [
    {
      "id": "amenity/restaurant",
      "name": "Restaurant"
    }
  ]
}
```

**Use case:** Quality improvement for OSM features with structured, actionable suggestions

## Workflow Examples

### Workflow 1: Adding a New Restaurant

**Step 1:** Search for restaurant presets
```json
{
  "name": "search_presets",
  "arguments": { "keyword": "restaurant" }
}
```

**Step 2:** Get preset details (includes tags and fields)
```json
{
  "name": "get_preset_details",
  "arguments": { "presetId": "amenity/restaurant" }
}
```

**Step 3:** Create initial tags
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
  "arguments": { "tags": "{...}" }
}
```

**Step 6:** Validate final tags
```json
{
  "name": "validate_tag_collection",
  "arguments": { "tags": "{...}" }
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

**Step 1:** Search for presets by category/keyword
```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "amenity",
    "limit": 50
  }
}
```

**Step 2:** Get tag values for dropdowns
```json
{
  "name": "get_tag_values",
  "arguments": { "tagKey": "amenity" }
}
```

**Step 3:** Validate user input (real-time)
```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "amenity",
    "value": "restaurant"
  }
}
```

**Step 4:** Get preset details for selected feature
```json
{
  "name": "get_preset_details",
  "arguments": { "presetId": "amenity/restaurant" }
}
```

## Deployment Options

For production deployments with HTTP transport, Docker containers, monitoring, and health checks, see the **[Deployment Guide](../deployment/deployment.md)**

## Best Practices

### 1. Use Specific Tools

Choose the most specific tool for your task:
- ✅ `get_tag_values` for dropdown lists
- ❌ `search_tags` when you know the exact key

### 2. Validate Early and Often

```json
{
  "name": "validate_tag",
  "arguments": { "key": "...", "value": "..." }
}
```

```json
{
  "name": "validate_tag_collection",
  "arguments": { "tags": "{...}" }
}
```

### 3. Use Suggestions to Improve Quality

```json
{
  "name": "suggest_improvements",
  "arguments": { "tags": "{...}" }
}
```

```json
{
  "name": "validate_tag_collection",
  "arguments": { "tags": "{...}" }
}
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
// Search for tags by keyword
const tagResults = await client.callTool({
  name: "search_tags",
  arguments: { query: "wheelchair" }
});

// For each tag, get all possible values
for (const tag of tagResults) {
  const values = await client.callTool({
    name: "get_tag_values",
    arguments: { tagKey: tag.key }
  });
}

// Search for matching presets
const presets = await client.callTool({
  name: "search_presets",
  arguments: { keyword: "restaurant" }
});

// Get details for each preset
for (const preset of presets) {
  const details = await client.callTool({
    name: "get_preset_details",
    arguments: { presetId: preset.id }
  });
}
```

## Next Steps

- [API Documentation](../api/README.md) - Detailed tool reference
- [Troubleshooting](./troubleshooting.md) - Common issues
- [Main Documentation](../../README.md) - Project overview

## Getting Help

- **Issues**: Report problems on [GitHub Issues](https://github.com/gander-tools/osm-tagging-schema-mcp/issues)
- **Questions**: Ask on [GitHub Discussions](https://github.com/gander-tools/osm-tagging-schema-mcp/discussions)
- **Documentation**: See [README.md](../../README.md)
