import type { SchemaLoader } from "../utils/schema-loader.js";

/**
 * Schema statistics interface
 */
export interface SchemaStats {
	presetCount: number;
	fieldCount: number;
	categoryCount: number;
	deprecatedCount: number;
}

/**
 * Category information interface
 */
export interface CategoryInfo {
	name: string;
	count: number;
}

/**
 * Get statistics about the OSM tagging schema
 *
 * @param loader - Schema loader instance
 * @returns Schema statistics including counts of presets, fields, categories, and deprecated items
 */
export async function getSchemaStats(loader: SchemaLoader): Promise<SchemaStats> {
	const schema = await loader.loadSchema();

	return {
		presetCount: Object.keys(schema.presets).length,
		fieldCount: Object.keys(schema.fields).length,
		categoryCount: Object.keys(schema.categories).length,
		deprecatedCount: schema.deprecated.length,
	};
}

/**
 * Get all tag categories with counts of presets in each category
 *
 * @param loader - Schema loader instance
 * @returns Array of categories sorted by name, each with name and preset count
 */
export async function getCategories(loader: SchemaLoader): Promise<CategoryInfo[]> {
	const schema = await loader.loadSchema();

	// Create array of categories with counts
	const categories: CategoryInfo[] = Object.entries(schema.categories).map(
		([name, category]) => ({
			name,
			count: category.members?.length || 0,
		}),
	);

	// Sort by name
	return categories.sort((a, b) => a.name.localeCompare(b.name));
}
