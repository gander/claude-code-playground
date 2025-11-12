import { z } from "zod";
import type { SchemaLoader } from "../utils/schema-loader.js";
import type { PresetDetails } from "./types.js";

/**
 * Tool definition for get_preset_details
 */
export const definition = {
	name: "get_preset_details",
	description:
		"Get complete details for a specific preset including tags, geometry, fields, and metadata",
	inputSchema: {
		presetId: z.string().describe("The preset ID to get details for (e.g., 'amenity/restaurant')"),
	},
} as const;

/**
 * Get complete details for a specific preset
 *
 * @param loader - Schema loader instance
 * @param presetId - The preset ID to get details for (e.g., "amenity/restaurant")
 * @returns Complete preset details including tags, geometry, fields, and metadata
 * @throws Error if preset is not found
 */
export async function getPresetDetails(
	loader: SchemaLoader,
	presetId: string,
): Promise<PresetDetails> {
	const schema = await loader.loadSchema();

	// Look up the preset
	const preset = schema.presets[presetId];

	if (!preset) {
		throw new Error(`Preset "${presetId}" not found`);
	}

	// Build the result with all available properties
	const result: PresetDetails = {
		id: presetId,
		tags: preset.tags,
		geometry: preset.geometry,
	};

	// Add optional properties if they exist
	if (preset.name) {
		result.name = preset.name;
	}

	if (preset.fields) {
		result.fields = preset.fields;
	}

	if (preset.moreFields) {
		result.moreFields = preset.moreFields;
	}

	if (preset.icon) {
		result.icon = preset.icon;
	}

	return result;
}

/**
 * Handler for get_preset_details tool
 */
export async function handler(args: { presetId: string }, loader: SchemaLoader) {
	const details = await getPresetDetails(loader, args.presetId);
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(details, null, 2),
			},
		],
		structuredContent: details,
	};
}
