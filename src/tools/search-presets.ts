import { z } from "zod";
import type { GeometryType } from "../types/index.js";
import type { SchemaLoader } from "../utils/schema-loader.js";
import type { PresetSearchResult } from "./types.js";

/**
 * Tool name
 */
export const name = "search_presets";

/**
 * Tool definition
 */
export const definition = {
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
} as const;

/**
 * Handler for search_presets tool
 */
export async function handler(
	args: {
		keyword: string;
		limit?: number;
		geometry?: GeometryType;
	},
	loader: SchemaLoader,
) {
	const schema = await loader.loadSchema();
	const keyword = args.keyword;
	const limit = args.limit;
	const geometry = args.geometry;

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
		if (matches && geometry) {
			if (!preset.geometry.includes(geometry)) {
				matches = false;
			}
		}

		// Add to results if matches
		if (matches) {
			results.push({
				id: presetId,
				tags: preset.tags,
				geometry: preset.geometry,
			});

			// Stop if we reached the limit
			if (limit !== undefined && results.length >= limit) {
				break;
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
		structuredContent: { presets: results },
	};
}
