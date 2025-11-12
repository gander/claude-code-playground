import { z } from "zod";
import type { SchemaLoader } from "../utils/schema-loader.js";
import type { TagSearchResult } from "./types.js";

/**
 * Tool name
 */
export const name = "search_tags";

/**
 * Tool definition
 */
export const definition = {
	description: "Search for tags by keyword in tag keys, values, and preset names",
	inputSchema: {
		keyword: z.string().describe("Keyword to search for (case-insensitive)"),
		limit: z.number().optional().describe("Maximum number of results to return (default: 100)"),
	},
} as const;

/**
 * Handler for search_tags tool
 */
export async function handler(args: { keyword: string; limit?: number }, loader: SchemaLoader) {
	const schema = await loader.loadSchema();
	const keyword = args.keyword;
	const limit = args.limit;

	const results: TagSearchResult[] = [];
	const seen = new Set<string>(); // Track unique key-value pairs

	// Normalize keyword for case-insensitive search
	const normalizedKeyword = keyword.toLowerCase();

	// FIRST: Search through fields for matching tag keys
	// This finds keys like "wheelchair" that exist in fields.json but not in preset tags
	// Note: Field map keys are FILE PATHS (e.g., "toilets/wheelchair" → data/fields/toilets/wheelchair.json)
	// The actual OSM tag is in field.key property (e.g., "toilets:wheelchair")
	for (const [_fieldKey, field] of Object.entries(schema.fields)) {
		// Use the actual OSM tag key from field.key (with colon separator)
		// Some fields don't have a 'key' property, skip those
		if (!field.key) continue;

		const actualKey = field.key; // This is the real OSM tag (e.g., "parking:both")
		if (actualKey.toLowerCase().includes(normalizedKeyword)) {
			// If the field has predefined options, return them as search results
			if (field.options && Array.isArray(field.options)) {
				for (const option of field.options) {
					if (typeof option === "string") {
						const tagId = `${actualKey}=${option}`;
						if (!seen.has(tagId)) {
							seen.add(tagId);
							results.push({
								key: actualKey, // Use actual OSM key with colon
								value: option,
								presetName: undefined, // Field-based results don't have preset names
							});

							if (limit !== undefined && results.length >= limit) {
								return {
									content: [
										{
											type: "text" as const,
											text: JSON.stringify(results, null, 2),
										},
									],
									structuredContent: { results: results },
								};
							}
						}
					}
				}
			}
		}
	}

	// THEN: Search through all presets
	for (const [_presetId, preset] of Object.entries(schema.presets)) {
		// Check preset name
		const presetName = preset.name || "";
		const matchesPresetName = presetName.toLowerCase().includes(normalizedKeyword);

		// Check tags
		for (const [key, value] of Object.entries(preset.tags)) {
			const keyMatch = key.toLowerCase().includes(normalizedKeyword);
			const valueMatch =
				typeof value === "string" && value.toLowerCase().includes(normalizedKeyword);

			if (keyMatch || valueMatch || matchesPresetName) {
				// Skip wildcards and complex patterns
				if (value && value !== "*" && !value.includes("|")) {
					const tagId = `${key}=${value}`;
					if (!seen.has(tagId)) {
						seen.add(tagId);
						results.push({
							key,
							value,
							presetName: preset.name,
						});

						// Stop if we reached the limit (if limit is specified)
						if (limit !== undefined && results.length >= limit) {
							return {
								content: [
									{
										type: "text" as const,
										text: JSON.stringify(results, null, 2),
									},
								],
								structuredContent: { results: results },
							};
						}
					}
				}
			}
		}

		// Also check addTags
		if (preset.addTags) {
			for (const [key, value] of Object.entries(preset.addTags)) {
				const keyMatch = key.toLowerCase().includes(normalizedKeyword);
				const valueMatch =
					typeof value === "string" && value.toLowerCase().includes(normalizedKeyword);

				if (keyMatch || valueMatch || matchesPresetName) {
					if (value && value !== "*" && !value.includes("|")) {
						const tagId = `${key}=${value}`;
						if (!seen.has(tagId)) {
							seen.add(tagId);
							results.push({
								key,
								value,
								presetName: preset.name,
							});

							if (limit !== undefined && results.length >= limit) {
								return {
									content: [
										{
											type: "text" as const,
											text: JSON.stringify(results, null, 2),
										},
									],
									structuredContent: { results: results },
								};
							}
						}
					}
				}
			}
		}
	}

	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(results, null, 2),
			},
		],
		structuredContent: { results: results },
	};
}
