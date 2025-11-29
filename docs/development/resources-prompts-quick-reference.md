# MCP Resources and Prompts - Quick Reference

**Phase**: 9 (Planned)
**Status**: Design Complete
**Last Updated**: 2025-11-29

> **Note**: This is a quick reference summary. See `resources-prompts-design.md` for complete design specification.

## MCP Resources (9 total)

Resources provide URI-based, read-only access to schema data.

### Resource List

| URI Pattern | Description | Type |
|-------------|-------------|------|
| `osm://schema/metadata` | Schema version and load metadata | Static |
| `osm://schema/stats` | Statistical overview (counts by type) | Computed |
| `osm://tags/{key}` | Complete tag key information | Dynamic |
| `osm://presets/{preset_id}` | Full preset documentation | Dynamic |
| `osm://categories` | All category overview | Static |
| `osm://categories/{category_id}` | Category details with members | Dynamic |
| `osm://deprecated` | All deprecated tags with replacements | Static |
| `osm://field-types` | Field type reference documentation | Static |
| `osm://geometry-types` | Geometry type reference documentation | Static |

### Resource Categories

**Schema Information** (2):
- Metadata - version tracking
- Statistics - schema overview

**Tag Reference** (1):
- Tag key info - complete reference for each tag key

**Preset Information** (3):
- Preset documentation - full preset details
- Category overview - all categories
- Category details - category members

**Reference Documentation** (3):
- Deprecated tags - migration guidance
- Field types - field type reference
- Geometry types - OSM geometry reference

---

## MCP Prompts (7 total)

Prompts provide pre-configured workflows with structured guidance.

### Prompt List

| Name | Category | Purpose |
|------|----------|---------|
| `explain_tags` | Educational | Explain what a tag combination represents |
| `suggest_feature_tags` | Creation | Suggest tags for a feature description |
| `review_changeset` | Quality Assurance | Review changeset for tag quality |
| `modernize_tags` | Migration | Update deprecated tags to modern equivalents |
| `generate_preset` | Development | Generate preset configuration |
| `validate_feature` | Quality Assurance | Comprehensive feature validation |
| `compare_tagging` | Educational | Compare different tagging approaches |

### Prompts by Category

**Educational** (2):
- `explain_tags` - Tag combination explanation
- `compare_tagging` - Approach comparison

**Quality Assurance** (2):
- `review_changeset` - Changeset validation
- `validate_feature` - Feature quality check

**Creation** (1):
- `suggest_feature_tags` - Tag suggestions

**Migration** (1):
- `modernize_tags` - Deprecated tag updates

**Development** (1):
- `generate_preset` - Preset generation

---

## Quick Access

### For Users

**Want to learn about tags?**
- Use `explain_tags` prompt
- Browse `osm://tags/{key}` resource

**Want to create a new feature?**
- Use `suggest_feature_tags` prompt
- Check `osm://presets/{preset_id}` resource

**Want to validate your work?**
- Use `review_changeset` prompt
- Use `validate_feature` prompt

**Want to update old tags?**
- Use `modernize_tags` prompt
- Check `osm://deprecated` resource

### For Developers

**Building a tag editor?**
- Resources: `osm://tags/{key}`, `osm://presets/{preset_id}`
- References: `osm://field-types`, `osm://geometry-types`

**Creating mapping guides?**
- Resources: `osm://categories`, `osm://presets/{preset_id}`
- Prompts: `explain_tags`, `compare_tagging`

**Building validation tools?**
- Prompts: `review_changeset`, `validate_feature`
- Resource: `osm://deprecated`

**Working with presets?**
- Prompt: `generate_preset`
- Resources: `osm://presets/{preset_id}`, `osm://categories/{category_id}`

---

## Implementation Status

### Phase 9 Roadmap

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Resource Infrastructure | Resource framework, URI routing |
| 2 | Core Resources | 6 primary resources |
| 3 | Reference Resources | 3 reference resources |
| 4 | Prompt Infrastructure | Prompt framework, templates |
| 5 | Educational Prompts | 2 educational prompts |
| 6 | Creation & QA Prompts | 3 QA prompts |
| 7 | Migration & Dev Prompts | 2 migration/dev prompts |
| 8 | Integration & Release | E2E tests, documentation, release |

**Current Status**: Design complete, awaiting implementation start

---

## Usage Examples

### Resource Access

```
# Get schema metadata
URI: osm://schema/metadata
Returns: Version, load timestamp, source info

# Get tag key information
URI: osm://tags/amenity
Returns: Valid values, presets, field definition

# Get preset documentation
URI: osm://presets/amenity/restaurant
Returns: Complete preset config, fields, tags

# Get deprecated tags
URI: osm://deprecated
Returns: All deprecated tags with replacements
```

### Prompt Invocation

```
# Explain tags
Prompt: explain_tags
Args: {tags: {amenity: "restaurant", cuisine: "italian"}}

# Suggest tags
Prompt: suggest_feature_tags
Args: {description: "A small coffee shop", geometry: "point"}

# Review changeset
Prompt: review_changeset
Args: {features: [{tags: {...}, geometry: "area"}]}

# Modernize tags
Prompt: modernize_tags
Args: {tags: {amenity: "emergency_phone"}}
```

---

## Design Principles

1. **Complementary**: Resources and prompts complement existing tools
2. **User-Centric**: Focus on common OSM mapping workflows
3. **Educational**: Help users understand OSM tagging
4. **Schema-Driven**: All data from @openstreetmap/id-tagging-schema
5. **TDD Approach**: Test-driven development throughout

---

## Next Steps

1. ✅ Design complete
2. ✅ Implementation plan created
3. ⏳ Awaiting implementation approval
4. ⏳ Resource infrastructure (Week 1)
5. ⏳ Core resources (Week 2)
6. ⏳ Prompt infrastructure (Week 4)
7. ⏳ Complete implementation (Week 8)

---

## Related Documentation

- **Complete Design**: `resources-prompts-design.md`
- **Implementation Plan**: `phase-9-implementation-plan.md`
- **Project Overview**: `../../CLAUDE.md`
- **Roadmap**: `roadmap.md`

---

## Contact & Feedback

For questions about the design or to provide feedback:
- Open an issue on GitHub
- Reference Phase 9 design documents
- Tag with "phase-9" or "resources-prompts" labels
