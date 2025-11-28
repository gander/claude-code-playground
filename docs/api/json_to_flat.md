# json_to_flat

**OUTPUT CONVERTER** - Convert JSON results to user-friendly flat text format.

## Description

**Use this tool LAST** when the user expects OSM tags in flat text format (key=value per line). This tool converts JSON objects (returned by other tools like `validate_tag`, `search_tags`, `suggest_improvements`, etc.) to flat format for user-friendly output.

**Workflow:**
1. User provides tags (any format)
2. Process with other tools that work with JSON (validate_tag, etc.)
3. User wants flat output → Use `json_to_flat` to convert result

All other OSM tools work with JSON internally and return JSON output. This tool converts their JSON output to human-readable flat format when the user prefers that format.

The flat text format represents each tag as `key=value` on a separate line, which is commonly used for:
- Manual tag editing
- Text-based tag storage
- Command-line tools
- Human-readable tag lists

The tool accepts both JSON strings and JavaScript objects as input, providing flexibility for different use cases.

## Category

Conversion Tools (Output Converter)

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tags` | string \| object | Yes | Tags in JSON format. Can be a JSON string (e.g., `'{"amenity":"restaurant"}'`) or a JSON object. All values must be strings. |

## Output

Returns flat text format where each tag is on a separate line:

```
key1=value1
key2=value2
key3=value3
```

**Format Rules:**
- One tag per line
- Format: `key=value`
- No quotes around keys or values
- Empty lines for empty objects
- Empty values are NOT allowed (will throw error)
- Values may contain equals signs (only first `=` is the separator)

## Examples

### Example 1: Convert JSON Object

**Request:**
```json
{
  "name": "json_to_flat",
  "arguments": {
    "tags": {
      "amenity": "restaurant",
      "name": "Pizza House",
      "cuisine": "pizza"
    }
  }
}
```

**Response:**
```
amenity=restaurant
name=Pizza House
cuisine=pizza
```

### Example 2: Convert JSON String

**Request:**
```json
{
  "name": "json_to_flat",
  "arguments": {
    "tags": "{\"highway\":\"primary\",\"name\":\"Main Street\"}"
  }
}
```

**Response:**
```
highway=primary
name=Main Street
```

### Example 3: Tags with Special Characters

**Request:**
```json
{
  "name": "json_to_flat",
  "arguments": {
    "tags": {
      "addr:street": "Main Street",
      "contact:phone": "+1234567890",
      "website": "https://example.com/test?id=123"
    }
  }
}
```

**Response:**
```
addr:street=Main Street
contact:phone=+1234567890
website=https://example.com/test?id=123
```

### Example 4: Empty Object

**Request:**
```json
{
  "name": "json_to_flat",
  "arguments": {
    "tags": {}
  }
}
```

**Response:**
```
(empty string)
```

### Example 5: Building with Address Tags

**Request:**
```json
{
  "name": "json_to_flat",
  "arguments": {
    "tags": {
      "building": "residential",
      "addr:housenumber": "123",
      "addr:street": "Main Street",
      "addr:city": "Springfield",
      "addr:postcode": "12345"
    }
  }
}
```

**Response:**
```
building=residential
addr:housenumber=123
addr:street=Main Street
addr:city=Springfield
addr:postcode=12345
```

## Error Scenarios

### Invalid JSON String

**Request:**
```json
{
  "name": "json_to_flat",
  "arguments": {
    "tags": "{invalid json}"
  }
}
```

**Response:**
```json
{
  "error": "Invalid JSON format: Unexpected token 'i', \"{invalid json}\" is not valid JSON"
}
```

### JSON Array (Not Allowed)

**Request:**
```json
{
  "name": "json_to_flat",
  "arguments": {
    "tags": "[\"amenity\", \"restaurant\"]"
  }
}
```

**Response:**
```json
{
  "error": "JSON input must be an object, not an array or primitive"
}
```

### Non-String Values

**Request:**
```json
{
  "name": "json_to_flat",
  "arguments": {
    "tags": {
      "amenity": "restaurant",
      "maxspeed": 50
    }
  }
}
```

**Response:**
```json
{
  "error": "All values must be strings. Found number for key \"maxspeed\""
}
```

## Use Cases

1. **Export for manual editing**: Convert tags to text format for manual editing in text editors
2. **Command-line tools**: Provide tags in simple text format for shell scripts
3. **Text-based storage**: Store tags in configuration files or text-based databases
4. **Human-readable display**: Show tags in a simple, readable format
5. **Data migration**: Convert between JSON and flat text formats during data migration

## Related Tools

- **flat_to_json**: Convert flat text format back to JSON
- **validate_tag_collection**: Validate tag collections before conversion
- **search_tags**: Search for tags to use in conversions

## Notes

- All tag values must be strings; numeric or boolean values will cause an error
- The tool preserves whitespace in values (after trimming)
- Keys with colons (e.g., `addr:street`) are fully supported
- Special characters in values (e.g., `=`, `&`, `?`) are preserved as-is
- Empty objects result in empty output (no lines)
- Tag order in output matches the object's property order

## Data Source

This tool does not use the OSM tagging schema; it performs pure format conversion. Any valid JSON object with string values can be converted.

## Version History

- **v1.1.0** (2025-01-21): Initial implementation
