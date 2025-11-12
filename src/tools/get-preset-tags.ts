import { z } from "zod";
import type { SchemaLoader } from "../utils/schema-loader.js";
import type { PresetTags } from "./types.js";

/**
 * Tool name
 */
export const name = "get_preset_tags";

/**
 * Tool definition
 */
export const definition = {
	description:
		"Get recommended tags for a specific preset. Returns identifying tags and additional recommended tags.",
	inputSchema: {
		presetId: z.string().describe("The preset ID to get tags for (e.g., 'amenity/restaurant')"),
	},
} as const;

/**
 * Handler for get_preset_tags tool
 */
export async function handler(args: { presetId: string }, loader: SchemaLoader) {
	const schema = await loader.loadSchema();
	const presetId = args.presetId;

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

	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(result, null, 2),
			},
		],
		structuredContent: result,
	};
}
