# validate_tag

Validate a single OSM tag key-value pair with localized names.

## Description

Validates whether a tag key-value pair is valid according to the OSM tagging schema. Checks for:
- Tag key existence in schema
- Value validity for the given key
- Deprecated tag status with replacement suggestions
- Field option compliance

**Phase 8.2 Updates:**
- Returns localized `keyName` and `valueName` for human-readable display
- Returns `replacementDetailed` array with localized replacement tag names
- Removed redundant `fieldExists` and `availableOptions` fields

## Category

Validation Tools

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes | The OSM tag key to validate (e.g., "amenity") |
| `value` | string | Yes | The tag value to validate (e.g., "restaurant") |

## Output

Returns a JSON object with the following structure (Phase 8.2 format):

```typescript
{
  key: string;                    // Tag key (e.g., "amenity")
  keyName: string;                // Localized key name (e.g., "Amenity")
  value: string;                  // Tag value (e.g., "restaurant")
  valueName: string;              // Localized value name (e.g., "Restaurant")
  valid: boolean;                 // Whether tag is valid
  deprecated: boolean;            // Whether tag is deprecated
  message: string;                // Human-readable validation message
  replacement?: object;           // Replacement tags if deprecated (backward compatibility)
  replacementDetailed?: Array<{   // Replacement tags with localized names (Phase 8.2)
    key: string;                  // Replacement key
    keyName: string;              // Localized replacement key name
    value: string;                // Replacement value
    valueName: string;            // Localized replacement value name
  }>;
}
```

### Validation Logic

1. **Key not in schema**: Returns `valid: true` with informative message (custom tags allowed in OSM)
2. **Key exists, no field definition**: Returns `valid: true` (field-less keys allowed)
3. **Field has options, value not in options**: Returns `valid: false` with error message
4. **Empty value**: Returns `valid: false` with error message
5. **Deprecated tag**: Returns `valid: true`, `deprecated: true` with replacement suggestions

## Examples

### Example 1: Valid Tag

**Request:**
```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "amenity",
    "value": "restaurant"
  }
}
```

**Response:**
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

### Example 2: Deprecated Tag with Replacement

**Request:**
```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "amenity",
    "value": "park_bench"
  }
}
```

**Response:**
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

### Example 3: Invalid Value (Not in Field Options)

**Request:**
```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "parking",
    "value": "invalid_option"
  }
}
```

**Response:**
```json
{
  "key": "parking",
  "keyName": "Parking",
  "value": "invalid_option",
  "valueName": "Invalid Option",
  "valid": false,
  "deprecated": false,
  "message": "Value 'invalid_option' is not a valid option for field 'parking'. Valid options: surface, underground, multi-storey, ..."
}
```

### Example 4: Custom Tag (Not in Schema)

**Request:**
```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "my_custom_tag",
    "value": "custom_value"
  }
}
```

**Response:**
```json
{
  "key": "my_custom_tag",
  "keyName": "My Custom Tag",
  "value": "custom_value",
  "valueName": "Custom Value",
  "valid": true,
  "deprecated": false,
  "message": "Tag key 'my_custom_tag' not found in schema (custom tags are allowed in OpenStreetMap)"
}
```

### Example 5: Empty Value

**Request:**
```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "amenity",
    "value": ""
  }
}
```

**Response:**
```json
{
  "key": "amenity",
  "keyName": "Amenity",
  "value": "",
  "valueName": "",
  "valid": false,
  "deprecated": false,
  "message": "Tag value cannot be empty"
}
```

## Error Scenarios

### Missing Required Parameters

**Request:**
```json
{
  "name": "validate_tag",
  "arguments": {
    "key": "amenity"
  }
}
```

**Error:**
```
Error: Missing required parameter: value
```

## Use Cases

### 1. Real-Time Tag Validation
Validate user input as they type in a tag editor:
```javascript
const result = await validate_tag("amenity", "restaurant");
if (!result.valid) {
  showError(result.message);
} else if (result.deprecated) {
  showWarning(result.message, result.replacementDetailed);
}
```

### 2. Data Quality Checks
Check imported OSM data for deprecated tags:
```javascript
const tags = { amenity: "park_bench", name: "My Bench" };
for (const [key, value] of Object.entries(tags)) {
  const result = await validate_tag(key, value);
  if (result.deprecated) {
    console.log(`Deprecated: ${key}=${value}`);
    console.log(`Replacement: ${JSON.stringify(result.replacement)}`);
  }
}
```

### 3. Typo Detection
Detect typos in tag values using field option validation:
```javascript
const result = await validate_tag("highway", "residental");  // typo!
if (!result.valid) {
  console.log("Did you mean 'residential'?");
}
```

### 4. Localized UI Display
Display validation results with human-readable names:
```javascript
const result = await validate_tag("amenity", "fast_food");
console.log(`${result.keyName}: ${result.valueName}`);  // "Amenity: Fast Food"
```

## Related Tools

- `validate_tag_collection` - Validate multiple tags at once
- `get_tag_values` - Get all valid values for a tag key
- `suggest_improvements` - Get improvement suggestions for tag collections

## Notes

- Custom tags (not in schema) are considered valid in OpenStreetMap
- Deprecated tags are marked as valid but include deprecation warning and replacement suggestions
- Empty values are always invalid
- Field option validation only applies if the field definition has an `options` array
- Localized names use English translations from the schema with fallback formatting

## Data Source

- Field data: `@openstreetmap/id-tagging-schema/dist/fields.json`
- Preset data: `@openstreetmap/id-tagging-schema/dist/presets.json`
- Deprecated tags: `@openstreetmap/id-tagging-schema/dist/deprecated.json`
- Translations: `@openstreetmap/id-tagging-schema/dist/translations/en.json`

## Version History

- **Phase 8.2** (Current): Added localization (keyName, valueName, replacementDetailed), removed redundant fields
- **v0.1.0**: Initial implementation with basic validation
