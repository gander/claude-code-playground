# search_presets

Search for OSM presets by keyword or tag with localized names.

## Description

Searches for OSM presets that match a keyword query or tag filter. Returns matching presets with their IDs, localized names, tags, and supported geometry types.

**Phase 8.8 Updates:**
- Returns `name` (localized preset name) for each result
- Returns `tagsDetailed` with localized key/value names
- Supports geometry filtering
- Maintains backward compatibility with `tags` field

## Category

Preset Discovery Tools

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | Yes | Keyword to search for (preset name, tag, or tag notation) |
| `limit` | number | No | Maximum number of results to return (default: 50) |
| `geometry` | string | No | Filter by geometry type: `point`, `line`, `area`, or `relation` |

### Keyword Formats

The `keyword` parameter accepts multiple formats:

1. **Text search**: `"restaurant"` - Searches preset names
2. **Tag notation**: `"amenity=restaurant"` - Searches by specific tag
3. **Key only**: `"amenity"` - Searches presets with this key
4. **Partial match**: `"cafe"` - Matches substrings in preset names

## Output

Returns a JSON object with the following structure (Phase 8.8 format):

```typescript
{
  results: Array<{
    id: string;                    // Preset ID (e.g., "amenity/restaurant")
    name: string;                  // Localized preset name (e.g., "Restaurant")
    tags: object;                  // Tag object (backward compatibility)
    tagsDetailed: Array<{          // Tags with localized names (Phase 8.8)
      key: string;                 // Tag key (e.g., "amenity")
      keyName: string;             // Localized key name (e.g., "Amenity")
      value: string;               // Tag value (e.g., "restaurant")
      valueName: string;           // Localized value name (e.g., "Restaurant")
    }>;
    geometry: string[];            // Supported geometry types
  }>;
}
```

## Examples

### Example 1: Search by Name

**Request:**
```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "restaurant"
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "amenity/restaurant",
      "name": "Restaurant",
      "tags": {
        "amenity": "restaurant"
      },
      "tagsDetailed": [
        {
          "key": "amenity",
          "keyName": "Amenity",
          "value": "restaurant",
          "valueName": "Restaurant"
        }
      ],
      "geometry": ["point", "area"]
    },
    {
      "id": "amenity/restaurant/american",
      "name": "American Restaurant",
      "tags": {
        "amenity": "restaurant",
        "cuisine": "american"
      },
      "tagsDetailed": [
        {
          "key": "amenity",
          "keyName": "Amenity",
          "value": "restaurant",
          "valueName": "Restaurant"
        },
        {
          "key": "cuisine",
          "keyName": "Cuisine",
          "value": "american",
          "valueName": "American"
        }
      ],
      "geometry": ["point", "area"]
    }
  ]
}
```

### Example 2: Search by Tag Notation

**Request:**
```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "amenity=parking"
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "amenity/parking",
      "name": "Parking Lot",
      "tags": {
        "amenity": "parking"
      },
      "tagsDetailed": [
        {
          "key": "amenity",
          "keyName": "Amenity",
          "value": "parking",
          "valueName": "Parking"
        }
      ],
      "geometry": ["point", "area"]
    }
  ]
}
```

### Example 3: Filter by Geometry

**Request:**
```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "building",
    "geometry": "area",
    "limit": 10
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "building",
      "name": "Building",
      "tags": {
        "building": "*"
      },
      "tagsDetailed": [],
      "geometry": ["area"]
    },
    {
      "id": "building/house",
      "name": "House",
      "tags": {
        "building": "house"
      },
      "tagsDetailed": [
        {
          "key": "building",
          "keyName": "Building",
          "value": "house",
          "valueName": "House"
        }
      ],
      "geometry": ["area"]
    }
  ]
}
```

### Example 4: Search by Tag Key

**Request:**
```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "highway",
    "limit": 5
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "highway/residential",
      "name": "Residential Road",
      "tags": {
        "highway": "residential"
      },
      "tagsDetailed": [
        {
          "key": "highway",
          "keyName": "Highway",
          "value": "residential",
          "valueName": "Residential"
        }
      ],
      "geometry": ["line"]
    },
    {
      "id": "highway/motorway",
      "name": "Motorway",
      "tags": {
        "highway": "motorway"
      },
      "tagsDetailed": [
        {
          "key": "highway",
          "keyName": "Highway",
          "value": "motorway",
          "valueName": "Motorway"
        }
      ],
      "geometry": ["line"]
    }
  ]
}
```

### Example 5: No Matches Found

**Request:**
```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "nonexistent_preset"
  }
}
```

**Response:**
```json
{
  "results": []
}
```

## Error Scenarios

### Missing Required Parameter

**Request:**
```json
{
  "name": "search_presets",
  "arguments": {}
}
```

**Error:**
```
Error: Missing required parameter: keyword
```

### Invalid Geometry Type

**Request:**
```json
{
  "name": "search_presets",
  "arguments": {
    "keyword": "building",
    "geometry": "invalid_type"
  }
}
```

**Response:**
```json
{
  "results": []
}
```

## Use Cases

### 1. Preset Browser
Build a preset browser interface:
```javascript
const results = await search_presets("amenity");
displayPresets(results.results.map(r => ({
  id: r.id,
  name: r.name,
  tags: r.tagsDetailed.map(t => `${t.keyName}=${t.valueName}`).join(', ')
})));
```

### 2. Tag Editor Selection
Help users select appropriate presets:
```javascript
const results = await search_presets("restaurant", 10);
const options = results.results.map(r => ({
  value: r.id,
  label: r.name,
  tags: r.tags
}));
```

### 3. Geometry-Specific Presets
Filter presets by geometry type:
```javascript
const areaPresets = await search_presets("building", 50, "area");
const linePresets = await search_presets("highway", 50, "line");
```

### 4. Tag Discovery
Find presets that use a specific tag:
```javascript
const results = await search_presets("amenity=cafe");
console.log(`Found ${results.results.length} cafe presets`);
results.results.forEach(r => {
  console.log(`${r.name}: ${JSON.stringify(r.tags)}`);
});
```

### 5. Localized Preset Display
Display presets with human-readable names:
```javascript
const results = await search_presets("shop");
results.results.forEach(r => {
  console.log(`${r.name}:`);
  r.tagsDetailed.forEach(t => {
    console.log(`  ${t.keyName} = ${t.valueName}`);
  });
});
```

## Related Tools

- `get_preset_details` - Get complete preset information
- `search_tags` - Search for tags by keyword
- `validate_tag_collection` - Validate tag collections against presets

## Notes

- Search is case-insensitive
- Keyword matching includes preset names and tag values
- Tag notation format: `key=value` (e.g., `amenity=restaurant`)
- Geometry filter only returns presets that support the specified geometry
- Results are limited to prevent overwhelming responses (default: 50)
- Wildcard tag values (`*`) are excluded from `tagsDetailed` array
- Localized names use English translations with fallback formatting

## Data Source

- Preset data: `@openstreetmap/id-tagging-schema/dist/presets.json`
- Translations: `@openstreetmap/id-tagging-schema/dist/translations/en.json`

## Version History

- **Phase 8.8** (Current): Added localization (name, tagsDetailed)
- **v0.1.0**: Initial implementation with basic search
