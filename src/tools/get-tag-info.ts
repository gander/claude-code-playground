import { z } from "zod";
import type { OsmToolDefinition } from "../types/index.js";
import { schemaLoader } from "../utils/schema-loader.js";
import { getTagValues } from "./get-tag-values.js";
import type { TagInfo } from "./types.js";

/**
 * Get comprehensive information about a specific tag key
 *
 * @param tagKey - The tag key to get information for (e.g., "parking", "amenity")
 * @returns Tag information including all possible values with localized names/descriptions, type, and field definition status
 */
export async function getTagInfo(tagKey: string): Promise<TagInfo> {
	const schema = await schemaLoader.loadSchema();

	let hasFieldDefinition = false;
	let fieldType: string | undefined;
	let actualKey = tagKey; // The actual OSM key (with colon)
	let name: string | undefined;

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
	}

	// Get values using getTagValues to avoid code duplication
	const values = await getTagValues(tagKey);

	// Find a representative preset that uses this field/tag key to get the name
	// Look for presets that list this key in their fields array OR have it in tags
	// Prefer presets with fewer tags (more general/parent presets)
	// biome-ignore lint/suspicious/noExplicitAny: translations structure is dynamic and deeply nested
	const presetTranslations = (schema.translations as Record<string, any>)?.en?.presets?.presets;
	let selectedPreset: { id: string; tagCount: number } | null = null;

	for (const [presetId, preset] of Object.entries(schema.presets)) {
		// Check if preset has this key in fields array OR in tags
		const hasInFields =
			preset.fields?.includes(actualKey) || preset.fields?.includes(fieldKeyLookup);
		const hasInTags = actualKey in preset.tags;

		if (hasInFields || hasInTags) {
			const tagCount = Object.keys(preset.tags).length;
			// Select preset with fewest tags (most general)
			if (!selectedPreset || tagCount < selectedPreset.tagCount) {
				selectedPreset = { id: presetId, tagCount };
			}
		}
	}

	// Get preset name from translations if found
	if (selectedPreset && presetTranslations) {
		name = presetTranslations[selectedPreset.id]?.name as string | undefined;
	}

	// Fallback to field label if no preset name found
	if (!name) {
		// biome-ignore lint/suspicious/noExplicitAny: translations structure is dynamic and deeply nested
		const fieldStrings = (schema.translations as Record<string, any>)?.en?.presets?.fields?.[
			fieldKeyLookup
		];
		name = fieldStrings?.label as string | undefined;
	}

	// Return tag information with the actual OSM key (with colon)
	return {
		key: actualKey,
		name,
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
