# validate_tag_collection

Validate a collection of OSM tags with aggregated statistics.

## Description

Validates a complete set of tags as a collection. Returns individual validation results for each tag (using localized `validate_tag`) plus aggregated statistics.

**Phase 8.6 Updates:**
- Simplified response with `validCount`, `deprecatedCount`, `errorCount`
- Uses localized `validate_tag` for each tag in collection
- Removed redundant `errors` and `warnings` arrays
- Accepts multiple input formats (object, text, JSON string)

## Category

Validation Tools

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tags` | object \| string | Yes | Tags to validate in one of three formats |

### Input Formats

The `tags` parameter accepts three different formats:

**Format 1: Object (Recommended)**
```json
{
  "amenity": "restaurant",
  "name": "Pizza Place",
  "cuisine": "pizza"
}
```

**Format 2: Text (key=value lines)**
```
amenity=restaurant
name=Pizza Place
cuisine=pizza
# Comments are allowed
```

**Format 3: JSON String**
```json
"{\"amenity\": \"restaurant\", \"name\": \"Pizza Place\"}"
```

## Output

Returns a JSON object with the following structure (Phase 8.6 format):

```typescript
{
  validCount: number;              // Number of valid tags
  deprecatedCount: number;         // Number of deprecated tags
  errorCount: number;              // Number of invalid tags
  tagResults: {                    // Individual validation results per tag
    [key: string]: {               // Tag key
      key: string;                 // Tag key (same as object key)
      keyName: string;             // Localized key name
      value: string;               // Tag value
      valueName: string;           // Localized value name
      valid: boolean;              // Whether tag is valid
      deprecated: boolean;         // Whether tag is deprecated
      message: string;             // Validation message
      replacement?: object;        // Replacement tags (if deprecated)
      replacementDetailed?: Array<{  // Localized replacements (if deprecated)
        key: string;
        keyName: string;
        value: string;
        valueName: string;
      }>;
    };
  };
}
```

### Output Fields

- **validCount**: Number of tags that passed validation (includes deprecated tags)
- **deprecatedCount**: Number of tags marked as deprecated
- **errorCount**: Number of tags that failed validation
- **tagResults**: Individual `validate_tag` result for each tag key

## Examples

### Example 1: Valid Tag Collection

**Request:**
```json
{
  "name": "validate_tag_collection",
  "arguments": {
    "tags": {
      "amenity": "restaurant",
      "name": "La Trattoria",
      "cuisine": "italian",
      "wheelchair": "yes"
    }
  }
}
```

**Response:**
```json
{
  "validCount": 4,
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
      "value": "La Trattoria",
      "valueName": "La Trattoria",
      "valid": true,
      "deprecated": false,
      "message": "Tag name=La Trattoria is valid"
    },
    "cuisine": {
      "key": "cuisine",
      "keyName": "Cuisine",
      "value": "italian",
      "valueName": "Italian",
      "valid": true,
      "deprecated": false,
      "message": "Tag cuisine=italian is valid"
    },
    "wheelchair": {
      "key": "wheelchair",
      "keyName": "Wheelchair",
      "value": "yes",
      "valueName": "Yes",
      "valid": true,
      "deprecated": false,
      "message": "Tag wheelchair=yes is valid"
    }
  }
}
```

### Example 2: Collection with Deprecated Tag

**Request:**
```json
{
  "name": "validate_tag_collection",
  "arguments": {
    "tags": {
      "amenity": "park_bench",
      "name": "My Bench"
    }
  }
}
```

**Response:**
```json
{
  "validCount": 2,
  "deprecatedCount": 1,
  "errorCount": 0,
  "tagResults": {
    "amenity": {
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
    },
    "name": {
      "key": "name",
      "keyName": "Name",
      "value": "My Bench",
      "valueName": "My Bench",
      "valid": true,
      "deprecated": false,
      "message": "Tag name=My Bench is valid"
    }
  }
}
```

### Example 3: Collection with Invalid Tag

**Request:**
```json
{
  "name": "validate_tag_collection",
  "arguments": {
    "tags": {
      "amenity": "restaurant",
      "parking": "invalid_value"
    }
  }
}
```

**Response:**
```json
{
  "validCount": 1,
  "deprecatedCount": 0,
  "errorCount": 1,
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
    "parking": {
      "key": "parking",
      "keyName": "Parking",
      "value": "invalid_value",
      "valueName": "Invalid Value",
      "valid": false,
      "deprecated": false,
      "message": "Value 'invalid_value' is not a valid option for field 'parking'. Valid options: surface, underground, multi-storey, ..."
    }
  }
}
```

### Example 4: Text Format Input

**Request:**
```json
{
  "name": "validate_tag_collection",
  "arguments": {
    "tags": "amenity=cafe\nname=Starbucks\ncuisine=coffee_shop\n# Opening hours\nopening_hours=Mo-Su 07:00-22:00"
  }
}
```

**Response:**
```json
{
  "validCount": 4,
  "deprecatedCount": 0,
  "errorCount": 0,
  "tagResults": {
    "amenity": { ... },
    "name": { ... },
    "cuisine": { ... },
    "opening_hours": { ... }
  }
}
```

### Example 5: Empty Collection

**Request:**
```json
{
  "name": "validate_tag_collection",
  "arguments": {
    "tags": {}
  }
}
```

**Response:**
```json
{
  "validCount": 0,
  "deprecatedCount": 0,
  "errorCount": 0,
  "tagResults": {}
}
```

## Error Scenarios

### Missing Required Parameter

**Request:**
```json
{
  "name": "validate_tag_collection",
  "arguments": {}
}
```

**Error:**
```
Error: Missing required parameter: tags
```

### Invalid Input Format

**Request:**
```json
{
  "name": "validate_tag_collection",
  "arguments": {
    "tags": 123
  }
}
```

**Error:**
```
Error: Tags must be an object or string
```

### Malformed JSON String

**Request:**
```json
{
  "name": "validate_tag_collection",
  "arguments": {
    "tags": "{invalid json}"
  }
}
```

**Error:**
```
Error: Failed to parse tags JSON string
```

## Use Cases

### 1. Pre-Save Validation
Validate tags before saving to database:
```javascript
const result = await validate_tag_collection(userTags);
if (result.errorCount > 0) {
  showErrors("Please fix invalid tags before saving");
} else if (result.deprecatedCount > 0) {
  showWarning("Some tags are deprecated");
}
```

### 2. Import Validation
Validate imported OSM data:
```javascript
for (const feature of importedFeatures) {
  const result = await validate_tag_collection(feature.tags);
  console.log(`Feature ${feature.id}: ${result.validCount} valid, ${result.errorCount} errors`);
}
```

### 3. Data Quality Reports
Generate data quality statistics:
```javascript
const result = await validate_tag_collection(tags);
const quality = {
  total: Object.keys(result.tagResults).length,
  valid: result.validCount,
  deprecated: result.deprecatedCount,
  errors: result.errorCount,
  score: (result.validCount / (result.validCount + result.errorCount)) * 100
};
```

### 4. Deprecation Detection
Find and fix deprecated tags:
```javascript
const result = await validate_tag_collection(tags);
const deprecatedTags = Object.entries(result.tagResults)
  .filter(([_, r]) => r.deprecated)
  .map(([key, r]) => ({
    old: `${key}=${r.value}`,
    new: r.replacement
  }));
```

### 5. Localized Validation Messages
Display validation results with human-readable names:
```javascript
const result = await validate_tag_collection(tags);
Object.values(result.tagResults).forEach(r => {
  if (!r.valid) {
    console.error(`${r.keyName}=${r.valueName}: ${r.message}`);
  }
});
```

## Related Tools

- `validate_tag` - Validate a single tag
- `suggest_improvements` - Get improvement suggestions for tag collections
- `get_preset_details` - Get preset details to understand expected tags

## Notes

- Validates each tag individually using `validate_tag` tool
- Deprecated tags are counted as valid (but flagged as deprecated)
- Custom tags (not in schema) are considered valid
- Empty values are considered invalid
- Text format supports comments (lines starting with `#`)
- Text format ignores empty lines
- All three input formats produce identical validation results
- Statistics are aggregated from individual tag validation results

## Data Source

- Uses `validate_tag` tool for individual tag validation
- Field data: `@openstreetmap/id-tagging-schema/dist/fields.json`
- Preset data: `@openstreetmap/id-tagging-schema/dist/presets.json`
- Deprecated tags: `@openstreetmap/id-tagging-schema/dist/deprecated.json`
- Translations: `@openstreetmap/id-tagging-schema/dist/translations/en.json`

## Version History

- **Phase 8.6** (Current): Simplified response with counts, uses localized validate_tag
- **v0.1.0**: Initial implementation with detailed errors/warnings arrays
