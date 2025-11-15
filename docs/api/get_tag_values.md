# get_tag_values

Get all possible values for an OSM tag key with localized names and descriptions.

## Description

Retrieves all valid values for a given OSM tag key from the schema. Returns both a simple array of values and a detailed array with localized names and descriptions for each value.

**Phase 8.3 Updates:**
- Returns structured response with `key`, `keyName`, `values`, and `valuesDetailed`
- Each value includes localized `valueName` and description
- Removed standalone `description` field (not in spec)

## Category

Tag Query Tools

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tagKey` | string | Yes | The OSM tag key to query (e.g., "highway", "amenity") |

## Output

Returns a JSON object with the following structure (Phase 8.3 format):

```typescript
{
  key: string;                    // Tag key (e.g., "highway")
  keyName: string;                // Localized key name (e.g., "Highway")
  values: string[];               // Array of all valid values (sorted alphabetically)
  valuesDetailed: Array<{         // Detailed value information
    value: string;                // Value identifier (e.g., "motorway")
    valueName: string;            // Localized value name (e.g., "Motorway")
    description?: string;         // Value description (if available)
  }>;
}
```

### Output Fields

- **key**: The queried tag key (same as input)
- **keyName**: Human-readable, localized key name
- **values**: Simple array of value identifiers for quick lookups
- **valuesDetailed**: Detailed array with localized names and descriptions

## Examples

### Example 1: Highway Values

**Request:**
```json
{
  "name": "get_tag_values",
  "arguments": {
    "tagKey": "highway"
  }
}
```

**Response:**
```json
{
  "key": "highway",
  "keyName": "Highway",
  "values": [
    "motorway",
    "trunk",
    "primary",
    "secondary",
    "tertiary",
    "residential",
    "service",
    "..."
  ],
  "valuesDetailed": [
    {
      "value": "motorway",
      "valueName": "Motorway",
      "description": "A restricted access major divided highway, normally with 2 or more running lanes plus emergency hard shoulder"
    },
    {
      "value": "trunk",
      "valueName": "Trunk",
      "description": "The most important roads in a country's system that aren't motorways"
    },
    {
      "value": "primary",
      "valueName": "Primary",
      "description": "The next most important roads in a country's system"
    }
  ]
}
```

### Example 2: Parking Values

**Request:**
```json
{
  "name": "get_tag_values",
  "arguments": {
    "tagKey": "parking"
  }
}
```

**Response:**
```json
{
  "key": "parking",
  "keyName": "Parking",
  "values": [
    "surface",
    "multi-storey",
    "underground",
    "street_side",
    "lane",
    "carports",
    "garage_boxes",
    "sheds",
    "yes"
  ],
  "valuesDetailed": [
    {
      "value": "surface",
      "valueName": "Surface",
      "description": "Open surface parking lot"
    },
    {
      "value": "multi-storey",
      "valueName": "Multi-storey",
      "description": "Parking garage with multiple levels"
    },
    {
      "value": "underground",
      "valueName": "Underground",
      "description": "Underground parking garage"
    }
  ]
}
```

### Example 3: Amenity Values (Large List)

**Request:**
```json
{
  "name": "get_tag_values",
  "arguments": {
    "tagKey": "amenity"
  }
}
```

**Response (truncated):**
```json
{
  "key": "amenity",
  "keyName": "Amenity",
  "values": [
    "bar",
    "cafe",
    "fast_food",
    "restaurant",
    "hospital",
    "pharmacy",
    "bank",
    "atm",
    "parking",
    "..."
  ],
  "valuesDetailed": [
    {
      "value": "restaurant",
      "valueName": "Restaurant",
      "description": "A place selling full sit-down meals"
    },
    {
      "value": "fast_food",
      "valueName": "Fast Food",
      "description": "Restaurant serving fast food"
    }
  ]
}
```

### Example 4: Custom Field (Not in Schema)

**Request:**
```json
{
  "name": "get_tag_values",
  "arguments": {
    "tagKey": "custom_field"
  }
}
```

**Response:**
```json
{
  "key": "custom_field",
  "keyName": "Custom Field",
  "values": [],
  "valuesDetailed": []
}
```

## Error Scenarios

### Missing Required Parameter

**Request:**
```json
{
  "name": "get_tag_values",
  "arguments": {}
}
```

**Error:**
```
Error: Missing required parameter: tagKey
```

### Empty Tag Key

**Request:**
```json
{
  "name": "get_tag_values",
  "arguments": {
    "tagKey": ""
  }
}
```

**Response:**
```json
{
  "key": "",
  "keyName": "",
  "values": [],
  "valuesDetailed": []
}
```

## Use Cases

### 1. Building Tag Editor Dropdowns
Populate dropdown menus with available tag values:
```javascript
const result = await get_tag_values("highway");
const dropdown = result.valuesDetailed.map(v => ({
  value: v.value,
  label: v.valueName,
  tooltip: v.description
}));
```

### 2. Tag Autocomplete
Provide autocomplete suggestions for tag values:
```javascript
const result = await get_tag_values("amenity");
const suggestions = result.values.filter(v => v.startsWith(userInput));
```

### 3. Validation Rules
Check if a value is valid for a given key:
```javascript
const result = await get_tag_values("parking");
const isValid = result.values.includes(userValue);
```

### 4. Localized Display
Show human-readable tag information to users:
```javascript
const result = await get_tag_values("highway");
console.log(`${result.keyName} options:`);
result.valuesDetailed.forEach(v => {
  console.log(`  - ${v.valueName}: ${v.description}`);
});
```

### 5. Documentation Generation
Generate documentation for OSM tag keys:
```javascript
const result = await get_tag_values("building");
generateDocs({
  key: result.keyName,
  values: result.valuesDetailed
});
```

## Related Tools

- `search_tags` - Search for tags by keyword
- `validate_tag` - Validate a specific tag key-value pair
- `get_preset_details` - Get full preset details including fields

## Notes

- Returns empty arrays for tag keys not in the schema (custom tags)
- Values are sourced from field definitions in the schema
- Values are sorted alphabetically for consistent ordering
- Descriptions are optional and may not be available for all values
- Localized names use English translations with intelligent fallback formatting
- Field options are extracted from `field.options` array in the schema

## Data Source

- Field data: `@openstreetmap/id-tagging-schema/dist/fields.json`
- Translations: `@openstreetmap/id-tagging-schema/dist/translations/en.json`

## Version History

- **Phase 8.3** (Current): Structured response with localization (key, keyName, values, valuesDetailed)
- **v0.1.0**: Initial implementation with simple value array
