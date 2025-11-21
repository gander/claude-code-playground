import { z } from "zod";
import type { OsmToolDefinition } from "../types/index.js";
import { parseTagInput } from "../utils/tag-parser.js";

/**
 * Convert OSM tags from flat text format (key=value per line) to JSON object
 *
 * Supports:
 * - Multiple line endings (LF, CRLF, CR)
 * - Comments (lines starting with #)
 * - Empty lines (skipped)
 * - Whitespace trimming
 * - Equals signs in values
 *
 * @param input - Flat text format with key=value per line
 * @returns JSON object with tags
 * @throws Error if input format is invalid or if any value is empty
 */
export function flatToJson(input: string): Record<string, string> {
	// Use existing parseTagInput which handles text format
	const tags = parseTagInput(input);

	// Validate that no values are empty
	for (const [key, value] of Object.entries(tags)) {
		if (value === "") {
			throw new Error(`Tag value cannot be empty for key "${key}"`);
		}
	}

	return tags;
}

const FlatToJson: OsmToolDefinition<{
	tags: z.ZodString;
}> = {
	name: "flat_to_json" as const,
	config: () => ({
		description:
			"**INPUT CONVERTER**: Use this tool FIRST when user provides OSM tags in flat text format (key=value per line). Converts flat format to JSON object that can be used by other tools (validate_tag, search_tags, etc.). All other tools expect JSON input. Supports comments (#), empty lines, and various line endings.",
		inputSchema: {
			tags: z
				.string()
				.describe(
					'Tags in flat text format with key=value per line. Example: "amenity=restaurant\\nname=Test"',
				),
		},
	}),
	handler: async ({ tags }, _extra) => {
		try {
			const result = flatToJson(tags);
			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		} catch (error) {
			// Return error message in structured format
			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(
							{
								error: error instanceof Error ? error.message : String(error),
							},
							null,
							2,
						),
					},
				],
				isError: true,
			};
		}
	},
};

export default FlatToJson;
