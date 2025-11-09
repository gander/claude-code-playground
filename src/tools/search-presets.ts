import type { GeometryType } from "../types/index.js";
import type { SchemaLoader } from "../utils/schema-loader.js";
import type { PresetSearchResult } from "./types.js";

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
 * @param loader - Schema loader instance
 * @param keyword - Keyword to search for in preset IDs and tags
 * @param options - Optional search options (limit, geometry filter)
 * @returns Array of matching presets with id, tags, and geometry
 */
export async function searchPresets(
	loader: SchemaLoader,
	keyword: string,
	options?: SearchPresetsOptions,
): Promise<PresetSearchResult[]> {
	const schema = await loader.loadSchema();
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
			results.push({
				id: presetId,
				tags: preset.tags,
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
