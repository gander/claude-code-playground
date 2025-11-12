import { z } from "zod";
import type { SchemaLoader } from "../utils/schema-loader.js";

/**
 * Tool definition for get_category_tags
 */
export const definition = {
	name: "get_category_tags",
	description: "Get all tags (preset IDs) belonging to a specific category",
	inputSchema: {
		category: z.string().describe("Name of the category"),
	},
} as const;

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

/**
 * Handler for get_category_tags tool
 */
export async function handler(args: unknown, loader: SchemaLoader) {
	const { logger } = await import("../utils/logger.js");
	logger.debug("Tool call: get_category_tags", "MCPServer");
	try {
		const category = (args as { category?: string }).category;
		if (!category) {
			throw new Error("category parameter is required");
		}
		const tags = await getCategoryTags(loader, category);
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(tags, null, 2),
				},
			],
		};
	} catch (error) {
		logger.error(
			"Error executing tool: get_category_tags",
			"MCPServer",
			error instanceof Error ? error : new Error(String(error)),
		);
		throw error;
	}
}
