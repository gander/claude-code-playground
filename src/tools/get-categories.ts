import { schemaLoader } from "../utils/schema-loader.js";
import type { CategoryInfo } from "./types.js";

/**
 * Tool definition for get_categories
 */
export const definition = {
	name: "get_categories",
	description:
		"Get all available tag categories with counts of presets in each category, sorted by name",
	inputSchema: {
		type: "object" as const,
		properties: {},
		required: [],
	},
};

/**
 * Get all tag categories with counts of presets in each category
 *
 * @returns Array of categories sorted by name, each with name and preset count
 */
export async function getCategories(): Promise<CategoryInfo[]> {
	const schema = await schemaLoader.loadSchema();

	// Create array of categories with counts
	const categories: CategoryInfo[] = Object.entries(schema.categories).map(([name, category]) => ({
		name,
		count: category.members?.length || 0,
	}));

	// Sort by name
	return categories.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Handler for get_categories tool
 */
export async function handler(_args: unknown) {
	const categories = await getCategories();
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(categories, null, 2),
			},
		],
	};
}
