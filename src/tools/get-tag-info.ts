import type { SchemaLoader } from "../utils/schema-loader.js";
import type { TagInfo } from "./types.js";

/**
 * Get comprehensive information about a specific tag key
 *
 * @param loader - Schema loader instance
 * @param tagKey - The tag key to get information for (e.g., "parking", "amenity")
 * @returns Tag information including all possible values, type, and field definition status
 */
export async function getTagInfo(
	loader: SchemaLoader,
	tagKey: string,
): Promise<TagInfo> {
	const schema = await loader.loadSchema();

	// Collect all unique values for the tag key
	const values = new Set<string>();
	let hasFieldDefinition = false;
	let fieldType: string | undefined;
	let actualKey = tagKey; // The actual OSM key (with colon)

	// First, check fields for predefined options and metadata
	// Fields are stored with slash separator (e.g., "toilets/wheelchair")
	// but OSM uses colon separator (e.g., "toilets:wheelchair")
	const fieldKeyLookup = tagKey.replace(/:/g, "/");
	const field = schema.fields[fieldKeyLookup];
	if (field) {
		hasFieldDefinition = true;
		fieldType = field.type;
		// Use the actual OSM key from the field definition (with colon)
		actualKey = field.key;

		// Add field options if available
		if (field.options && Array.isArray(field.options)) {
			for (const option of field.options) {
				if (typeof option === "string") {
					values.add(option);
				}
			}
		}
	}

	// Then iterate through all presets to find additional values
	// Presets use the actual OSM key format (with colon)
	for (const preset of Object.values(schema.presets)) {
		// Check if this preset has the tag key
		if (preset.tags[actualKey]) {
			const value = preset.tags[actualKey];
			// Skip wildcards and complex patterns
			if (value && value !== "*" && !value.includes("|")) {
				values.add(value);
			}
		}

		// Also check addTags if present
		if (preset.addTags?.[actualKey]) {
			const value = preset.addTags[actualKey];
			if (value && value !== "*" && !value.includes("|")) {
				values.add(value);
			}
		}
	}

	// Return tag information with the actual OSM key (with colon)
	return {
		key: actualKey,
		values: Array.from(values).sort(),
		type: fieldType,
		hasFieldDefinition,
	};
}
