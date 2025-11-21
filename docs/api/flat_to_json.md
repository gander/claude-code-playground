# flat_to_json

Convert OSM tags from flat text format (key=value per line) to JSON object.

## Description

Converts OSM tags from flat text format to JSON representation. The flat text format uses one tag per line in `key=value` format, which is commonly used for:
- Manual tag entry
- Text-based tag files
- Command-line interfaces
- Human-readable tag lists

The tool supports various line endings, comments, and handles special characters properly.

## Category

Conversion Tools

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tags` | string | Yes | Tags in flat text format with key=value per line. Supports comments (#), empty lines, Unix (LF), Windows (CRLF), and Mac (CR) line endings. |

## Output

Returns a JSON object with tags:

```json
{
  "key1": "value1",
  "key2": "value2",
  "key3": "value3"
}
```

**Output Rules:**
- All keys and values are trimmed (whitespace removed)
- Comments (lines starting with `#`) are ignored
- Empty lines are skipped
- Duplicate keys: last value wins
- Empty values are allowed
- Values may contain equals signs (only first `=` is the separator)

## Examples

### Example 1: Basic Conversion

**Request:**
```json
{
  "name": "flat_to_json",
  "arguments": {
    "tags": "amenity=restaurant\nname=Test Restaurant"
  }
}
```

**Response:**
```json
{
  "amenity": "restaurant",
  "name": "Test Restaurant"
}
```

### Example 2: With Comments and Empty Lines

**Request:**
```json
{
  "name": "flat_to_json",
  "arguments": {
    "tags": "# This is a restaurant\namenity=restaurant\n\n# Contact info\ncontact:phone=+1234567890"
  }
}
```

**Response:**
```json
{
  "amenity": "restaurant",
  "contact:phone": "+1234567890"
}
```

### Example 3: Multi-line Real-World Example

**Request:**
```json
{
  "name": "flat_to_json",
  "arguments": {
    "tags": "amenity=restaurant\nname=Pizza House\ncuisine=pizza\nopening_hours=Mo-Su 10:00-22:00\nwheelchair=yes"
  }
}
```

**Response:**
```json
{
  "amenity": "restaurant",
  "name": "Pizza House",
  "cuisine": "pizza",
  "opening_hours": "Mo-Su 10:00-22:00",
  "wheelchair": "yes"
}
```

### Example 4: Building with Address Tags

**Request:**
```json
{
  "name": "flat_to_json",
  "arguments": {
    "tags": "building=residential\naddr:housenumber=123\naddr:street=Main Street\naddr:city=Springfield\naddr:postcode=12345"
  }
}
```

**Response:**
```json
{
  "building": "residential",
  "addr:housenumber": "123",
  "addr:street": "Main Street",
  "addr:city": "Springfield",
  "addr:postcode": "12345"
}
```

### Example 5: Special Characters

**Request:**
```json
{
  "name": "flat_to_json",
  "arguments": {
    "tags": "name=Café René\nwebsite=https://example.com/test?id=123\nnote=height=5m"
  }
}
```

**Response:**
```json
{
  "name": "Café René",
  "website": "https://example.com/test?id=123",
  "note": "height=5m"
}
```

### Example 6: Windows Line Endings

**Request:**
```json
{
  "name": "flat_to_json",
  "arguments": {
    "tags": "highway=primary\r\nname=Main Street"
  }
}
```

**Response:**
```json
{
  "highway": "primary",
  "name": "Main Street"
}
```

### Example 7: Empty Input

**Request:**
```json
{
  "name": "flat_to_json",
  "arguments": {
    "tags": ""
  }
}
```

**Response:**
```json
{}
```

## Error Scenarios

### Missing Equals Sign

**Request:**
```json
{
  "name": "flat_to_json",
  "arguments": {
    "tags": "amenity=restaurant\ninvalid line without equals"
  }
}
```

**Response:**
```json
{
  "error": "Invalid tag format at line 2: missing '=' separator. Expected format: key=value"
}
```

### Empty Key

**Request:**
```json
{
  "name": "flat_to_json",
  "arguments": {
    "tags": "=value"
  }
}
```

**Response:**
```json
{
  "error": "Invalid tag format at line 1: empty key before '='"
}
```

### Whitespace-Only Key

**Request:**
```json
{
  "name": "flat_to_json",
  "arguments": {
    "tags": "   =value"
  }
}
```

**Response:**
```json
{
  "error": "Invalid tag format at line 1: empty key before '='"
}
```

## Use Cases

1. **Import from text files**: Parse tags from text-based configuration files
2. **Command-line input**: Accept tags from command-line arguments or stdin
3. **Manual tag entry**: Allow users to input tags in simple text format
4. **Data migration**: Convert between flat text and JSON formats during data migration
5. **Configuration parsing**: Parse tag lists from configuration files

## Input Format Details

### Supported Line Endings
- Unix (LF): `\n`
- Windows (CRLF): `\r\n`
- Mac (CR): `\r`
- Mixed line endings are supported

### Comment Syntax
Lines starting with `#` are treated as comments and ignored:
```
# This is a comment
amenity=restaurant  # This is NOT a comment (# must be at start of line)
```

### Whitespace Handling
- Leading and trailing whitespace is trimmed from keys and values
- Empty lines are skipped
- Whitespace around `=` is trimmed

### Duplicate Keys
If the same key appears multiple times, the last value wins:
```
name=First
name=Second
name=Third
```
Results in: `{"name": "Third"}`

### Special Values
- Empty values are allowed: `fixme=` → `{"fixme": ""}`
- Values with equals signs: `note=height=5m` → `{"note": "height=5m"}`
- Only the first `=` is used as separator

## Related Tools

- **json_to_flat**: Convert JSON back to flat text format
- **validate_tag_collection**: Validate parsed tags
- **suggest_improvements**: Get suggestions for parsed tags

## Notes

- The tool uses the existing `parseTagInput` utility from the tag-parser module
- All keys and values are strings in the output
- Unicode characters are fully supported
- The tool is format-agnostic and doesn't validate against OSM schema
- Duplicate keys are handled by keeping the last occurrence

## Data Source

This tool does not use the OSM tagging schema; it performs pure format parsing. Any text following the `key=value` format can be parsed.

## Version History

- **v1.1.0** (2025-01-21): Initial implementation
