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

	// Collect all unique values for the tag key from presets
	const values = new Set<string>();

	// Iterate through all presets
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

	// Convert to array and sort
	return Array.from(values).sort();
}
