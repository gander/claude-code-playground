import type { SchemaLoader } from "../utils/schema-loader.js";
import type { TagSearchResult } from "./types.js";

/**
 * Search for tags by keyword
 *
 * @param loader - Schema loader instance
 * @param keyword - Keyword to search for in tag keys, values, and preset names
 * @param limit - Maximum number of results to return (default: 100)
 * @returns Array of matching tags with key, value, and optional preset name
 */
export async function searchTags(
	loader: SchemaLoader,
	keyword: string,
	limit = 100,
): Promise<TagSearchResult[]> {
	const schema = await loader.loadSchema();
	const results: TagSearchResult[] = [];
	const seen = new Set<string>(); // Track unique key-value pairs

	// Normalize keyword for case-insensitive search
	const normalizedKeyword = keyword.toLowerCase();

	// Search through all presets
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

						// Stop if we reached the limit
						if (results.length >= limit) {
							return results;
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

							if (results.length >= limit) {
								return results;
							}
						}
					}
				}
			}
		}
	}

	return results;
}
