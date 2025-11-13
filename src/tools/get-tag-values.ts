import { z } from "zod";
import type { OsmToolDefinition } from "../types/index.js";
import { schemaLoader } from "../utils/schema-loader.js";
import type { ValueInfo } from "./types.js";

/**
 * Get all possible values for a given tag key with localized titles and descriptions
 *
 * @param tagKey - The tag key to get values for (e.g., "amenity", "building")
 * @returns Object mapping value keys to localized titles and descriptions
 */
export async function getTagValues(tagKey: string): Promise<Record<string, ValueInfo>> {
	const schema = await schemaLoader.loadSchema();

	// Collect all unique values for the tag key
	const valueKeys = new Set<string>();

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

	// Get translations for value titles/descriptions
	// biome-ignore lint/suspicious/noExplicitAny: translations structure is dynamic and deeply nested
	const fieldStrings = (schema.translations as Record<string, any>)?.en?.presets?.fields?.[
		fieldKeyLookup
	];

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

	return values;
}

/**
 * Tool definition for get_tag_values following new OsmToolDefinition interface
 *
 * Returns all possible values for a given tag key.
 */
const GetTagValues: OsmToolDefinition<{
	tagKey: z.ZodString;
}> = {
	name: "get_tag_values" as const,

	config: () => ({
		description: "Get all possible values for a given tag key (e.g., all values for 'amenity' tag)",
		inputSchema: {
			tagKey: z.string().describe("The tag key to get values for (e.g., 'amenity', 'building')"),
		},
	}),

	handler: async ({ tagKey }, _extra) => {
		const values = await getTagValues(tagKey);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(values, null, 2),
				},
			],
		};
	},
};

export default GetTagValues;
