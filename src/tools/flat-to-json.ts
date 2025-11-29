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
			"**INPUT CONVERTER**: Convert OpenStreetMap tags from human-friendly flat text format (one key=value pair per line) into JSON object format required by other MCP tools. This is a preprocessing tool - use it FIRST when users provide tags as text before passing the result to validation, search, or analysis tools. All other tools in this MCP server expect JSON input, so this converter is essential for text-based workflows. The parser is robust and flexible: it handles multiple line ending formats (LF/CRLF/CR), supports comments (lines starting with #), ignores empty lines, trims whitespace, and correctly handles equals signs within values. Returns a validated JSON object with all tags, or an error if any tag is malformed or has an empty value.",
		inputSchema: {
			tags: z
				.string()
				.describe(
					'OpenStreetMap tags in flat text format with one key=value pair per line. Each line should contain exactly one tag in the format "key=value". Supports comment lines (starting with #) which are ignored, empty lines (skipped), and various line endings (LF, CRLF, CR). If a value contains an equals sign, only the first = is treated as the separator. Example: "amenity=restaurant\\nname=Test Cafe\\ncuisine=italian\\n# This is a comment\\nopening_hours=Mo-Su 10:00-22:00". All keys and values are trimmed of whitespace. Empty values will cause an error.',
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
