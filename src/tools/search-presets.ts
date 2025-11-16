import { z } from "zod";
import type { GeometryType, OsmToolDefinition } from "../types/index.js";
import { schemaLoader } from "../utils/schema-loader.js";
import type { PresetSearchResult, TagDetailed } from "./types.js";

/**
 * Options for searching presets
 */
export interface SearchPresetsOptions {
	limit?: number;
	geometry?: GeometryType;
}

/**
 * Search for presets by keyword or tag
 *
 * @param keyword - Keyword to search for in preset IDs and tags
 * @param options - Optional search options (limit, geometry filter)
 * @returns Array of matching presets with id, tags, and geometry
 */
export async function searchPresets(
	keyword: string,
	options?: SearchPresetsOptions,
): Promise<PresetSearchResult[]> {
	const schema = await schemaLoader.loadSchema();
	const results: PresetSearchResult[] = [];

	// Normalize keyword for case-insensitive search
	const normalizedKeyword = keyword.toLowerCase();

	// Check if searching by tag (contains "=")
	const isTagSearch = normalizedKeyword.includes("=");
	let searchKey: string | undefined;
	let searchValue: string | undefined;

	if (isTagSearch) {
		const parts = normalizedKeyword.split("=");
		searchKey = parts[0];
		searchValue = parts[1];
	}

	// Search through all presets
	for (const [presetId, preset] of Object.entries(schema.presets)) {
		let matches = false;

		if (isTagSearch) {
			// Tag-based search: exact match on key and value
			if (searchKey && searchValue) {
				const tagValue = preset.tags[searchKey];
				if (tagValue?.toLowerCase() === searchValue) {
					matches = true;
				}
			}
		} else {
			// Keyword search: search in preset ID
			if (presetId.toLowerCase().includes(normalizedKeyword)) {
				matches = true;
			}

			// Also search in tag keys and values
			if (!matches) {
				for (const [key, value] of Object.entries(preset.tags)) {
					if (
						key.toLowerCase().includes(normalizedKeyword) ||
						(typeof value === "string" && value.toLowerCase().includes(normalizedKeyword))
					) {
						matches = true;
						break;
					}
				}
			}
		}

		// Apply geometry filter if specified
		if (matches && options?.geometry) {
			if (!preset.geometry.includes(options.geometry)) {
				matches = false;
			}
		}

		// Add to results if matches
		if (matches) {
			// Get localized preset name
			const name = schemaLoader.getPresetName(presetId);

			// Build tagsDetailed with localized names
			const tagsDetailed: TagDetailed[] = Object.entries(preset.tags).map(([key, value]) => {
				// Get localized key name using tag key deduction (NOT field label!)
				const keyName = schemaLoader.getTagKeyName(key);

				// Get localized value name from presets first, then field options
				let valueName: string;
				if (value === "*") {
					// For wildcard values, use asterisk as-is
					valueName = "*";
				} else {
					// Use getTagValueName() which checks presets first
					valueName = schemaLoader.getTagValueName(key, value);
				}

				return {
					key,
					keyName,
					value,
					valueName,
				};
			});

			results.push({
				id: presetId,
				name,
				tags: preset.tags,
				tagsDetailed,
				geometry: preset.geometry,
			});

			// Stop if we reached the limit
			if (options?.limit !== undefined && results.length >= options.limit) {
				break;
			}
		}
	}

	return results;
}

/**
 * Tool definition for search_presets following new OsmToolDefinition interface
 */
const SearchPresets: OsmToolDefinition<{
	keyword: z.ZodString;
	limit: z.ZodOptional<z.ZodNumber>;
	geometry: z.ZodOptional<z.ZodEnum<["point", "vertex", "line", "area", "relation"]>>;
}> = {
	name: "search_presets" as const,

	config: () => ({
		description:
			"Search for presets by keyword or tag. Searches preset IDs and tags. Supports filtering by geometry type and limiting results.",
		inputSchema: {
			keyword: z
				.string()
				.describe(
					"Keyword to search for in preset IDs and tags (case-insensitive). Can be a simple keyword (e.g., 'restaurant') or a tag (e.g., 'amenity=restaurant')",
				),
			limit: z.number().optional().describe("Maximum number of results to return (optional)"),
			geometry: z
				.enum(["point", "vertex", "line", "area", "relation"])
				.optional()
				.describe("Filter by geometry type (point, vertex, line, area, relation) - optional"),
		},
	}),

	handler: async ({ keyword, limit, geometry }, _extra) => {
		const results = await searchPresets(keyword.trim(), { limit, geometry });

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(results, null, 2),
				},
			],
		};
	},
};

export default SearchPresets;
