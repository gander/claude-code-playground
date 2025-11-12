import { schemaLoader } from "../utils/schema-loader.js";
import type { RelatedTag } from "./types.js";

/**
 * Tool definition for get_related_tags
 */
export const definition = {
	name: "get_related_tags",
	description:
		"Find tags commonly used together with a given tag. Returns tags sorted by frequency (how often they appear together).",
	inputSchema: {
		type: "object" as const,
		properties: {
			tag: {
				type: "string",
				description:
					"Tag to find related tags for (format: 'key' or 'key=value', e.g., 'amenity' or 'amenity=restaurant')",
			},
			limit: {
				type: "number",
				description: "Maximum number of results to return (optional)",
			},
		},
		required: ["tag"],
	},
};

/**
 * Find tags commonly used together with a given tag
 *
 * @param tag - Tag to find related tags for (format: "key" or "key=value")
 * @param limit - Maximum number of results to return (optional)
 * @returns Array of related tags sorted by frequency (descending)
 */
export async function getRelatedTags(tag: string, limit?: number): Promise<RelatedTag[]> {
	const schema = await schemaLoader.loadSchema();

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
	const results: RelatedTag[] = Array.from(relatedTags.entries())
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
		return results.slice(0, limit);
	}

	return results;
}

/**
 * Handler for get_related_tags tool
 */
export async function handler(args: unknown) {
	const { tag, limit } = args as { tag?: string; limit?: number };
	if (!tag) {
		throw new Error("tag parameter is required");
	}
	const results = await getRelatedTags(tag, limit);
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(results, null, 2),
			},
		],
	};
}
