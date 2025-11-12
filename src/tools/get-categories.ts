import type { SchemaLoader } from "../utils/schema-loader.js";
import type { CategoryInfo } from "./types.js";

/**
 * Tool name
 */
export const name = "get_categories";

/**
 * Tool definition
 */
export const definition = {
	description:
		"Get all available tag categories with counts of presets in each category, sorted by name",
	inputSchema: {},
} as const;

/**
 * Handler for get_categories tool
 */
export async function handler(_args: unknown, loader: SchemaLoader) {
	const schema = await loader.loadSchema();

	// Create array of categories with counts
	const categories: CategoryInfo[] = Object.entries(schema.categories).map(([name, category]) => ({
		name,
		count: category.members?.length || 0,
	}));

	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(
					categories.sort((a, b) => a.name.localeCompare(b.name)),
					null,
					2,
				),
			},
		],
	};
}
