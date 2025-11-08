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

	// First, check fields for predefined options and metadata
	const field = schema.fields[tagKey];
	if (field) {
		hasFieldDefinition = true;
		fieldType = field.type;

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
	for (const preset of Object.values(schema.presets)) {
		// Check if this preset has the tag key
		if (preset.tags[tagKey]) {
			const value = preset.tags[tagKey];
			// Skip wildcards and complex patterns
			if (value && value !== "*" && !value.includes("|")) {
				values.add(value);
			}
		}

		// Also check addTags if present
		if (preset.addTags?.[tagKey]) {
			const value = preset.addTags[tagKey];
			if (value && value !== "*" && !value.includes("|")) {
				values.add(value);
			}
		}
	}

	// Return tag information
	return {
		key: tagKey,
		values: Array.from(values).sort(),
		type: fieldType,
		hasFieldDefinition,
	};
}
