import { z } from "zod";
import type { SchemaLoader } from "../utils/schema-loader.js";

/**
 * Tool name
 */
export const name = "get_category_tags";

/**
 * Tool definition
 */
export const definition = {
	description: "Get all tags (preset IDs) belonging to a specific category",
	inputSchema: {
		category: z.string().describe("Name of the category"),
	},
} as const;

/**
 * Handler for get_category_tags tool
 */
export async function handler(args: { category: string }, loader: SchemaLoader) {
	const schema = await loader.loadSchema();
	const categoryName = args.category;

	// Get the category
	const category = schema.categories[categoryName];

	// Return members or empty array if category doesn't exist
	const tags = category?.members || [];

	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(tags, null, 2),
			},
		],
		structuredContent: { tags },
	};
}
