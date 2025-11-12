import type { SchemaLoader } from "../utils/schema-loader.js";
import type { SchemaStats } from "./types.js";

/**
 * Tool name
 */
export const name = "get_schema_stats";

/**
 * Tool definition
 */
export const definition = {
	description:
		"Get statistics about the OpenStreetMap tagging schema, including counts of presets, fields, categories, and deprecated items",
	inputSchema: {},
} as const;

/**
 * Handler for get_schema_stats tool
 */
export async function handler(_args: unknown, loader: SchemaLoader) {
	const schema = await loader.loadSchema();

	const stats: SchemaStats = {
		presetCount: Object.keys(schema.presets).length,
		fieldCount: Object.keys(schema.fields).length,
		categoryCount: Object.keys(schema.categories).length,
		deprecatedCount: schema.deprecated.length,
		version: schema.metadata?.version,
		loadedAt: schema.metadata?.loadedAt,
	};

	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(stats, null, 2),
			},
		],
	};
}
