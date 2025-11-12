import type { SchemaLoader } from "../utils/schema-loader.js";

/**
 * Tool name
 */
export const name = "get_tag_values";

/**
 * Tool definition for get_tag_values
 */
export const definition = {
	description: "Get all possible values for a given tag key (e.g., all values for 'amenity' tag)",
	inputSchema: {
		type: "object" as const,
		properties: {
			tagKey: {
				type: "string",
				description: "The tag key to get values for (e.g., 'amenity', 'building')",
			},
		},
		required: ["tagKey"],
	},
};

/**
 * Get all possible values for a given tag key
 *
 * @param loader - Schema loader instance
 * @param tagKey - The tag key to get values for (e.g., "amenity", "building")
 * @returns Array of unique values for the tag key, sorted alphabetically
 */
export async function getTagValues(loader: SchemaLoader, tagKey: string): Promise<string[]> {
	const schema = await loader.loadSchema();

	// Collect all unique values for the tag key
	const values = new Set<string>();

	// First, check fields for predefined options
	// Field map keys are FILE PATHS with slash (e.g., "toilets/wheelchair" → data/fields/toilets/wheelchair.json)
	// To look up a field, convert OSM tag key's colons to slashes
	const fieldKeyLookup = tagKey.replace(/:/g, "/");
	const field = schema.fields[fieldKeyLookup];
	let actualKey = tagKey; // The actual OSM key (with colon)

	if (field) {
		// Use the actual OSM tag key from field.key (e.g., "parking:both" not "parking/side/parking")
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

/**
 * Handler for get_tag_values tool
 */
export const handler = (schemaLoader: SchemaLoader) => {
	return async (args: unknown) => {
		const { tagKey } = args as { tagKey?: string };
		if (!tagKey) {
			throw new Error("tagKey parameter is required");
		}
		const values = await getTagValues(schemaLoader, tagKey);
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(values, null, 2),
				},
			],
		};
	};
};
