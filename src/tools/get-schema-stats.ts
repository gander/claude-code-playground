import { schemaLoader } from "../utils/schema-loader.js";
import type { SchemaStats } from "./types.js";

/**
 * Tool definition for get_schema_stats
 */
export const definition = {
	name: "get_schema_stats",
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
 * @returns Schema statistics including counts of presets, fields, categories, deprecated items, and version info
 */
export async function getSchemaStats(): Promise<SchemaStats> {
	const schema = await schemaLoader.loadSchema();

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
export async function handler(_args: unknown) {
	const stats = await getSchemaStats();
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(stats, null, 2),
			},
		],
	};
}
