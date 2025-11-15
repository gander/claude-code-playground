# suggest_improvements

Get structured improvement suggestions for OSM tag collections with localized names.

## Description

Analyzes a tag collection and provides structured, actionable suggestions for improving data quality. Suggests missing common fields, identifies deprecated tags, and matches the most appropriate presets.

**Phase 8.7 Updates:**
- Returns structured `suggestions` array with `operation`, `message`, `key`, `keyName`
- Returns `matchedPresetsDetailed` with localized preset names
- Removed `warnings` array (incorporated into suggestions)
- More actionable and machine-processable suggestions

## Category

Validation Tools

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tags` | object \| string | Yes | Tags to analyze in one of three formats |

### Input Formats

The `tags` parameter accepts three different formats:

**Format 1: Object (Recommended)**
```json
{
  "amenity": "restaurant",
  "name": "Pizza Place"
}
```

**Format 2: Text (key=value lines)**
```
amenity=restaurant
name=Pizza Place
```

**Format 3: JSON String**
```json
"{\"amenity\": \"restaurant\", \"name\": \"Pizza Place\"}"
```

## Output

Returns a JSON object with the following structure (Phase 8.7 format):

```typescript
{
  suggestions: Array<{             // Structured improvement suggestions
    operation: string;             // Suggestion type (add_missing_field, fix_deprecated, etc.)
    message: string;               // Human-readable suggestion message
    key: string;                   // Affected tag key
    keyName: string;               // Localized key name
    value?: string;                // Suggested value (optional)
    valueName?: string;            // Localized value name (optional)
  }>;
  matchedPresets: string[];        // Matched preset IDs (backward compatibility)
  matchedPresetsDetailed: Array<{  // Matched presets with localized names (Phase 8.7)
    id: string;                    // Preset ID
    name: string;                  // Localized preset name
  }>;
}
```

### Suggestion Operations

- **`add_missing_field`**: Suggests adding a commonly used tag that's missing
- **`fix_deprecated`**: Suggests replacing a deprecated tag
- **`add_optional_field`**: Suggests adding an optional but useful tag

## Examples

### Example 1: Restaurant with Missing Fields

**Request:**
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

**Response:**
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
      "message": "Consider adding 'opening_hours' tag (common for Restaurant preset)",
      "key": "opening_hours",
      "keyName": "Opening Hours"
    },
    {
      "operation": "add_optional_field",
      "message": "Consider adding 'phone' tag (optional for Restaurant preset)",
      "key": "phone",
      "keyName": "Phone"
    },
    {
      "operation": "add_optional_field",
      "message": "Consider adding 'website' tag (optional for Restaurant preset)",
      "key": "website",
      "keyName": "Website"
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

### Example 2: Complete Tag Collection (No Suggestions)

**Request:**
```json
{
  "name": "suggest_improvements",
  "arguments": {
    "tags": {
      "amenity": "restaurant",
      "name": "La Trattoria",
      "cuisine": "italian",
      "opening_hours": "Mo-Su 11:00-22:00",
      "phone": "+1-555-1234",
      "website": "https://example.com",
      "wheelchair": "yes"
    }
  }
}
```

**Response:**
```json
{
  "suggestions": [],
  "matchedPresets": ["amenity/restaurant"],
  "matchedPresetsDetailed": [
    {
      "id": "amenity/restaurant",
      "name": "Restaurant"
    }
  ]
}
```

### Example 3: Deprecated Tag Detection

**Request:**
```json
{
  "name": "suggest_improvements",
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
  "suggestions": [
    {
      "operation": "fix_deprecated",
      "message": "Tag amenity=park_bench is deprecated. Consider using: Leisure=Picnic Table",
      "key": "amenity",
      "keyName": "Amenity",
      "value": "park_bench",
      "valueName": "Park Bench"
    }
  ],
  "matchedPresets": [],
  "matchedPresetsDetailed": []
}
```

### Example 4: Parking Lot Suggestions

**Request:**
```json
{
  "name": "suggest_improvements",
  "arguments": {
    "tags": {
      "amenity": "parking"
    }
  }
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "operation": "add_missing_field",
      "message": "Consider adding 'parking' tag (common for Parking Lot preset)",
      "key": "parking",
      "keyName": "Parking"
    },
    {
      "operation": "add_missing_field",
      "message": "Consider adding 'fee' tag (common for Parking Lot preset)",
      "key": "fee",
      "keyName": "Fee"
    },
    {
      "operation": "add_optional_field",
      "message": "Consider adding 'capacity' tag (optional for Parking Lot preset)",
      "key": "capacity",
      "keyName": "Capacity"
    },
    {
      "operation": "add_optional_field",
      "message": "Consider adding 'operator' tag (optional for Parking Lot preset)",
      "key": "operator",
      "keyName": "Operator"
    }
  ],
  "matchedPresets": ["amenity/parking"],
  "matchedPresetsDetailed": [
    {
      "id": "amenity/parking",
      "name": "Parking Lot"
    }
  ]
}
```

### Example 5: Text Format Input

**Request:**
```json
{
  "name": "suggest_improvements",
  "arguments": {
    "tags": "highway=residential\nname=Main Street"
  }
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "operation": "add_optional_field",
      "message": "Consider adding 'surface' tag (optional for Residential Road preset)",
      "key": "surface",
      "keyName": "Surface"
    },
    {
      "operation": "add_optional_field",
      "message": "Consider adding 'maxspeed' tag (optional for Residential Road preset)",
      "key": "maxspeed",
      "keyName": "Max Speed"
    }
  ],
  "matchedPresets": ["highway/residential"],
  "matchedPresetsDetailed": [
    {
      "id": "highway/residential",
      "name": "Residential Road"
    }
  ]
}
```

### Example 6: No Matching Preset

**Request:**
```json
{
  "name": "suggest_improvements",
  "arguments": {
    "tags": {
      "custom_tag": "custom_value"
    }
  }
}
```

**Response:**
```json
{
  "suggestions": [],
  "matchedPresets": [],
  "matchedPresetsDetailed": []
}
```

## Error Scenarios

### Missing Required Parameter

**Request:**
```json
{
  "name": "suggest_improvements",
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
  "name": "suggest_improvements",
  "arguments": {
    "tags": 123
  }
}
```

**Error:**
```
Error: Tags must be an object or string
```

## Use Cases

### 1. Interactive Tag Editor
Provide real-time suggestions as users edit tags:
```javascript
const result = await suggest_improvements(currentTags);
displaySuggestions(result.suggestions.map(s => ({
  type: s.operation,
  message: s.message,
  field: s.keyName
})));
```

### 2. Automated Code Suggestions
Parse suggestions for automated improvements:
```javascript
const result = await suggest_improvements(tags);
const addFields = result.suggestions
  .filter(s => s.operation === 'add_missing_field')
  .map(s => s.key);
console.log(`Suggest adding: ${addFields.join(', ')}`);
```

### 3. Data Quality Dashboard
Show quality metrics for OSM data:
```javascript
const result = await suggest_improvements(feature.tags);
const quality = {
  preset: result.matchedPresetsDetailed[0]?.name || 'Unknown',
  completeness: calculateCompleteness(feature.tags, result.suggestions),
  suggestions: result.suggestions.length
};
```

### 4. Bulk Import Validation
Suggest improvements for imported data:
```javascript
for (const feature of importedFeatures) {
  const result = await suggest_improvements(feature.tags);
  if (result.suggestions.length > 0) {
    console.log(`Feature ${feature.id}: ${result.suggestions.length} suggestions`);
    result.suggestions.forEach(s => console.log(`  - ${s.message}`));
  }
}
```

### 5. Localized Suggestion Display
Display suggestions with human-readable field names:
```javascript
const result = await suggest_improvements(tags);
result.suggestions.forEach(s => {
  console.log(`${s.operation}: Add ${s.keyName} field`);
});
```

### 6. Deprecation Alerts
Alert users about deprecated tags:
```javascript
const result = await suggest_improvements(tags);
const deprecations = result.suggestions.filter(s => s.operation === 'fix_deprecated');
if (deprecations.length > 0) {
  showAlert(`Found ${deprecations.length} deprecated tags`);
}
```

## Related Tools

- `validate_tag_collection` - Validate tag collections
- `get_preset_details` - Get complete preset information
- `validate_tag` - Validate individual tags

## Notes

- Suggestions are based on matched presets from the schema
- Missing field suggestions prioritize fields from matched presets
- Fields already present in the collection are not suggested
- Deprecated tags are detected using schema deprecation data
- Multiple presets may match the same tag collection
- Suggestions use localized field names for better readability
- All three input formats produce identical suggestions
- Custom tags (not in schema) receive no suggestions but don't cause errors

## Data Source

- Preset data: `@openstreetmap/id-tagging-schema/dist/presets.json`
- Field data: `@openstreetmap/id-tagging-schema/dist/fields.json`
- Deprecated tags: `@openstreetmap/id-tagging-schema/dist/deprecated.json`
- Translations: `@openstreetmap/id-tagging-schema/dist/translations/en.json`

## Version History

- **Phase 8.7** (Current): Structured suggestions array, localization, matchedPresetsDetailed
- **v0.1.0**: Initial implementation with simple string suggestions
