import { z } from "zod";
import type { SchemaLoader } from "../utils/schema-loader.js";
import type { TagInfo } from "./types.js";

/**
 * Tool definition for get_tag_info
 */
export const definition = {
	name: "get_tag_info",
	description:
		"Get comprehensive information about a specific tag key, including all possible values, type, and field definition status",
	inputSchema: {
		tagKey: z.string().describe("The tag key to get information for (e.g., 'parking', 'amenity')"),
	},
} as const;

/**
 * Get comprehensive information about a specific tag key
 *
 * @param loader - Schema loader instance
 * @param tagKey - The tag key to get information for (e.g., "parking", "amenity")
 * @returns Tag information including all possible values, type, and field definition status
 */
export async function getTagInfo(loader: SchemaLoader, tagKey: string): Promise<TagInfo> {
	const schema = await loader.loadSchema();

	// Collect all unique values for the tag key
	const values = new Set<string>();
	let hasFieldDefinition = false;
	let fieldType: string | undefined;
	let actualKey = tagKey; // The actual OSM key (with colon)

	// First, check fields for predefined options and metadata
	// Field map keys are FILE PATHS with slash (e.g., "toilets/wheelchair" → data/fields/toilets/wheelchair.json)
	// To look up a field, convert OSM tag key's colons to slashes
	const fieldKeyLookup = tagKey.replace(/:/g, "/");
	const field = schema.fields[fieldKeyLookup];
	if (field) {
		hasFieldDefinition = true;
		fieldType = field.type;
		// Use the actual OSM tag key from field.key (e.g., "parking:both" not "parking/side/parking")
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

/**
 * Handler for get_tag_info tool
 */
export async function handler(args: { tagKey: string }, loader: SchemaLoader) {
	const info = await getTagInfo(loader, args.tagKey);
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(info, null, 2),
			},
		],
		structuredContent: info,
	};
}
