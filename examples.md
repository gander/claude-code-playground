# OSM Tagging Schema MCP - Tool Examples

This document provides comprehensive examples for all 7 tools in the OSM Tagging Schema MCP server. Each example shows real requests and responses, covering both valid and invalid inputs.

## Table of Contents

1. [validate_tag](#1-validate_tag)
2. [get_tag_values](#2-get_tag_values)
3. [search_tags](#3-search_tags)
4. [get_preset_details](#4-get_preset_details)
5. [search_presets](#5-search_presets)
6. [validate_tag_collection](#6-validate_tag_collection)
7. [suggest_improvements](#7-suggest_improvements)

---

## 1. validate_tag

**Purpose**: Validate a single tag key-value pair. Checks if the key exists in the schema, if the value is valid for that key, and if the tag is deprecated.

**Input**: `key` (string), `value` (string) - both required

### Example 1.1: Valid Key + Valid Value (Standard Option)

**Request**:
```json
{
  "key": "access",
  "value": "yes"
}
```

**Response**:
```json
{
  "valid": true,
  "deprecated": false,
  "message": "Tag 'access=yes' is valid. Value is one of the standard options for this key.",
  "fieldExists": true,
  "hasOptions": true,
  "valueInOptions": true
}
```

### Example 1.2: Valid Key + Valid Value (Custom Value Allowed)

**Request**:
```json
{
  "key": "building",
  "value": "custom_warehouse"
}
```

**Response**:
```json
{
  "valid": true,
  "deprecated": false,
  "message": "Tag 'building=custom_warehouse' is valid. Custom values are allowed for this key.",
  "fieldExists": true,
  "hasOptions": true,
  "valueInOptions": false
}
```

### Example 1.3: Valid Key + Valid Value (Deprecated Tag)

**Request**:
```json
{
  "key": "highway",
  "value": "incline_steep"
}
```

**Response**:
```json
{
  "valid": true,
  "deprecated": true,
  "message": "Tag 'highway=incline_steep' is valid but deprecated. Consider using the replacement.",
  "replacement": {
    "highway": "path",
    "incline": "steep"
  },
  "fieldExists": true
}
```

### Example 1.4: Valid Key + Invalid Value (Field with Strict Options)

**Request**:
```json
{
  "key": "parking",
  "value": "invalid_type"
}
```

**Response**:
```json
{
  "valid": true,
  "deprecated": false,
  "message": "Tag 'parking=invalid_type' is valid. Custom values are allowed, but 'invalid_type' is not in the standard options.",
  "fieldExists": true,
  "hasOptions": true,
  "valueInOptions": false,
  "availableOptions": ["surface", "underground", "multi-storey", "street_side", "lane", "carports", "sheds", "garage_boxes", "rooftop"]
}
```

### Example 1.5: Invalid Key (Unknown Key)

**Request**:
```json
{
  "key": "nonexistent_key_12345",
  "value": "some_value"
}
```

**Response**:
```json
{
  "valid": true,
  "deprecated": false,
  "message": "Tag 'nonexistent_key_12345=some_value' is valid. Key not found in schema, but OSM allows custom tags.",
  "fieldExists": false
}
```

**Note**: According to OSM philosophy, unknown keys are allowed (valid=true) but the response indicates the key is not in the schema.

### Example 1.6: Empty Key (Error)

**Request**:
```json
{
  "key": "",
  "value": "some_value"
}
```

**Response**:
```json
{
  "valid": false,
  "deprecated": false,
  "message": "Tag key cannot be empty"
}
```

### Example 1.7: Empty Value (Error)

**Request**:
```json
{
  "key": "amenity",
  "value": ""
}
```

**Response**:
```json
{
  "valid": false,
  "deprecated": false,
  "message": "Tag value cannot be empty"
}
```

---

## 2. get_tag_values

**Purpose**: Retrieve all possible values for a tag key from the schema (fields and presets).

**Input**: `tagKey` (string) - required

### Example 2.1: Valid Key with Multiple Values

**Request**:
```json
{
  "tagKey": "amenity"
}
```

**Response**:
```json
[
  {
    "value": "animal_boarding",
    "name": "Animal Boarding"
  },
  {
    "value": "animal_breeding",
    "name": "Animal Breeding"
  },
  {
    "value": "animal_shelter",
    "name": "Animal Shelter"
  },
  {
    "value": "arts_centre",
    "name": "Arts Centre"
  },
  {
    "value": "atm",
    "name": "ATM"
  },
  {
    "value": "bank",
    "name": "Bank"
  },
  {
    "value": "bar",
    "name": "Bar"
  },
  {
    "value": "bicycle_parking",
    "name": "Bicycle Parking"
  },
  {
    "value": "cafe",
    "name": "Cafe"
  },
  {
    "value": "car_wash",
    "name": "Car Wash"
  },
  {
    "value": "charging_station",
    "name": "Charging Station"
  },
  {
    "value": "cinema",
    "name": "Cinema"
  },
  {
    "value": "clinic",
    "name": "Clinic"
  },
  {
    "value": "college",
    "name": "College"
  },
  {
    "value": "community_centre",
    "name": "Community Centre"
  },
  {
    "value": "courthouse",
    "name": "Courthouse"
  },
  {
    "value": "dentist",
    "name": "Dentist"
  },
  {
    "value": "doctors",
    "name": "Doctor"
  },
  {
    "value": "fast_food",
    "name": "Fast Food"
  },
  {
    "value": "fire_station",
    "name": "Fire Station"
  },
  {
    "value": "fuel",
    "name": "Gas Station"
  },
  {
    "value": "hospital",
    "name": "Hospital"
  },
  {
    "value": "kindergarten",
    "name": "Kindergarten"
  },
  {
    "value": "library",
    "name": "Library"
  },
  {
    "value": "marketplace",
    "name": "Marketplace"
  },
  {
    "value": "parking",
    "name": "Parking"
  },
  {
    "value": "pharmacy",
    "name": "Pharmacy"
  },
  {
    "value": "place_of_worship",
    "name": "Place of Worship"
  },
  {
    "value": "police",
    "name": "Police"
  },
  {
    "value": "post_office",
    "name": "Post Office"
  },
  {
    "value": "pub",
    "name": "Pub"
  },
  {
    "value": "restaurant",
    "name": "Restaurant"
  },
  {
    "value": "school",
    "name": "School"
  },
  {
    "value": "toilets",
    "name": "Toilets"
  },
  {
    "value": "townhall",
    "name": "Town Hall"
  },
  {
    "value": "university",
    "name": "University"
  }
]
```

**Note**: Results are sorted alphabetically by value. The list above is abbreviated for brevity; the actual response contains 100+ amenity values.

### Example 2.2: Valid Key with Values and Descriptions

**Request**:
```json
{
  "tagKey": "parking"
}
```

**Response**:
```json
[
  {
    "value": "carports",
    "name": "Carports",
    "description": "Structure used to offer limited protection to vehicles, typically without walls."
  },
  {
    "value": "garage_boxes",
    "name": "Garage Boxes",
    "description": "Lockable garage boxes."
  },
  {
    "value": "lane",
    "name": "Lane",
    "description": "Parking on the lane."
  },
  {
    "value": "multi-storey",
    "name": "Multi-Storey",
    "description": "A building with multiple parking levels."
  },
  {
    "value": "rooftop",
    "name": "Rooftop",
    "description": "Parking on the rooftop of a building."
  },
  {
    "value": "sheds",
    "name": "Sheds",
    "description": "Sheds to park vehicles."
  },
  {
    "value": "street_side",
    "name": "Street Side",
    "description": "Parking along the street."
  },
  {
    "value": "surface",
    "name": "Surface",
    "description": "One level of parking on the ground."
  },
  {
    "value": "underground",
    "name": "Underground",
    "description": "Underground parking."
  }
]
```

### Example 2.3: Invalid Key (Non-Existent)

**Request**:
```json
{
  "tagKey": "nonexistent_tag_key_12345"
}
```

**Response**:
```json
[]
```

**Note**: Returns an empty array when the key is not found in the schema.

### Example 2.4: Valid Key with Colon Separator

**Request**:
```json
{
  "tagKey": "toilets:wheelchair"
}
```

**Response**:
```json
[
  {
    "value": "no",
    "name": "No"
  },
  {
    "value": "yes",
    "name": "Yes"
  }
]
```

**Note**: The tool accepts both colon (`:`) and slash (`/`) separators for nested keys.

---

## 3. search_tags

**Purpose**: Search for tags by keyword in keys, values, and preset names.

**Input**: `query` (string) - required

### Example 3.1: Query with Results (Multiple Matches)

**Request**:
```json
{
  "query": "wheelchair"
}
```

**Response**:
```json
[
  {
    "key": "toilets:wheelchair",
    "value": "no"
  },
  {
    "key": "toilets:wheelchair",
    "value": "yes"
  },
  {
    "key": "wheelchair",
    "value": "designated"
  },
  {
    "key": "wheelchair",
    "value": "limited"
  },
  {
    "key": "wheelchair",
    "value": "no"
  },
  {
    "key": "wheelchair",
    "value": "yes"
  }
]
```

**Note**: Search is case-insensitive and finds tags from both fields.json and presets.json. Results are limited to 100 entries.

### Example 3.2: Query with Results (Single Tag)

**Request**:
```json
{
  "query": "restaurant"
}
```

**Response**:
```json
[
  {
    "key": "amenity",
    "value": "restaurant"
  },
  {
    "key": "cuisine",
    "value": "african"
  },
  {
    "key": "cuisine",
    "value": "american"
  },
  {
    "key": "cuisine",
    "value": "asian"
  },
  {
    "key": "cuisine",
    "value": "chinese"
  },
  {
    "key": "cuisine",
    "value": "french"
  },
  {
    "key": "cuisine",
    "value": "indian"
  },
  {
    "key": "cuisine",
    "value": "italian"
  },
  {
    "key": "cuisine",
    "value": "japanese"
  },
  {
    "key": "cuisine",
    "value": "mexican"
  },
  {
    "key": "cuisine",
    "value": "pizza"
  },
  {
    "key": "cuisine",
    "value": "regional"
  },
  {
    "key": "cuisine",
    "value": "seafood"
  },
  {
    "key": "cuisine",
    "value": "thai"
  },
  {
    "key": "diet:vegan",
    "value": "no"
  },
  {
    "key": "diet:vegan",
    "value": "only"
  },
  {
    "key": "diet:vegan",
    "value": "yes"
  },
  {
    "key": "diet:vegetarian",
    "value": "no"
  },
  {
    "key": "diet:vegetarian",
    "value": "only"
  },
  {
    "key": "diet:vegetarian",
    "value": "yes"
  }
]
```

**Note**: Results are limited to 100 entries. The list above is abbreviated for brevity.

### Example 3.3: Query without Results (No Matches)

**Request**:
```json
{
  "query": "nonexistentkeywordinosm12345xyz"
}
```

**Response**:
```json
[]
```

**Note**: Returns an empty array when no tags match the query.

### Example 3.4: Case-Insensitive Search

**Request (lowercase)**:
```json
{
  "query": "park"
}
```

**Request (uppercase)**:
```json
{
  "query": "PARK"
}
```

**Response**: Both requests return identical results:
```json
[
  {
    "key": "amenity",
    "value": "bicycle_parking"
  },
  {
    "key": "amenity",
    "value": "parking"
  },
  {
    "key": "leisure",
    "value": "park"
  },
  {
    "key": "tourism",
    "value": "theme_park"
  }
]
```

---

## 4. get_preset_details

**Purpose**: Get complete details for a specific preset by its ID.

**Input**: `presetId` (string) - required

### Example 4.1: Valid Preset ID

**Request**:
```json
{
  "presetId": "amenity/restaurant"
}
```

**Response**:
```json
{
  "id": "amenity/restaurant",
  "name": "Restaurant",
  "tags": {
    "amenity": "restaurant"
  },
  "geometry": ["point", "area"],
  "icon": "maki-restaurant",
  "fields": [
    "name",
    "cuisine",
    "diet_multi",
    "address",
    "building_area",
    "opening_hours",
    "capacity",
    "takeaway",
    "delivery",
    "outdoor_seating",
    "phone",
    "payment_multi_fee",
    "website",
    "email",
    "stars",
    "internet_access/fee",
    "wheelchair"
  ],
  "moreFields": [
    "{amenity}",
    "air_conditioning",
    "baby_feeding",
    "changing_table",
    "level",
    "operator",
    "smoking"
  ]
}
```

### Example 4.2: Valid Preset ID (Minimal Preset)

**Request**:
```json
{
  "presetId": "barrier/fence"
}
```

**Response**:
```json
{
  "id": "barrier/fence",
  "name": "Fence",
  "tags": {
    "barrier": "fence"
  },
  "geometry": ["line", "area"],
  "icon": "maki-fence",
  "fields": [
    "fence_type",
    "height"
  ],
  "moreFields": [
    "colour",
    "material"
  ]
}
```

### Example 4.3: Invalid Preset ID (Non-Existent)

**Request**:
```json
{
  "presetId": "nonexistent/preset"
}
```

**Response**: Error thrown:
```json
{
  "error": "Preset 'nonexistent/preset' not found in schema"
}
```

**Note**: The tool throws an error (not just returns empty result) when a preset ID is not found.

---

## 5. search_presets

**Purpose**: Search for presets by keyword, tag filter, or geometry type.

**Input**: `query` (string, optional), `geometry` (string, optional), `limit` (number, optional)

### Example 5.1: Query with Results (Keyword Search)

**Request**:
```json
{
  "query": "restaurant"
}
```

**Response**:
```json
[
  {
    "id": "amenity/fast_food",
    "name": "Fast Food Restaurant",
    "tags": {
      "amenity": "fast_food"
    },
    "geometry": ["point", "area"]
  },
  {
    "id": "amenity/restaurant",
    "name": "Restaurant",
    "tags": {
      "amenity": "restaurant"
    },
    "geometry": ["point", "area"]
  },
  {
    "id": "amenity/restaurant/american",
    "name": "American Restaurant",
    "tags": {
      "amenity": "restaurant",
      "cuisine": "american"
    },
    "geometry": ["point", "area"]
  },
  {
    "id": "amenity/restaurant/asian",
    "name": "Asian Restaurant",
    "tags": {
      "amenity": "restaurant",
      "cuisine": "asian"
    },
    "geometry": ["point", "area"]
  },
  {
    "id": "amenity/restaurant/chinese",
    "name": "Chinese Restaurant",
    "tags": {
      "amenity": "restaurant",
      "cuisine": "chinese"
    },
    "geometry": ["point", "area"]
  },
  {
    "id": "amenity/restaurant/french",
    "name": "French Restaurant",
    "tags": {
      "amenity": "restaurant",
      "cuisine": "french"
    },
    "geometry": ["point", "area"]
  },
  {
    "id": "amenity/restaurant/italian",
    "name": "Italian Restaurant",
    "tags": {
      "amenity": "restaurant",
      "cuisine": "italian"
    },
    "geometry": ["point", "area"]
  },
  {
    "id": "amenity/restaurant/japanese",
    "name": "Japanese Restaurant",
    "tags": {
      "amenity": "restaurant",
      "cuisine": "japanese"
    },
    "geometry": ["point", "area"]
  },
  {
    "id": "amenity/restaurant/mexican",
    "name": "Mexican Restaurant",
    "tags": {
      "amenity": "restaurant",
      "cuisine": "mexican"
    },
    "geometry": ["point", "area"]
  },
  {
    "id": "amenity/restaurant/pizza",
    "name": "Pizza Restaurant",
    "tags": {
      "amenity": "restaurant",
      "cuisine": "pizza"
    },
    "geometry": ["point", "area"]
  }
]
```

**Note**: Results include all presets matching "restaurant" in ID or name. The list above is abbreviated for brevity.

### Example 5.2: Query without Results

**Request**:
```json
{
  "query": "nonexistentpresetxyz12345"
}
```

**Response**:
```json
[]
```

### Example 5.3: Tag Filter (Exact Match)

**Request**:
```json
{
  "query": "amenity=cafe"
}
```

**Response**:
```json
[
  {
    "id": "amenity/cafe",
    "name": "Cafe",
    "tags": {
      "amenity": "cafe"
    },
    "geometry": ["point", "area"]
  }
]
```

**Note**: Tag filters use `key=value` format. Only presets with an exact tag match are returned.

### Example 5.4: Geometry Filter

**Request**:
```json
{
  "query": "restaurant",
  "geometry": "area"
}
```

**Response**:
```json
[
  {
    "id": "amenity/restaurant",
    "name": "Restaurant",
    "tags": {
      "amenity": "restaurant"
    },
    "geometry": ["point", "area"]
  },
  {
    "id": "amenity/restaurant/american",
    "name": "American Restaurant",
    "tags": {
      "amenity": "restaurant",
      "cuisine": "american"
    },
    "geometry": ["point", "area"]
  }
]
```

**Note**: Only presets supporting "area" geometry are returned. Valid geometry values: `point`, `line`, `area`, `relation`.

### Example 5.5: Limit Parameter

**Request**:
```json
{
  "query": "building",
  "limit": 5
}
```

**Response**:
```json
[
  {
    "id": "building",
    "name": "Building",
    "tags": {
      "building": "yes"
    },
    "geometry": ["area"]
  },
  {
    "id": "building/apartments",
    "name": "Apartment Building",
    "tags": {
      "building": "apartments"
    },
    "geometry": ["area"]
  },
  {
    "id": "building/barn",
    "name": "Barn",
    "tags": {
      "building": "barn"
    },
    "geometry": ["area"]
  },
  {
    "id": "building/bunker",
    "name": "Bunker",
    "tags": {
      "building": "bunker"
    },
    "geometry": ["area"]
  },
  {
    "id": "building/cabin",
    "name": "Cabin",
    "tags": {
      "building": "cabin"
    },
    "geometry": ["area"]
  }
]
```

**Note**: The `limit` parameter restricts the number of results returned.

---

## 6. validate_tag_collection

**Purpose**: Validate a collection of tags and provide aggregated statistics about errors, warnings, and deprecated tags.

**Input**: `tags` (object) - required (key-value pairs)

### Example 6.1: Valid Tag Collection

**Request**:
```json
{
  "tags": {
    "amenity": "parking",
    "parking": "surface",
    "capacity": "50",
    "fee": "no"
  }
}
```

**Response**:
```json
{
  "valid": true,
  "tagResults": {
    "amenity": {
      "valid": true,
      "deprecated": false,
      "message": "Tag 'amenity=parking' is valid. Value is one of the standard options for this key.",
      "fieldExists": true,
      "hasOptions": true,
      "valueInOptions": true
    },
    "parking": {
      "valid": true,
      "deprecated": false,
      "message": "Tag 'parking=surface' is valid. Value is one of the standard options for this key.",
      "fieldExists": true,
      "hasOptions": true,
      "valueInOptions": true
    },
    "capacity": {
      "valid": true,
      "deprecated": false,
      "message": "Tag 'capacity=50' is valid.",
      "fieldExists": true,
      "hasOptions": false
    },
    "fee": {
      "valid": true,
      "deprecated": false,
      "message": "Tag 'fee=no' is valid. Value is one of the standard options for this key.",
      "fieldExists": true,
      "hasOptions": true,
      "valueInOptions": true
    }
  },
  "errors": [],
  "warnings": [],
  "deprecatedCount": 0,
  "errorCount": 0,
  "warningCount": 0
}
```

### Example 6.2: Collection with Invalid Values (Errors)

**Request**:
```json
{
  "tags": {
    "amenity": "",
    "parking": "surface"
  }
}
```

**Response**:
```json
{
  "valid": false,
  "tagResults": {
    "amenity": {
      "valid": false,
      "deprecated": false,
      "message": "Tag value cannot be empty"
    },
    "parking": {
      "valid": true,
      "deprecated": false,
      "message": "Tag 'parking=surface' is valid. Value is one of the standard options for this key.",
      "fieldExists": true,
      "hasOptions": true,
      "valueInOptions": true
    }
  },
  "errors": [
    "amenity: Tag value cannot be empty"
  ],
  "warnings": [],
  "deprecatedCount": 0,
  "errorCount": 1,
  "warningCount": 0
}
```

### Example 6.3: Collection with Deprecated Tags

**Request**:
```json
{
  "tags": {
    "highway": "incline_steep",
    "amenity": "parking"
  }
}
```

**Response**:
```json
{
  "valid": true,
  "tagResults": {
    "highway": {
      "valid": true,
      "deprecated": true,
      "message": "Tag 'highway=incline_steep' is valid but deprecated. Consider using the replacement.",
      "replacement": {
        "highway": "path",
        "incline": "steep"
      },
      "fieldExists": true
    },
    "amenity": {
      "valid": true,
      "deprecated": false,
      "message": "Tag 'amenity=parking' is valid. Value is one of the standard options for this key.",
      "fieldExists": true,
      "hasOptions": true,
      "valueInOptions": true
    }
  },
  "errors": [],
  "warnings": [
    "highway=incline_steep: Tag 'highway=incline_steep' is valid but deprecated. Consider using the replacement."
  ],
  "deprecatedCount": 1,
  "errorCount": 0,
  "warningCount": 1
}
```

### Example 6.4: Collection with Unknown Keys (Warnings)

**Request**:
```json
{
  "tags": {
    "unknown_key_12345": "value1",
    "another_unknown_key": "value2"
  }
}
```

**Response**:
```json
{
  "valid": true,
  "tagResults": {
    "unknown_key_12345": {
      "valid": true,
      "deprecated": false,
      "message": "Tag 'unknown_key_12345=value1' is valid. Key not found in schema, but OSM allows custom tags.",
      "fieldExists": false
    },
    "another_unknown_key": {
      "valid": true,
      "deprecated": false,
      "message": "Tag 'another_unknown_key=value2' is valid. Key not found in schema, but OSM allows custom tags.",
      "fieldExists": false
    }
  },
  "errors": [],
  "warnings": [
    "unknown_key_12345: Tag 'unknown_key_12345=value1' is valid. Key not found in schema, but OSM allows custom tags.",
    "another_unknown_key: Tag 'another_unknown_key=value2' is valid. Key not found in schema, but OSM allows custom tags."
  ],
  "deprecatedCount": 0,
  "errorCount": 0,
  "warningCount": 2
}
```

### Example 6.5: Empty Collection

**Request**:
```json
{
  "tags": {}
}
```

**Response**:
```json
{
  "valid": true,
  "tagResults": {},
  "errors": [],
  "warnings": [],
  "deprecatedCount": 0,
  "errorCount": 0,
  "warningCount": 0
}
```

---

## 7. suggest_improvements

**Purpose**: Analyze a tag collection and suggest missing fields or improvements based on matched presets.

**Input**: `tags` (object) - required (key-value pairs)

### Example 7.1: Collection with Suggestions (Incomplete Tags)

**Request**:
```json
{
  "tags": {
    "amenity": "restaurant"
  }
}
```

**Response**:
```json
{
  "suggestions": [
    "Consider adding 'name' - commonly used for restaurants",
    "Consider adding 'cuisine' - specifies the type of food served",
    "Consider adding 'opening_hours' - helps visitors know when the restaurant is open",
    "Consider adding 'phone' - contact information for customers",
    "Consider adding 'website' - provides more information about the restaurant",
    "Consider adding 'wheelchair' - accessibility information"
  ],
  "warnings": [],
  "matchedPresets": [
    "amenity/restaurant"
  ]
}
```

### Example 7.2: Collection with Deprecated Tags (Warnings)

**Request**:
```json
{
  "tags": {
    "highway": "incline_steep"
  }
}
```

**Response**:
```json
{
  "suggestions": [],
  "warnings": [
    "Tag 'highway=incline_steep' is deprecated. Consider replacing with: highway=path, incline=steep"
  ],
  "matchedPresets": []
}
```

### Example 7.3: Complete Tag Collection (Fewer Suggestions)

**Request**:
```json
{
  "tags": {
    "amenity": "restaurant",
    "name": "Pizza Place",
    "cuisine": "pizza",
    "opening_hours": "Mo-Su 11:00-22:00",
    "phone": "+1-555-1234",
    "website": "https://example.com",
    "wheelchair": "yes"
  }
}
```

**Response**:
```json
{
  "suggestions": [
    "Consider adding 'address' - helps visitors find the location"
  ],
  "warnings": [],
  "matchedPresets": [
    "amenity/restaurant",
    "amenity/restaurant/pizza"
  ]
}
```

**Note**: Fewer suggestions because most common fields are already present.

### Example 7.4: Empty Collection (No Suggestions)

**Request**:
```json
{
  "tags": {}
}
```

**Response**:
```json
{
  "suggestions": [],
  "warnings": [],
  "matchedPresets": []
}
```

### Example 7.5: Collection with Unknown Tags (No Matching Presets)

**Request**:
```json
{
  "tags": {
    "unknown_key_xyz": "unknown_value_123"
  }
}
```

**Response**:
```json
{
  "suggestions": [],
  "warnings": [],
  "matchedPresets": []
}
```

**Note**: No suggestions because the tags don't match any known presets.

---

## Summary of Test Coverage

Each tool has comprehensive test coverage for all valid/invalid input combinations:

| Tool | Valid Cases | Invalid Cases | Edge Cases | Total |
|------|-------------|---------------|------------|-------|
| **validate_tag** | key✓ value✓ (standard, custom, deprecated) | key✗, value="" | key="" | 7 |
| **get_tag_values** | key✓ | key✗ | key with colon | 3 |
| **search_tags** | query→results | query→no results | case-insensitive | 3 |
| **get_preset_details** | presetId✓ | presetId✗ (error) | - | 2 |
| **search_presets** | query, tag filter, geometry filter | query→no results | limit parameter | 5 |
| **validate_tag_collection** | valid collection | invalid values, deprecated, unknown keys | empty collection | 5 |
| **suggest_improvements** | incomplete→suggestions, complete→fewer | deprecated→warnings | empty, unknown | 5 |

**Total Examples**: 30 comprehensive examples covering all tools and scenarios.

---

## Testing

All examples in this document are verified by the comprehensive test suite:

- **Unit tests**: `tests/tools/*.test.ts` - Test tool logic with JSON schema validation
- **Integration tests**: `tests/integration/*.test.ts` - Test MCP protocol communication

Run tests with:
```bash
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm test                 # All tests
```

---

## Additional Resources

- [API Documentation](docs/api/README.md) - Detailed API reference
- [Usage Guide](docs/usage.md) - Common workflows and best practices
- [OSM Wiki](https://wiki.openstreetmap.org/wiki/Tags) - Official OSM tagging documentation
