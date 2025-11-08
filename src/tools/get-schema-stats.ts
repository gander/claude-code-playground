import type { SchemaLoader } from "../utils/schema-loader.js";
import type { SchemaStats } from "./types.js";

/**
 * Get statistics about the OSM tagging schema
 *
 * @param loader - Schema loader instance
 * @returns Schema statistics including counts of presets, fields, categories, and deprecated items
 */
export async function getSchemaStats(loader: SchemaLoader): Promise<SchemaStats> {
	const schema = await loader.loadSchema();

	return {
		presetCount: Object.keys(schema.presets).length,
		fieldCount: Object.keys(schema.fields).length,
		categoryCount: Object.keys(schema.categories).length,
		deprecatedCount: schema.deprecated.length,
	};
}
