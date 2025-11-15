# search_tags

Search for OSM tags by keyword with separate key and value matches.

## Description

Searches for OSM tags that match a keyword query. Returns separate lists for tag keys that match and tag values that match, with localized names for each.

**Phase 8.4 Updates:**
- Returns separate `keyMatches` and `valueMatches` arrays
- Each match includes localized `keyName` and `valueName` (for value matches)
- No random values for key-only matches (cleaner, more predictable results)

## Category

Tag Query Tools

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | Yes | The keyword to search for in tag keys and values |
| `limit` | number | No | Maximum number of results to return (default: 50) |

## Output

Returns a JSON object with the following structure (Phase 8.4 format):

```typescript
{
  keyMatches: Array<{              // Tags where the key matches the keyword
    key: string;                   // Matching tag key (e.g., "wheelchair")
    keyName: string;               // Localized key name (e.g., "Wheelchair")
  }>;
  valueMatches: Array<{            // Tags where a value matches the keyword
    key: string;                   // Tag key (e.g., "access")
    keyName: string;               // Localized key name (e.g., "Access")
    value: string;                 // Matching value (e.g., "wheelchair")
    valueName: string;             // Localized value name (e.g., "Wheelchair")
  }>;
}
```

### Search Logic

1. **Key Matching**: Searches all tag keys (field definitions) for keyword
2. **Value Matching**: Searches all field option values for keyword
3. **Case-Insensitive**: All searches are case-insensitive
4. **Substring Matching**: Matches if keyword appears anywhere in key or value
5. **Limit Applied**: Results limited to specified count (default 50)

## Examples

### Example 1: Search for "wheelchair"

**Request:**
```json
{
  "name": "search_tags",
  "arguments": {
    "keyword": "wheelchair",
    "limit": 20
  }
}
```

**Response:**
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

### Example 2: Search for "parking"

**Request:**
```json
{
  "name": "search_tags",
  "arguments": {
    "keyword": "parking"
  }
}
```

**Response:**
```json
{
  "keyMatches": [
    {
      "key": "parking",
      "keyName": "Parking"
    },
    {
      "key": "parking:fee",
      "keyName": "Parking Fee"
    },
    {
      "key": "parking:condition",
      "keyName": "Parking Condition"
    }
  ],
  "valueMatches": [
    {
      "key": "amenity",
      "keyName": "Amenity",
      "value": "parking",
      "valueName": "Parking"
    },
    {
      "key": "amenity",
      "keyName": "Amenity",
      "value": "motorcycle_parking",
      "valueName": "Motorcycle Parking"
    }
  ]
}
```

### Example 3: Search with Limit

**Request:**
```json
{
  "name": "search_tags",
  "arguments": {
    "keyword": "road",
    "limit": 5
  }
}
```

**Response:**
```json
{
  "keyMatches": [
    {
      "key": "highway",
      "keyName": "Highway"
    }
  ],
  "valueMatches": [
    {
      "key": "highway",
      "keyName": "Highway",
      "value": "road",
      "valueName": "Road"
    },
    {
      "key": "highway",
      "keyName": "Highway",
      "value": "service_road",
      "valueName": "Service Road"
    }
  ]
}
```

### Example 4: No Matches Found

**Request:**
```json
{
  "name": "search_tags",
  "arguments": {
    "keyword": "xyznonexistent"
  }
}
```

**Response:**
```json
{
  "keyMatches": [],
  "valueMatches": []
}
```

### Example 5: Case-Insensitive Search

**Request:**
```json
{
  "name": "search_tags",
  "arguments": {
    "keyword": "RESTAURANT"
  }
}
```

**Response (same as searching "restaurant"):**
```json
{
  "keyMatches": [],
  "valueMatches": [
    {
      "key": "amenity",
      "keyName": "Amenity",
      "value": "restaurant",
      "valueName": "Restaurant"
    }
  ]
}
```

## Error Scenarios

### Missing Required Parameter

**Request:**
```json
{
  "name": "search_tags",
  "arguments": {}
}
```

**Error:**
```
Error: Missing required parameter: keyword
```

### Empty Keyword

**Request:**
```json
{
  "name": "search_tags",
  "arguments": {
    "keyword": ""
  }
}
```

**Response:**
```json
{
  "keyMatches": [],
  "valueMatches": []
}
```

## Use Cases

### 1. Tag Search Interface
Build a search interface for finding related tags:
```javascript
const results = await search_tags(userQuery);
displayResults({
  keys: results.keyMatches.map(m => m.keyName),
  values: results.valueMatches.map(m => `${m.keyName}=${m.valueName}`)
});
```

### 2. Tag Discovery
Help users discover related tags:
```javascript
const results = await search_tags("wheelchair");
console.log("Related keys:");
results.keyMatches.forEach(m => console.log(`  - ${m.keyName}`));
console.log("Values containing 'wheelchair':");
results.valueMatches.forEach(m => console.log(`  - ${m.keyName}=${m.valueName}`));
```

### 3. Autocomplete Suggestions
Provide autocomplete for tag search:
```javascript
const results = await search_tags(partialInput, 10);
const suggestions = [
  ...results.keyMatches.map(m => ({ type: 'key', text: m.keyName })),
  ...results.valueMatches.map(m => ({ type: 'value', text: `${m.keyName}=${m.valueName}` }))
];
```

### 4. Documentation Search
Search OSM tag documentation:
```javascript
const results = await search_tags(searchTerm);
generateTagDocs({
  keyResults: results.keyMatches,
  valueResults: results.valueMatches
});
```

## Related Tools

- `get_tag_values` - Get all values for a specific tag key
- `search_presets` - Search for OSM presets
- `validate_tag` - Validate a specific tag

## Notes

- Search is case-insensitive and matches substrings
- Key matches search against field keys from `fields.json`
- Value matches search against field option values
- Results are limited to prevent overwhelming responses
- Localized names use English translations with fallback formatting
- No random values returned for key-only matches (Phase 8.4 improvement)
- Both fields.json and presets.json are searched for comprehensive results

## Data Source

- Field data: `@openstreetmap/id-tagging-schema/dist/fields.json`
- Preset data: `@openstreetmap/id-tagging-schema/dist/presets.json`
- Translations: `@openstreetmap/id-tagging-schema/dist/translations/en.json`

## Version History

- **Phase 8.4** (Current): Separate keyMatches/valueMatches, localization, no random values
- **v0.1.0**: Initial implementation with mixed results
