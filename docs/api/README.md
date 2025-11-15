# API Documentation

Complete reference for all 7 MCP tools provided by the OSM Tagging Schema MCP Server.

## Overview

The server provides tools organized into three categories:

| Category | Tools | Description |
|----------|-------|-------------|
| **Tag Query** | 2 tools | Query tag information and values |
| **Preset Discovery** | 2 tools | Search and explore OSM presets |
| **Validation** | 3 tools | Validate tags and get improvements |

## Quick Reference

### Tag Query Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| [`get_tag_values`](./get_tag_values.md) | Get all possible values for a tag key | `tagKey` (string) | Array of valid values |
| [`search_tags`](./search_tags.md) | Search for tags by keyword | `keyword` (string), `limit` (optional) | Matching tags from fields and presets |

### Preset Discovery Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| [`search_presets`](./search_presets.md) | Search for presets by keyword or tag | `keyword` (string), `limit` (optional), `geometry` (optional) | Matching presets |
| [`get_preset_details`](./get_preset_details.md) | Get complete preset information | `presetId` (string) | Full preset configuration |

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

## Version Information

- **MCP Server Version**: 0.1.0
- **Schema Library**: @openstreetmap/id-tagging-schema ^6.7.3
- **MCP SDK**: @modelcontextprotocol/sdk ^1.0.4

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
  "name": "get_tag_info",
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

- [Usage Guide](../usage.md) - Practical usage examples
- [Installation Guide](../installation.md) - Setup instructions
- [Configuration Guide](../configuration.md) - Configuration options
- [Troubleshooting](../troubleshooting.md) - Common issues

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/gander-tools/osm-tagging-schema-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/gander-tools/osm-tagging-schema-mcp/discussions)
- **Documentation**: [Main README](../../README.md)
