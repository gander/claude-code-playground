import { z } from "zod";
import type { OsmToolDefinition } from "../types/index.js";
import { schemaLoader } from "../utils/schema-loader.js";
import type { TagInfo, ValueInfo } from "./types.js";

/**
 * Get comprehensive information about a specific tag key
 *
 * @param tagKey - The tag key to get information for (e.g., "parking", "amenity")
 * @returns Tag information including all possible values with localized titles/descriptions, type, and field definition status
 */
export async function getTagInfo(tagKey: string): Promise<TagInfo> {
	const schema = await schemaLoader.loadSchema();

	// Collect all unique values for the tag key
	const valueKeys = new Set<string>();
	let hasFieldDefinition = false;
	let fieldType: string | undefined;
	let actualKey = tagKey; // The actual OSM key (with colon)
	let fieldName: string | undefined;

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
					valueKeys.add(option);
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
				valueKeys.add(value);
			}
		}

		// Also check addTags if present
		if (preset.addTags?.[actualKey]) {
			const value = preset.addTags[actualKey];
			if (value && value !== "*" && !value.includes("|")) {
				valueKeys.add(value);
			}
		}
	}

	// Get translations for field label and value titles/descriptions
	const fieldStrings = (schema.translations as Record<string, any>)?.en?.presets?.fields?.[
		fieldKeyLookup
	];
	if (fieldStrings) {
		fieldName = fieldStrings.label as string | undefined;
	}

	// Build structured values with translations
	const values: Record<string, ValueInfo> = {};
	const sortedValueKeys = Array.from(valueKeys).sort();

	for (const valueKey of sortedValueKeys) {
		// Get translation for this value from field options
		const translationValue = fieldStrings?.options?.[valueKey];

		if (typeof translationValue === "string") {
			// Simple string title
			values[valueKey] = { title: translationValue };
		} else if (typeof translationValue === "object" && translationValue !== null) {
			// Object with title and description
			values[valueKey] = {
				title: translationValue.title as string,
				description: translationValue.description as string | undefined,
			};
		} else {
			// Fallback: use value key as title if no translation
			values[valueKey] = { title: valueKey };
		}
	}

	// Return tag information with the actual OSM key (with colon)
	return {
		key: actualKey,
		name: fieldName,
		values,
		type: fieldType,
		hasFieldDefinition,
	};
}

/**
 * Tool definition for get_tag_info following new OsmToolDefinition interface
 *
 * Returns comprehensive information about a specific tag key including all possible values,
 * type, and field definition status.
 */
const GetTagInfo: OsmToolDefinition<{
	tagKey: z.ZodString;
}> = {
	name: "get_tag_info" as const,

	config: () => ({
		description:
			"Get comprehensive information about a specific tag key, including all possible values, type, and field definition status",
		inputSchema: {
			tagKey: z
				.string()
				.describe("The tag key to get information for (e.g., 'parking', 'amenity')"),
		},
	}),

	handler: async ({ tagKey }, _extra) => {
		const info = await getTagInfo(tagKey);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(info, null, 2),
				},
			],
		};
	},
};

export default GetTagInfo;
