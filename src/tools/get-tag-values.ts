import type { SchemaLoader } from "../utils/schema-loader.js";

/**
 * Get all possible values for a given tag key
 *
 * @param loader - Schema loader instance
 * @param tagKey - The tag key to get values for (e.g., "amenity", "building")
 * @returns Array of unique values for the tag key, sorted alphabetically
 */
export async function getTagValues(
	loader: SchemaLoader,
	tagKey: string,
): Promise<string[]> {
	const schema = await loader.loadSchema();

	// Collect all unique values for the tag key
	const values = new Set<string>();

	// First, check fields for predefined options
	// Fields are stored with slash separator (e.g., "toilets/wheelchair")
	// but OSM uses colon separator (e.g., "toilets:wheelchair")
	const fieldKeyLookup = tagKey.replace(/:/g, "/");
	const field = schema.fields[fieldKeyLookup];
	let actualKey = tagKey; // The actual OSM key (with colon)

	if (field) {
		// Use the actual OSM key from the field definition (with colon)
		actualKey = field.key;

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

	// Convert to array and sort
	return Array.from(values).sort();
}
