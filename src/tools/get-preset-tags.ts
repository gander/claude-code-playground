import { z } from "zod";
import type { OsmToolDefinition } from "../types/index.js";
import { schemaLoader } from "../utils/schema-loader.js";
import type { PresetTags } from "./types.js";

/**
 * Get recommended tags for a specific preset
 *
 * @param presetId - The preset ID to get tags for (e.g., "amenity/restaurant")
 * @returns Preset tags including identifying tags and optional addTags
 * @throws Error if preset is not found
 */
export async function getPresetTags(presetId: string): Promise<PresetTags> {
	const schema = await schemaLoader.loadSchema();

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
const GetPresetTags: OsmToolDefinition<{ presetId: z.ZodString }> = {
	name: "get_preset_tags" as const,
	config: () => ({
		description:
			"Get recommended tags for a specific preset. Returns identifying tags and additional recommended tags.",
		inputSchema: {
			presetId: z.string().describe("The preset ID to get tags for (e.g., 'amenity/restaurant')"),
		},
	}),
	handler: async ({ presetId }, _extra) => {
		const tags = await getPresetTags(presetId);
		return {
			content: [{ type: "text" as const, text: JSON.stringify(tags, null, 2) }],
		};
	},
};

export default GetPresetTags;
