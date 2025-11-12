import type { SchemaLoader } from "../utils/schema-loader.js";
import type { PresetTags } from "./types.js";

/**
 * Tool definition for get_preset_tags
 */
export const definition = {
	name: "get_preset_tags",
	description:
		"Get recommended tags for a specific preset. Returns identifying tags and additional recommended tags.",
	inputSchema: {
		type: "object" as const,
		properties: {
			presetId: {
				type: "string",
				description: "The preset ID to get tags for (e.g., 'amenity/restaurant')",
			},
		},
		required: ["presetId"],
	},
};

/**
 * Get recommended tags for a specific preset
 *
 * @param loader - Schema loader instance
 * @param presetId - The preset ID to get tags for (e.g., "amenity/restaurant")
 * @returns Preset tags including identifying tags and optional addTags
 * @throws Error if preset is not found
 */
export async function getPresetTags(loader: SchemaLoader, presetId: string): Promise<PresetTags> {
	const schema = await loader.loadSchema();

	// Look up the preset
	const preset = schema.presets[presetId];

	if (!preset) {
		throw new Error(`Preset "${presetId}" not found`);
	}

	// Build the result
	const result: PresetTags = {
		tags: preset.tags,
	};

	// Add addTags if they exist and are non-empty
	if (preset.addTags && Object.keys(preset.addTags).length > 0) {
		result.addTags = preset.addTags;
	}

	return result;
}

/**
 * Handler for get_preset_tags tool
 */
export async function handler(loader: SchemaLoader, args: unknown) {
	const presetId = (args as { presetId?: string }).presetId;
	if (!presetId) {
		throw new Error("presetId parameter is required");
	}
	const tags = await getPresetTags(loader, presetId);
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(tags, null, 2),
			},
		],
	};
}
