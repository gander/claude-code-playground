import type { OsmToolDefinition } from "../types/index.js";
import { schemaLoader } from "../utils/schema-loader.js";
import type { CategoryInfo } from "./types.js";

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
 * Tool definition for get_categories following new OsmToolDefinition interface
 *
 * Returns all available tag categories with counts of presets in each category,
 * sorted by name.
 */
const GetCategories: OsmToolDefinition = {
	name: "get_categories" as const,

	config: () => ({
		description:
			"Get all available tag categories with counts of presets in each category, sorted by name",
		inputSchema: {}, // Empty object for tools with no parameters
	}),

	handler: async (_args, _extra) => {
		const categories = await getCategories();

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(categories, null, 2),
				},
			],
		};
	},
};

export default GetCategories;
