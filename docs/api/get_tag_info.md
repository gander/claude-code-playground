# get_tag_info

Get comprehensive information about a specific OSM tag key.

## Description

Returns all possible values for a tag key, along with type information and field definition status. Useful for understanding what values are valid for a given tag key and discovering related tag options.

## Category

Tag Query Tools

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tagKey` | string | Yes | The tag key to query (e.g., "amenity", "building", "highway") |

### Parameter Details

**tagKey**:
- Can be a simple key: `"amenity"`, `"building"`
- Can be a complex key with colons: `"toilets:wheelchair"`, `"parking:lane"`
- Case-sensitive
- Must exist in the schema (check with `search_tags` if unsure)

## Output

Returns a JSON object with the following structure:

```typescript
{
  key: string;              // The tag key (same as input)
  values: string[];         // Array of possible values
  type: string | null;      // Field type (combo, text, number, etc.)
  hasFieldDefinition: boolean;  // Whether field is defined in schema
}
```

### Output Fields

- **key**: The tag key that was queried
- **values**: All possible values for this key, sorted alphabetically
- **type**: The field type if defined (combo, typeCombo, text, number, etc.)
- **hasFieldDefinition**: `true` if the key has a field definition in the schema

## Examples

### Example 1: Basic Tag Query

**Request:**
```json
{
  "name": "get_tag_info",
  "arguments": {
    "tagKey": "amenity"
  }
}
```

**Response:**
```json
{
  "key": "amenity",
  "values": [
    "bar",
    "cafe",
    "fast_food",
    "pub",
    "restaurant",
    ...
  ],
  "type": "typeCombo",
  "hasFieldDefinition": true
}
```

### Example 2: Building Types

**Request:**
```json
{
  "name": "get_tag_info",
  "arguments": {
    "tagKey": "building"
  }
}
```

**Response:**
```json
{
  "key": "building",
  "values": [
    "yes",
    "apartments",
    "commercial",
    "house",
    "industrial",
    "retail",
    "residential",
    ...
  ],
  "type": "typeCombo",
  "hasFieldDefinition": true
}
```

### Example 3: Complex Key with Colons

**Request:**
```json
{
  "name": "get_tag_info",
  "arguments": {
    "tagKey": "toilets:wheelchair"
  }
}
```

**Response:**
```json
{
  "key": "toilets:wheelchair",
  "values": [
    "yes",
    "no"
  ],
  "type": "radio",
  "hasFieldDefinition": true
}
```

### Example 4: Key Without Field Definition

**Request:**
```json
{
  "name": "get_tag_info",
  "arguments": {
    "tagKey": "custom_tag"
  }
}
```

**Response:**
```json
{
  "key": "custom_tag",
  "values": [],
  "type": null,
  "hasFieldDefinition": false
}
```

## Error Scenarios

### Missing tagKey Parameter

**Request:**
```json
{
  "name": "get_tag_info",
  "arguments": {}
}
```

**Error:**
```json
{
  "error": {
    "code": -32602,
    "message": "tagKey parameter is required"
  }
}
```

### Empty tagKey

**Request:**
```json
{
  "name": "get_tag_info",
  "arguments": {
    "tagKey": ""
  }
}
```

**Response:** (No error, but empty results)
```json
{
  "key": "",
  "values": [],
  "type": null,
  "hasFieldDefinition": false
}
```

## Use Cases

1. **Tag Editor Dropdowns**: Populate dropdown lists with valid values for a tag key
2. **Tag Validation**: Check if a value is valid for a given key
3. **Schema Exploration**: Discover what values are available for a tag
4. **Documentation**: Generate documentation for OSM tags
5. **Auto-completion**: Provide suggestions while typing tag values

## Related Tools

- [`get_tag_values`](./get_tag_values.md): Get only the values (simpler output)
- [`search_tags`](./search_tags.md): Search for tags by keyword
- [`validate_tag`](./validate_tag.md): Validate a key-value pair
- [`get_related_tags`](./get_related_tags.md): Find tags commonly used with this tag

## Notes

- The tool searches both `fields.json` and `presets.json` for comprehensive coverage
- Values are deduplicated and sorted alphabetically
- For keys with colons (e.g., `parking:lane`), the input must use colons (not slashes)
- The schema is cached for performance (1-hour TTL by default)

## Data Source

- **fields.json**: Field definitions with value options
- **presets.json**: Preset tags and values

## Version History

- **0.1.0**: Initial release
