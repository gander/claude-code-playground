import type { SchemaLoader } from "../utils/schema-loader.js";

/**
 * Get all tags (preset IDs) belonging to a specific category
 *
 * @param loader - Schema loader instance
 * @param categoryName - Name of the category
 * @returns Array of preset IDs belonging to the category
 */
export async function getCategoryTags(
	loader: SchemaLoader,
	categoryName: string,
): Promise<string[]> {
	const schema = await loader.loadSchema();

	// Get the category
	const category = schema.categories[categoryName];

	// Return members or empty array if category doesn't exist
	return category?.members || [];
}
