import { z } from "zod";
import type { OsmToolDefinition } from "../types/index.js";
import { schemaLoader } from "../utils/schema-loader.js";

/**
 * Get all tags (preset IDs) belonging to a specific category
 *
 * @param categoryName - Name of the category
 * @returns Array of preset IDs belonging to the category
 */
export async function getCategoryTags(categoryName: string): Promise<string[]> {
	const schema = await schemaLoader.loadSchema();

	// Get the category
	const category = schema.categories[categoryName];

	// Return members or empty array if category doesn't exist
	return category?.members || [];
}

/**
 * Tool definition for get_category_tags following new OsmToolDefinition interface
 *
 * Returns all preset IDs (tags) belonging to a specific category.
 */
const GetCategoryTags: OsmToolDefinition<{
	category: z.ZodString;
}> = {
	name: "get_category_tags" as const,

	config: () => ({
		description: "Get all tags (preset IDs) belonging to a specific category",
		inputSchema: {
			category: z.string().describe("Name of the category"),
		},
	}),

	handler: async (args, _extra) => {
		// Zod validates that category is present and is a string
		const { category } = args;

		const tags = await getCategoryTags(category);

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(tags, null, 2),
				},
			],
		};
	},
};

export default GetCategoryTags;
