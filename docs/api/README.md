# API Documentation

Complete reference for all MCP tools provided by the OSM Tagging Schema MCP Server.

## Table of Contents

- [Overview](#overview)
- [Quick Reference](#quick-reference)
  - [Tag Query Tools](#tag-query-tools)
  - [Preset Discovery Tools](#preset-discovery-tools)
  - [Validation Tools](#validation-tools)
- [Common Patterns](#common-patterns)
  - [Input Format](#input-format)
  - [Output Format](#output-format)
  - [Error Handling](#error-handling)
- [Localization](#localization)
- [Examples](#examples)
- [See Also](#see-also)

## Overview

The server provides 7 tools organized into three categories:

| Category | Tools | Description |
|----------|-------|-------------|
| **Tag Query** | 2 tools | Query tag values and search tags |
| **Preset Discovery** | 2 tools | Search and explore OSM presets |
| **Validation** | 3 tools | Validate tags and suggest improvements |

## Quick Reference

### Tag Query Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| [`get_tag_values`](./get_tag_values.md) | Get all possible values for a tag key with localized names | `tagKey` (string) | Object with key, keyName, values array, and valuesDetailed array |
| [`search_tags`](./search_tags.md) | Search for tags by keyword | `keyword` (string), `limit` (optional) | Matching tags from fields and presets |

### Preset Discovery Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| [`search_presets`](./search_presets.md) | Search for presets by keyword or tag | `keyword` (string), `limit` (optional), `geometry` (optional) | Matching presets with localized names |
| [`get_preset_details`](./get_preset_details.md) | Get complete preset information | `presetId` (string) | Full preset configuration with localized names |

### Validation Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| [`validate_tag`](./validate_tag.md) | Validate a single tag key-value pair (includes deprecation checking) | `key` (string), `value` (string) | Validation result with message and replacement |
| [`validate_tag_collection`](./validate_tag_collection.md) | Validate a collection of tags | `tags` (object/string) | Validation report with statistics |
| [`suggest_improvements`](./suggest_improvements.md) | Suggest improvements for tag collection | `tags` (object/string) | Suggestions, warnings, matched presets |

**Note:** `validate_tag_collection` and `suggest_improvements` accept tags in multiple formats:
- **Object**: `{"amenity": "restaurant", "cuisine": "pizza"}`
- **Text** (key=value lines): `"amenity=restaurant\ncuisine=pizza"`
- **JSON string**: `'{"amenity": "restaurant"}'`

## Common Patterns

### Input Format

All tools accept JSON-formatted arguments:

```json
{
  "name": "tool_name",
  "arguments": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

### Output Format

All tools return JSON responses:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{...tool result as JSON string...}"
    }
  ]
}
```

### Error Handling

Errors are returned in standard MCP error format:

```json
{
  "error": {
    "code": -32603,
    "message": "Error description"
  }
}
```

Common error codes:
- `-32700`: Parse error (invalid JSON)
- `-32602`: Invalid params (missing required parameter)
- `-32603`: Internal error (server error)

## Data Sources

All tools use data from `@openstreetmap/id-tagging-schema` library:

- **presets.json**: OSM feature presets (1707 presets)
- **fields.json**: Tag field definitions (799 fields)
- **deprecated.json**: Deprecated tag mappings (245 entries)
- **preset_categories.json**: Preset categories (15 categories)
- **translations/en.json**: English translations for human-readable names (1707 presets, 799 fields)

## Localization

All tools provide **human-readable, localized names** for tags, values, and presets in addition to their technical identifiers.

### What is Localized?

The server translates technical OSM identifiers into human-readable names using English translations from the schema:

| Type | Technical ID | Localized Name | Tools Providing This |
|------|-------------|----------------|---------------------|
| **Tag Keys** | `amenity` | "Amenity" | All tools with `keyName` field |
| **Tag Values** | `restaurant` | "Restaurant" | All tools with `valueName` field |
| **Presets** | `amenity/restaurant` | "Restaurant" | `get_preset_details`, `search_presets`, `suggest_improvements` |
| **Field Options** | `fast_food` | "Fast Food" | `get_tag_values`, `search_tags` |

### Tools with Localization Support

All 7 tools include localized names in their responses:

**Tag Query Tools:**
- ✅ `get_tag_values` - Returns `keyName` and `valuesDetailed[].valueName`
- ✅ `search_tags` - Returns `keyName` and `valueName` in both key and value matches

**Preset Discovery Tools:**
- ✅ `search_presets` - Returns `name` (preset name) and `tagsDetailed[].keyName`/`valueName`
- ✅ `get_preset_details` - Returns `name` and `tagsDetailed[].keyName`/`valueName`

**Validation Tools:**
- ✅ `validate_tag` - Returns `keyName`, `valueName`, and `replacementDetailed[].keyName`/`valueName`
- ✅ `validate_tag_collection` - Uses localized `validate_tag` for each tag
- ✅ `suggest_improvements` - Returns `suggestions[].keyName` and `matchedPresetsDetailed[].name`

### Fallback Logic

When a translation is not available in the schema, the server uses intelligent fallback formatting:

1. **Replace underscores with spaces**: `fast_food` → `fast food`
2. **Capitalize first letter**: `fast food` → `Fast food`

**Examples:**

| Original Value | Translation Available? | Result |
|----------------|----------------------|--------|
| `restaurant` | ✅ Yes | "Restaurant" (from translations) |
| `fast_food` | ✅ Yes | "Fast Food" (from translations) |
| `my_custom_tag` | ❌ No | "My custom tag" (fallback) |

### Example: Localized vs Non-Localized Output

**Without Localization** (hypothetical):
```json
{
  "key": "amenity",
  "value": "fast_food"
}
```

**With Localization** (actual output from `validate_tag`):
```json
{
  "key": "amenity",
  "keyName": "Amenity",
  "value": "fast_food",
  "valueName": "Fast Food",
  "valid": true,
  "deprecated": false,
  "message": "Tag amenity=fast_food is valid"
}
```

### Backward Compatibility

All tools maintain backward compatibility by providing **both** technical identifiers and localized names:

- **Technical fields**: `key`, `value`, `tags` - Unchanged, machine-readable
- **Localized fields**: `keyName`, `valueName`, `tagsDetailed`, `name` - New, human-readable

This allows both automated processing (using technical fields) and human-friendly display (using localized fields).

## Version Information

- **MCP Server Version**: 0.2.1
- **Schema Library**: @openstreetmap/id-tagging-schema ^6.7.3
- **MCP SDK**: @modelcontextprotocol/sdk ^1.21.1

## Tool Details

Click on any tool name above for detailed documentation including:
- Full parameter descriptions
- Return value schemas
- Complete examples
- Error scenarios
- Use cases

## Examples

### Basic Query
```json
{
  "name": "get_tag_values",
  "arguments": {
    "tagKey": "amenity"
  }
}
```

### Complex Validation
```json
{
  "name": "validate_tag_collection",
  "arguments": {
    "tags": {
      "amenity": "restaurant",
      "name": "Pizza Place",
      "cuisine": "pizza"
    }
  }
}
```

### Preset Search with Filters
```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "building",
    "geometry": "area",
    "limit": 20
  }
}
```

## See Also

- [Usage Guide](../user/usage.md) - Practical usage examples
- [Installation Guide](../user/installation.md) - Setup instructions
- [Configuration Guide](../user/configuration.md) - Configuration options
- [Troubleshooting](../user/troubleshooting.md) - Common issues

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/gander-tools/osm-tagging-schema-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/gander-tools/osm-tagging-schema-mcp/discussions)
- **Documentation**: [Main README](../../README.md)
