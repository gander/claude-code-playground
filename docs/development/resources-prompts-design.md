# MCP Resources and Prompts Design

**Status**: Design Phase
**Target Phase**: Phase 9 - Resources and Prompts Implementation
**Date**: 2025-11-29

## Overview

This document outlines the design for MCP resources and prompts that will extend the OSM Tagging Schema MCP server beyond its current tool-based capabilities. Resources provide URI-based access to schema data, while prompts offer pre-configured workflows for common OSM tagging tasks.

## Design Philosophy

1. **Complementary to Tools**: Resources and prompts should complement existing tools, not duplicate them
2. **User-Centric**: Focus on common workflows and use cases from the OSM mapping community
3. **Educational**: Help users understand OSM tagging through structured guidance
4. **TDD Approach**: All implementations follow test-driven development
5. **Schema-Driven**: All data comes from authoritative @openstreetmap/id-tagging-schema

## MCP Resources Design

Resources expose schema data through URI-based access patterns. They are read-only and provide structured information.

### Resource URI Scheme

All resources use the `osm://` URI scheme with hierarchical paths:

```
osm://schema/metadata
osm://schema/stats
osm://tags/{key}
osm://presets/{preset_id}
osm://categories
osm://categories/{category_id}
osm://deprecated
osm://field-types
osm://geometry-types
```

### Resource Catalog

#### 1. Schema Metadata Resource

**URI**: `osm://schema/metadata`
**Type**: Static metadata
**Update Frequency**: Per schema load

**Purpose**: Provides version information and loading metadata for the currently loaded schema.

**Response Structure**:
```json
{
  "version": "6.13.4",
  "loadedAt": "2025-11-29T12:00:00.000Z",
  "source": "@openstreetmap/id-tagging-schema",
  "mcp_server_version": "2.0.2"
}
```

**Use Cases**:
- Version compatibility checking
- Cache invalidation
- Debugging schema-related issues

---

#### 2. Schema Statistics Resource

**URI**: `osm://schema/stats`
**Type**: Computed statistics
**Update Frequency**: Per schema load

**Purpose**: Provides statistical overview of the schema contents.

**Response Structure**:
```json
{
  "presets": {
    "total": 1247,
    "by_geometry": {
      "point": 892,
      "area": 654,
      "line": 423,
      "vertex": 89,
      "relation": 45
    },
    "searchable": 1198
  },
  "fields": {
    "total": 543,
    "by_type": {
      "combo": 234,
      "check": 123,
      "text": 89,
      "multiCombo": 45,
      "other": 52
    },
    "universal": 23
  },
  "categories": {
    "total": 12
  },
  "deprecated": {
    "total": 234
  }
}
```

**Use Cases**:
- Schema exploration
- Understanding schema scope
- Monitoring schema growth over time

---

#### 3. Tag Key Information Resource

**URI**: `osm://tags/{key}`
**Type**: Dynamic (parameterized)
**Parameters**:
- `key` - OSM tag key (e.g., "amenity", "building")

**Purpose**: Complete reference information about a specific tag key including valid values, associated presets, and field definitions.

**Response Structure**:
```json
{
  "key": "amenity",
  "displayName": "Amenity",
  "field": {
    "type": "combo",
    "label": "Amenity",
    "universal": false,
    "geometry": ["point", "area"]
  },
  "values": [
    {
      "value": "restaurant",
      "displayName": "Restaurant",
      "description": "A place selling full sit-down meals",
      "presets": ["amenity/restaurant"]
    },
    {
      "value": "cafe",
      "displayName": "Cafe",
      "description": "A place selling coffee and light meals",
      "presets": ["amenity/cafe"]
    }
    // ... more values
  ],
  "presetCount": 145,
  "commonValues": ["restaurant", "cafe", "bar", "bank", "school"],
  "relatedKeys": ["cuisine", "name", "opening_hours"]
}
```

**Use Cases**:
- Tag key exploration
- Finding valid values for a key
- Understanding tag relationships
- Building tag editors/validators

---

#### 4. Preset Documentation Resource

**URI**: `osm://presets/{preset_id}`
**Type**: Dynamic (parameterized)
**Parameters**:
- `preset_id` - Preset identifier (e.g., "amenity/restaurant")

**Purpose**: Complete preset documentation including tags, fields, geometry constraints, and human-readable information.

**Response Structure**:
```json
{
  "id": "amenity/restaurant",
  "name": "Restaurant",
  "icon": "maki-restaurant",
  "geometry": ["point", "area"],
  "tags": {
    "amenity": "restaurant"
  },
  "addTags": {
    "amenity": "restaurant"
  },
  "fields": [
    {
      "id": "cuisine",
      "label": "Cuisine",
      "type": "combo"
    },
    {
      "id": "name",
      "label": "Name",
      "type": "text"
    }
  ],
  "moreFields": [
    {
      "id": "opening_hours",
      "label": "Opening Hours",
      "type": "combo"
    }
  ],
  "terms": ["diner", "eatery"],
  "reference": {
    "key": "amenity",
    "value": "restaurant"
  }
}
```

**Use Cases**:
- Preset exploration
- Building tag editors
- Understanding feature requirements
- Creating mapping guides

---

#### 5. Category Hierarchy Resource

**URI**: `osm://categories`
**Type**: Static (all categories)

**Purpose**: Overview of all preset categories and their members.

**Response Structure**:
```json
{
  "categories": [
    {
      "id": "category-building",
      "name": "Building",
      "icon": "maki-building",
      "geometry": ["area", "point"],
      "memberCount": 23,
      "topMembers": [
        "building/house",
        "building/commercial",
        "building/apartments"
      ]
    },
    {
      "id": "category-natural",
      "name": "Natural",
      "icon": "maki-natural",
      "geometry": ["area", "line", "point"],
      "memberCount": 45,
      "topMembers": [
        "natural/water",
        "natural/wood",
        "natural/tree"
      ]
    }
  ]
}
```

**Use Cases**:
- Category exploration
- Building category browsers
- Understanding preset organization

---

#### 6. Category Details Resource

**URI**: `osm://categories/{category_id}`
**Type**: Dynamic (parameterized)
**Parameters**:
- `category_id` - Category identifier (e.g., "category-building")

**Purpose**: Detailed information about a specific category including all members.

**Response Structure**:
```json
{
  "id": "category-building",
  "name": "Building",
  "icon": "maki-building",
  "geometry": ["area", "point"],
  "members": [
    {
      "id": "building/house",
      "name": "House",
      "icon": "maki-building",
      "geometry": ["area", "point"],
      "matchScore": 0.5
    }
    // ... all members
  ],
  "memberCount": 23
}
```

**Use Cases**:
- Browsing presets by category
- Building category-based UI
- Understanding related presets

---

#### 7. Deprecated Tags Resource

**URI**: `osm://deprecated`
**Type**: Static (all deprecated tags)

**Purpose**: Complete list of deprecated tags with their replacements and migration guidance.

**Response Structure**:
```json
{
  "deprecated": [
    {
      "old": {
        "amenity": "emergency_phone"
      },
      "new": {
        "emergency": "phone"
      },
      "reason": "Tag reorganization - emergency=* is the preferred key",
      "migratedCount": 1247
    },
    {
      "old": {
        "highway": "incline"
      },
      "new": {
        "highway": "path",
        "incline": "yes"
      },
      "reason": "Split into separate tags for better clarity"
    }
  ],
  "total": 234,
  "lastUpdated": "2025-11-29"
}
```

**Use Cases**:
- Finding deprecated tags
- Data migration planning
- Quality assurance
- Educating mappers about changes

---

#### 8. Field Types Reference Resource

**URI**: `osm://field-types`
**Type**: Static reference

**Purpose**: Documentation of all field types available in the schema with their characteristics.

**Response Structure**:
```json
{
  "fieldTypes": [
    {
      "type": "combo",
      "description": "Dropdown with predefined options",
      "allowsCustom": true,
      "supportsMultiple": false,
      "examples": ["cuisine", "surface", "building"]
    },
    {
      "type": "multiCombo",
      "description": "Dropdown allowing multiple selections",
      "allowsCustom": true,
      "supportsMultiple": true,
      "examples": ["payment", "fuel"]
    },
    {
      "type": "check",
      "description": "Boolean yes/no field",
      "allowsCustom": false,
      "supportsMultiple": false,
      "examples": ["indoor", "wheelchair"]
    }
    // ... all field types
  ],
  "total": 18
}
```

**Use Cases**:
- Understanding field behavior
- Building form UIs
- Field type selection
- Schema documentation

---

#### 9. Geometry Types Reference Resource

**URI**: `osm://geometry-types`
**Type**: Static reference

**Purpose**: Documentation of OSM geometry types and their usage.

**Response Structure**:
```json
{
  "geometryTypes": [
    {
      "type": "point",
      "osmElement": "node",
      "description": "Individual point location",
      "examples": ["Trees", "Traffic lights", "Restaurants"],
      "presetCount": 892
    },
    {
      "type": "line",
      "osmElement": "way (open)",
      "description": "Linear feature with direction",
      "examples": ["Roads", "Rivers", "Power lines"],
      "presetCount": 423
    },
    {
      "type": "area",
      "osmElement": "way (closed) or relation",
      "description": "Enclosed polygon area",
      "examples": ["Buildings", "Parks", "Lakes"],
      "presetCount": 654
    },
    {
      "type": "vertex",
      "osmElement": "node on way",
      "description": "Point along a line or area",
      "examples": ["Highway crossing", "Gate in fence"],
      "presetCount": 89
    },
    {
      "type": "relation",
      "osmElement": "relation",
      "description": "Collection of related elements",
      "examples": ["Bus routes", "Multipolygons", "Turn restrictions"],
      "presetCount": 45
    }
  ],
  "total": 5
}
```

**Use Cases**:
- Understanding OSM data model
- Geometry-based preset filtering
- Educational materials
- Editor UI development

---

## MCP Prompts Design

Prompts provide pre-configured workflows for common OSM tagging tasks. They guide the AI to perform specific operations in a consistent, schema-aware manner.

### Prompt Catalog

#### 1. Explain Tag Combination

**Name**: `explain_tags`
**Category**: Educational

**Purpose**: Explains what feature a tag combination represents, provides context, and suggests best practices.

**Arguments**:
- `tags` (required): JSON object with tag key-value pairs
- `geometry` (optional): Geometry type for context

**Prompt Template**:
```
You are an OpenStreetMap tagging expert. Analyze the following tag combination and provide a comprehensive explanation.

Tags: {tags}
Geometry: {geometry || "unspecified"}

Please provide:

1. **Feature Type**: What type of feature do these tags represent?
2. **Preset Match**: Which OSM preset(s) best match these tags?
3. **Tag Analysis**: Explain each tag's purpose and meaning
4. **Completeness**: Are there important tags missing?
5. **Best Practices**: Any tagging recommendations or common patterns?
6. **Issues**: Any problematic, deprecated, or conflicting tags?

Use the OSM tagging schema to validate your analysis.
```

**Example Usage**:
```json
{
  "tags": {
    "amenity": "restaurant",
    "cuisine": "italian",
    "name": "Mario's Pizzeria"
  },
  "geometry": "point"
}
```

**Expected Output**:
- Feature identification
- Preset recommendations
- Tag explanations
- Completeness assessment
- Best practice suggestions

---

#### 2. Suggest Tags for Feature

**Name**: `suggest_feature_tags`
**Category**: Creation

**Purpose**: Suggests appropriate tags for a feature based on natural language description.

**Arguments**:
- `description` (required): Natural language description of the feature
- `geometry` (optional): Intended geometry type

**Prompt Template**:
```
You are an OpenStreetMap tagging expert. Based on the feature description, suggest appropriate tags.

Description: {description}
Geometry: {geometry || "any"}

Please provide:

1. **Primary Tags**: Essential tags that define the feature type
2. **Preset Recommendation**: Most appropriate OSM preset
3. **Common Additional Tags**: Frequently used optional tags
4. **Tag Structure**: Complete tag collection in JSON format
5. **Alternatives**: Other valid tagging approaches if applicable
6. **Required Fields**: Important fields from the preset that should be filled

Use the OSM tagging schema to ensure tags are valid and follow current best practices.
```

**Example Usage**:
```json
{
  "description": "A small Italian restaurant in the city center",
  "geometry": "point"
}
```

**Expected Output**:
- Tag suggestions
- Preset identification
- Complete tag structure
- Field recommendations

---

#### 3. Review Changeset Tags

**Name**: `review_changeset`
**Category**: Quality Assurance

**Purpose**: Reviews OSM changeset data for tag validity, quality, and best practices.

**Arguments**:
- `features` (required): Array of features with tags and geometry
- `strict` (optional): Enable strict validation mode

**Prompt Template**:
```
You are an OpenStreetMap quality assurance expert. Review the following changeset for tag quality and correctness.

Features: {features}
Strict Mode: {strict || false}

For each feature, analyze:

1. **Tag Validity**: Are all tags valid according to the schema?
2. **Deprecated Tags**: Are any tags deprecated? Suggest replacements.
3. **Completeness**: Are important tags missing?
4. **Conflicts**: Any conflicting or contradictory tags?
5. **Best Practices**: Alignment with OSM tagging best practices
6. **Geometry**: Appropriate geometry type for the feature?

Provide:
- Summary of issues found
- Severity ratings (error, warning, info)
- Specific recommendations for each issue
- Overall changeset quality score

Use the OSM tagging schema for validation.
```

**Example Usage**:
```json
{
  "features": [
    {
      "tags": {
        "amenity": "parking_lot",
        "name": "City Center Parking"
      },
      "geometry": "area"
    }
  ],
  "strict": true
}
```

**Expected Output**:
- Validation results
- Issue list with severity
- Recommendations
- Quality score

---

#### 4. Modernize Legacy Tags

**Name**: `modernize_tags`
**Category**: Migration

**Purpose**: Identifies deprecated tags and provides modern replacements with explanations.

**Arguments**:
- `tags` (required): JSON object with potentially legacy tags
- `explain` (optional): Include detailed explanations

**Prompt Template**:
```
You are an OpenStreetMap tagging expert specializing in tag schema evolution. Analyze the tags and modernize any deprecated or legacy patterns.

Tags: {tags}
Include Explanations: {explain || true}

Please provide:

1. **Deprecated Tags**: List all deprecated tags found
2. **Modern Replacements**: Current schema-compliant replacements
3. **Migration Steps**: How to update each deprecated tag
4. **Explanation**: Why tags were deprecated and what changed
5. **Updated Tag Collection**: Complete modernized tag set
6. **Compatibility Notes**: Any compatibility considerations

Use the OSM tagging schema deprecated.json to ensure accurate replacements.
```

**Example Usage**:
```json
{
  "tags": {
    "amenity": "emergency_phone",
    "highway": "incline",
    "power_source": "wind"
  },
  "explain": true
}
```

**Expected Output**:
- Deprecated tag identification
- Modern replacements
- Migration guidance
- Updated tag collection

---

#### 5. Generate Preset Configuration

**Name**: `generate_preset`
**Category**: Development

**Purpose**: Creates a preset-compatible configuration for a new feature type.

**Arguments**:
- `feature_type` (required): Feature type description
- `base_tags` (required): Core tags defining the feature
- `geometry` (required): Supported geometry types
- `include_fields` (optional): Whether to suggest fields

**Prompt Template**:
```
You are an OpenStreetMap preset developer. Create a preset configuration for the specified feature type.

Feature Type: {feature_type}
Base Tags: {base_tags}
Geometry: {geometry}
Include Fields: {include_fields || true}

Generate a complete preset configuration including:

1. **Preset ID**: Suggested preset identifier
2. **Tags**: Required tags object
3. **Add Tags**: Tags to add when creating feature
4. **Remove Tags**: Tags to remove when removing preset
5. **Fields**: Suggested fields array (if requested)
6. **More Fields**: Optional additional fields
7. **Terms**: Search terms for the preset
8. **Geometry**: Supported geometry types
9. **Icon**: Suggested icon name
10. **Match Score**: Suggested match score

Follow the OSM preset schema structure from @openstreetmap/id-tagging-schema.
```

**Example Usage**:
```json
{
  "feature_type": "Electric Vehicle Charging Station",
  "base_tags": {
    "amenity": "charging_station"
  },
  "geometry": ["point"],
  "include_fields": true
}
```

**Expected Output**:
- Complete preset configuration
- Field suggestions
- Terms and metadata
- JSON structure

---

#### 6. Validate Feature Quality

**Name**: `validate_feature`
**Category**: Quality Assurance

**Purpose**: Comprehensive feature validation including completeness, accuracy, and quality.

**Arguments**:
- `tags` (required): Tag collection
- `geometry` (required): Geometry type
- `location` (optional): Geographic location for location-specific validation

**Prompt Template**:
```
You are an OpenStreetMap data quality expert. Perform comprehensive validation of the feature.

Tags: {tags}
Geometry: {geometry}
Location: {location || "unspecified"}

Analyze:

1. **Schema Compliance**: Valid according to OSM tagging schema?
2. **Preset Matching**: Best matching preset(s)
3. **Completeness Score**: Calculate based on preset fields
4. **Required Fields**: Missing required/important fields
5. **Geometry Validation**: Appropriate geometry for tag combination?
6. **Quality Issues**: Any quality concerns or anti-patterns?
7. **Improvement Suggestions**: Specific recommendations
8. **Overall Score**: Quality score (0-100)

Provide detailed validation report with actionable recommendations.
```

**Example Usage**:
```json
{
  "tags": {
    "amenity": "restaurant",
    "name": "Mario's"
  },
  "geometry": "point",
  "location": "Rome, Italy"
}
```

**Expected Output**:
- Validation report
- Completeness score
- Missing fields
- Recommendations
- Quality score

---

#### 7. Compare Tagging Approaches

**Name**: `compare_tagging`
**Category**: Educational

**Purpose**: Compares different tagging approaches for the same feature type.

**Arguments**:
- `feature_description` (required): Description of feature to tag
- `approaches` (required): Array of different tag combinations to compare

**Prompt Template**:
```
You are an OpenStreetMap tagging expert. Compare the different tagging approaches for representing the same feature.

Feature: {feature_description}

Approaches to compare:
{approaches}

For each approach, analyze:

1. **Schema Compliance**: Valid according to OSM schema?
2. **Preset Match**: Which preset(s) match?
3. **Completeness**: How complete is the tagging?
4. **Community Practice**: Alignment with OSM community standards
5. **Data Consumers**: How well will data consumers understand this?
6. **Pros/Cons**: Advantages and disadvantages

Recommendation:
- Which approach is best and why?
- Are there better alternatives?
- Common mistakes to avoid?
```

**Example Usage**:
```json
{
  "feature_description": "A free public parking lot",
  "approaches": [
    {
      "name": "Approach A",
      "tags": {"amenity": "parking", "fee": "no"}
    },
    {
      "name": "Approach B",
      "tags": {"amenity": "parking", "access": "yes", "fee": "no"}
    }
  ]
}
```

**Expected Output**:
- Comparison analysis
- Best practice recommendation
- Pros/cons for each approach

---

## Implementation Plan

### Phase 9.1: Resource Infrastructure (Week 1)

**Objectives**:
1. Implement MCP resource registration capability
2. Create resource handler framework
3. Add URI parsing and routing

**TDD Tasks**:
1. Write tests for resource URI parsing
2. Write tests for resource registration
3. Write tests for resource response format
4. Implement resource infrastructure
5. Integration tests with MCP SDK

**Deliverables**:
- Resource handler framework
- URI routing system
- Test suite
- Documentation

---

### Phase 9.2: Core Resources (Week 2)

**Objectives**:
1. Implement static resources (metadata, stats, categories)
2. Implement dynamic resources (tags, presets)
3. Full test coverage

**TDD Tasks**:
1. Tests for schema metadata resource
2. Tests for schema stats resource
3. Tests for tag key resource
4. Tests for preset documentation resource
5. Tests for category resources
6. Implement all resources
7. Integration tests

**Deliverables**:
- 9 resource implementations
- Full test coverage
- API documentation

---

### Phase 9.3: Reference Resources (Week 3)

**Objectives**:
1. Implement reference resources (field types, geometry types)
2. Implement deprecated tags resource
3. Documentation and examples

**TDD Tasks**:
1. Tests for field types resource
2. Tests for geometry types resource
3. Tests for deprecated tags resource
4. Implement resources
5. Integration tests
6. Documentation

**Deliverables**:
- Reference resource implementations
- Complete test coverage
- Usage documentation

---

### Phase 9.4: Prompt Infrastructure (Week 4)

**Objectives**:
1. Implement MCP prompt registration capability
2. Create prompt template system
3. Add prompt argument validation

**TDD Tasks**:
1. Write tests for prompt registration
2. Write tests for argument validation
3. Write tests for template rendering
4. Implement prompt infrastructure
5. Integration tests

**Deliverables**:
- Prompt framework
- Template system
- Test suite
- Documentation

---

### Phase 9.5: Educational Prompts (Week 5)

**Objectives**:
1. Implement explain_tags prompt
2. Implement compare_tagging prompt
3. Testing and documentation

**TDD Tasks**:
1. Tests for explain_tags prompt
2. Tests for compare_tagging prompt
3. Implement prompts
4. Integration tests
5. Example documentation

**Deliverables**:
- 2 educational prompt implementations
- Test coverage
- Usage examples

---

### Phase 9.6: Creation & QA Prompts (Week 6)

**Objectives**:
1. Implement suggest_feature_tags prompt
2. Implement review_changeset prompt
3. Implement validate_feature prompt
4. Testing and documentation

**TDD Tasks**:
1. Tests for suggest_feature_tags
2. Tests for review_changeset
3. Tests for validate_feature
4. Implement prompts
5. Integration tests
6. Documentation

**Deliverables**:
- 3 prompt implementations
- Test coverage
- Usage examples

---

### Phase 9.7: Migration & Development Prompts (Week 7)

**Objectives**:
1. Implement modernize_tags prompt
2. Implement generate_preset prompt
3. Complete testing and documentation

**TDD Tasks**:
1. Tests for modernize_tags
2. Tests for generate_preset
3. Implement prompts
4. Integration tests
5. Complete documentation

**Deliverables**:
- 2 prompt implementations
- Full test coverage
- Complete documentation

---

### Phase 9.8: Integration & Polish (Week 8)

**Objectives**:
1. End-to-end testing of all resources and prompts
2. Performance optimization
3. Documentation review and completion
4. User acceptance testing

**Tasks**:
1. E2E tests for resource workflows
2. E2E tests for prompt workflows
3. Performance benchmarking
4. Documentation updates
5. Example workflows
6. Release preparation

**Deliverables**:
- Complete E2E test suite
- Performance report
- Complete documentation
- Release notes
- Migration guide

---

## Testing Strategy

### Resource Testing

1. **Unit Tests**: Test each resource handler in isolation
2. **Integration Tests**: Test resources through MCP protocol
3. **Data Integrity Tests**: Validate against actual schema JSON
4. **URI Parsing Tests**: Test all URI patterns
5. **Error Handling Tests**: Invalid URIs, missing data

### Prompt Testing

1. **Unit Tests**: Test prompt template rendering
2. **Argument Validation Tests**: Test all argument combinations
3. **Integration Tests**: Test prompts through MCP protocol
4. **Response Quality Tests**: Validate prompt outputs
5. **Edge Case Tests**: Unusual inputs, missing data

### Performance Testing

1. **Resource Load Time**: < 100ms for all resources
2. **Prompt Response Time**: < 500ms for template rendering
3. **Memory Usage**: No memory leaks
4. **Concurrent Access**: Handle multiple simultaneous requests

---

## Documentation Requirements

### User Documentation

1. **Resource Guide** (`docs/user/resources.md`)
   - All available resources
   - URI patterns
   - Response formats
   - Usage examples

2. **Prompt Guide** (`docs/user/prompts.md`)
   - All available prompts
   - Arguments and parameters
   - Use cases
   - Example workflows

### API Documentation

1. **Resource API** (`docs/api/resources/`)
   - One file per resource
   - Complete API reference
   - Examples and schemas

2. **Prompt API** (`docs/api/prompts/`)
   - One file per prompt
   - Template documentation
   - Argument reference
   - Example outputs

### Developer Documentation

1. **Resource Development** (`docs/development/resources.md`)
   - Creating new resources
   - Resource handler patterns
   - Testing resources
   - Best practices

2. **Prompt Development** (`docs/development/prompts.md`)
   - Creating new prompts
   - Template syntax
   - Testing prompts
   - Best practices

---

## Success Criteria

### Resources

- ✅ All 9 resources implemented
- ✅ Full test coverage (>90%)
- ✅ All tests passing
- ✅ Complete documentation
- ✅ Response time < 100ms
- ✅ Integration tests passing

### Prompts

- ✅ All 7 prompts implemented
- ✅ Full test coverage (>90%)
- ✅ All tests passing
- ✅ Complete documentation
- ✅ Response time < 500ms
- ✅ Integration tests passing

### Overall

- ✅ No breaking changes to existing tools
- ✅ Backward compatibility maintained
- ✅ CI/CD pipeline passing
- ✅ Docker builds successful
- ✅ NPM package updated
- ✅ Release notes prepared

---

## Future Enhancements

### Additional Resources

1. **Tag Usage Statistics** (`osm://stats/usage/{key}`)
   - Real-world usage data
   - Popularity metrics
   - Trend analysis

2. **Regional Tagging Patterns** (`osm://regional/{region}`)
   - Location-specific tagging
   - Regional variations
   - Best practices by region

### Additional Prompts

1. **Import Validation** - Validate bulk imports
2. **Conflation Assistant** - Help merge duplicate features
3. **Tag Translation** - Translate tags between schemas
4. **Quality Metrics** - Calculate data quality scores

---

## Dependencies

### MCP SDK Capabilities

- Resource registration API (`server.registerResource()`)
- Prompt registration API (`server.registerPrompt()`)
- URI handling capabilities
- Template rendering support

### Schema Dependencies

- All resources depend on @openstreetmap/id-tagging-schema
- Prompts use existing tools for validation
- No external API dependencies

### Testing Dependencies

- Node.js test runner
- fast-check for property-based testing
- Existing test infrastructure

---

## Risk Assessment

### Technical Risks

1. **MCP SDK Limitations**
   - Mitigation: Review SDK documentation, prototype early

2. **Resource Performance**
   - Mitigation: Caching, lazy loading, optimization

3. **Prompt Quality**
   - Mitigation: Extensive testing, user feedback, iteration

### Complexity Risks

1. **Template System**
   - Mitigation: Start simple, iterate based on needs

2. **URI Routing**
   - Mitigation: Use established patterns, comprehensive tests

### Maintenance Risks

1. **Schema Evolution**
   - Mitigation: Automated tests against schema changes

2. **Documentation Drift**
   - Mitigation: Documentation as code, automated checks

---

## Conclusion

This design provides a comprehensive plan for extending the OSM Tagging Schema MCP server with resources and prompts. The phased approach ensures systematic development following TDD principles, while maintaining backward compatibility and high quality standards.

**Next Steps**:
1. Review and approve design
2. Begin Phase 9.1 implementation
3. Set up tracking for each phase
4. Regular progress reviews

**Timeline**: 8 weeks for complete implementation
**Effort**: Estimated 160-200 hours total
