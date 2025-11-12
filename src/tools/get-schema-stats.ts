import type { SchemaLoader } from "../utils/schema-loader.js";
import type { SchemaStats } from "./types.js";

/**
 * Tool name
 */
export const name = "get_schema_stats";

/**
 * Tool definition for get_schema_stats
 */
export const definition = {
	description:
		"Get statistics about the OpenStreetMap tagging schema, including counts of presets, fields, categories, and deprecated items",
	inputSchema: {
		type: "object" as const,
		properties: {},
		required: [],
	},
};

/**
 * Get statistics about the OSM tagging schema
 *
 * @param loader - Schema loader instance
 * @returns Schema statistics including counts of presets, fields, categories, deprecated items, and version info
 */
export async function getSchemaStats(loader: SchemaLoader): Promise<SchemaStats> {
	const schema = await loader.loadSchema();

	return {
		presetCount: Object.keys(schema.presets).length,
		fieldCount: Object.keys(schema.fields).length,
		categoryCount: Object.keys(schema.categories).length,
		deprecatedCount: schema.deprecated.length,
		version: schema.metadata?.version,
		loadedAt: schema.metadata?.loadedAt,
	};
}

/**
 * Handler for get_schema_stats tool
 */
export const handler = (schemaLoader: SchemaLoader) => {
	return async (_args: unknown) => {
		const stats = await getSchemaStats(schemaLoader);
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(stats, null, 2),
				},
			],
		};
	};
};
