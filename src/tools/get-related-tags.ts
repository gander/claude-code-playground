import { z } from "zod";
import type { SchemaLoader } from "../utils/schema-loader.js";
import type { RelatedTag } from "./types.js";

/**
 * Tool name
 */
export const name = "get_related_tags";

/**
 * Tool definition
 */
export const definition = {
	description:
		"Find tags commonly used together with a given tag. Returns tags sorted by frequency (how often they appear together).",
	inputSchema: {
		tag: z
			.string()
			.describe(
				"Tag to find related tags for (format: 'key' or 'key=value', e.g., 'amenity' or 'amenity=restaurant')",
			),
		limit: z.number().optional().describe("Maximum number of results to return (optional)"),
	},
} as const;

/**
 * Handler for get_related_tags tool
 */
export async function handler(args: { tag: string; limit?: number }, loader: SchemaLoader) {
	const schema = await loader.loadSchema();
	const tag = args.tag;
	const limit = args.limit;

	// Parse the input tag
	const [inputKey, inputValue] = tag.includes("=") ? tag.split("=", 2) : [tag, undefined];

	// Track related tags and their frequencies
	const relatedTags = new Map<string, { count: number; presets: string[] }>();

	// Find all presets that contain the input tag
	for (const [_presetId, preset] of Object.entries(schema.presets)) {
		let hasInputTag = false;

		// Check if preset has the input tag
		if (inputValue !== undefined) {
			// Looking for specific key=value
			hasInputTag =
				preset.tags?.[inputKey] === inputValue || preset.addTags?.[inputKey] === inputValue;
		} else {
			// Looking for any preset with this key
			hasInputTag =
				preset.tags?.[inputKey] !== undefined || preset.addTags?.[inputKey] !== undefined;
		}

		if (!hasInputTag) {
			continue;
		}

		// Collect all other tags from this preset
		const allTags = { ...preset.tags, ...preset.addTags };

		for (const [key, value] of Object.entries(allTags)) {
			// Skip wildcards and complex patterns
			if (typeof value !== "string" || value === "*" || value.includes("|")) {
				continue;
			}

			// Skip the input tag itself
			if (key === inputKey && value === inputValue) {
				continue;
			}
			if (key === inputKey && inputValue === undefined) {
				continue;
			}

			// Create tag identifier
			const tagId = `${key}=${value}`;

			// Track this related tag
			const existing = relatedTags.get(tagId);
			if (existing) {
				existing.count++;
				if (existing.presets.length < 3 && preset.name) {
					// Keep up to 3 example preset names
					existing.presets.push(preset.name);
				}
			} else {
				relatedTags.set(tagId, {
					count: 1,
					presets: preset.name ? [preset.name] : [],
				});
			}
		}
	}

	// Convert to array and sort by frequency
	let results: RelatedTag[] = Array.from(relatedTags.entries())
		.map(([tagId, data]) => {
			const parts = tagId.split("=", 2);
			const key = parts[0] || "";
			const value = parts[1];
			return {
				key,
				value: value || undefined,
				frequency: data.count,
				presetExamples: data.presets.length > 0 ? data.presets : undefined,
			};
		})
		.sort((a, b) => b.frequency - a.frequency);

	// Apply limit if specified
	if (limit !== undefined) {
		results = results.slice(0, limit);
	}

	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(results, null, 2),
			},
		],
		structuredContent: { relatedTags: results },
	};
}
