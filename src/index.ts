#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getCategories } from "./tools/get-categories.js";
import { getCategoryTags } from "./tools/get-category-tags.js";
import { getPresetDetails } from "./tools/get-preset-details.js";
import { getPresetTags } from "./tools/get-preset-tags.js";
import { getRelatedTags } from "./tools/get-related-tags.js";
import { getSchemaStats } from "./tools/get-schema-stats.js";
import { getTagInfo } from "./tools/get-tag-info.js";
import { getTagValues } from "./tools/get-tag-values.js";
import { searchPresets } from "./tools/search-presets.js";
import { searchTags } from "./tools/search-tags.js";
import { SchemaLoader } from "./utils/schema-loader.js";

/**
 * Create and configure the MCP server
 */
export function createServer(): Server {
	const server = new Server(
		{
			name: "osm-tagging-schema",
			version: "0.1.0",
		},
		{
			capabilities: {
				tools: {},
			},
		},
	);

	// Initialize schema loader with indexing enabled
	const schemaLoader = new SchemaLoader({ enableIndexing: true });

	// Register tool handlers
	// Tools are sorted alphabetically by name
	server.setRequestHandler(ListToolsRequestSchema, async () => ({
		tools: [
			{
				name: "get_categories",
				description:
					"Get all available tag categories with counts of presets in each category, sorted by name",
				inputSchema: {
					type: "object",
					properties: {},
					required: [],
				},
			},
			{
				name: "get_category_tags",
				description: "Get all tags (preset IDs) belonging to a specific category",
				inputSchema: {
					type: "object",
					properties: {
						category: {
							type: "string",
							description: "Name of the category",
						},
					},
					required: ["category"],
				},
			},
			{
				name: "get_preset_details",
				description:
					"Get complete details for a specific preset including tags, geometry, fields, and metadata",
				inputSchema: {
					type: "object",
					properties: {
						presetId: {
							type: "string",
							description: "The preset ID to get details for (e.g., 'amenity/restaurant')",
						},
					},
					required: ["presetId"],
				},
			},
			{
				name: "get_preset_tags",
				description:
					"Get recommended tags for a specific preset. Returns identifying tags and additional recommended tags.",
				inputSchema: {
					type: "object",
					properties: {
						presetId: {
							type: "string",
							description: "The preset ID to get tags for (e.g., 'amenity/restaurant')",
						},
					},
					required: ["presetId"],
				},
			},
			{
				name: "get_related_tags",
				description:
					"Find tags commonly used together with a given tag. Returns tags sorted by frequency (how often they appear together).",
				inputSchema: {
					type: "object",
					properties: {
						tag: {
							type: "string",
							description:
								"Tag to find related tags for (format: 'key' or 'key=value', e.g., 'amenity' or 'amenity=restaurant')",
						},
						limit: {
							type: "number",
							description: "Maximum number of results to return (optional)",
						},
					},
					required: ["tag"],
				},
			},
			{
				name: "get_schema_stats",
				description:
					"Get statistics about the OpenStreetMap tagging schema, including counts of presets, fields, categories, and deprecated items",
				inputSchema: {
					type: "object",
					properties: {},
					required: [],
				},
			},
			{
				name: "get_tag_info",
				description:
					"Get comprehensive information about a specific tag key, including all possible values, type, and field definition status",
				inputSchema: {
					type: "object",
					properties: {
						tagKey: {
							type: "string",
							description: "The tag key to get information for (e.g., 'parking', 'amenity')",
						},
					},
					required: ["tagKey"],
				},
			},
			{
				name: "get_tag_values",
				description:
					"Get all possible values for a given tag key (e.g., all values for 'amenity' tag)",
				inputSchema: {
					type: "object",
					properties: {
						tagKey: {
							type: "string",
							description: "The tag key to get values for (e.g., 'amenity', 'building')",
						},
					},
					required: ["tagKey"],
				},
			},
			{
				name: "search_presets",
				description:
					"Search for presets by keyword or tag. Searches preset IDs and tags. Supports filtering by geometry type and limiting results.",
				inputSchema: {
					type: "object",
					properties: {
						keyword: {
							type: "string",
							description:
								"Keyword to search for in preset IDs and tags (case-insensitive). Can be a simple keyword (e.g., 'restaurant') or a tag (e.g., 'amenity=restaurant')",
						},
						limit: {
							type: "number",
							description: "Maximum number of results to return (optional)",
						},
						geometry: {
							type: "string",
							description:
								"Filter by geometry type (point, vertex, line, area, relation) - optional",
						},
					},
					required: ["keyword"],
				},
			},
			{
				name: "search_tags",
				description: "Search for tags by keyword in tag keys, values, and preset names",
				inputSchema: {
					type: "object",
					properties: {
						keyword: {
							type: "string",
							description: "Keyword to search for (case-insensitive)",
						},
						limit: {
							type: "number",
							description: "Maximum number of results to return (default: 100)",
						},
					},
					required: ["keyword"],
				},
			},
		],
	}));

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		const { name, arguments: args } = request.params;

		if (name === "get_schema_stats") {
			const stats = await getSchemaStats(schemaLoader);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(stats, null, 2),
					},
				],
			};
		}

		if (name === "get_categories") {
			const categories = await getCategories(schemaLoader);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(categories, null, 2),
					},
				],
			};
		}

		if (name === "get_category_tags") {
			const category = (args as { category?: string }).category;
			if (!category) {
				throw new Error("category parameter is required");
			}
			const tags = await getCategoryTags(schemaLoader, category);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(tags, null, 2),
					},
				],
			};
		}

		if (name === "get_preset_details") {
			const presetId = (args as { presetId?: string }).presetId;
			if (!presetId) {
				throw new Error("presetId parameter is required");
			}
			const details = await getPresetDetails(schemaLoader, presetId);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(details, null, 2),
					},
				],
			};
		}

		if (name === "get_preset_tags") {
			const presetId = (args as { presetId?: string }).presetId;
			if (!presetId) {
				throw new Error("presetId parameter is required");
			}
			const tags = await getPresetTags(schemaLoader, presetId);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(tags, null, 2),
					},
				],
			};
		}

		if (name === "get_tag_values") {
			const tagKey = (args as { tagKey?: string }).tagKey;
			if (!tagKey) {
				throw new Error("tagKey parameter is required");
			}
			const values = await getTagValues(schemaLoader, tagKey);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(values, null, 2),
					},
				],
			};
		}

		if (name === "get_tag_info") {
			const tagKey = (args as { tagKey?: string }).tagKey;
			if (!tagKey) {
				throw new Error("tagKey parameter is required");
			}
			const info = await getTagInfo(schemaLoader, tagKey);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(info, null, 2),
					},
				],
			};
		}

		if (name === "search_tags") {
			const { keyword, limit } = args as { keyword?: string; limit?: number };
			if (!keyword) {
				throw new Error("keyword parameter is required");
			}
			const results = await searchTags(schemaLoader, keyword, limit);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(results, null, 2),
					},
				],
			};
		}

		if (name === "get_related_tags") {
			const { tag, limit } = args as { tag?: string; limit?: number };
			if (!tag) {
				throw new Error("tag parameter is required");
			}
			const results = await getRelatedTags(schemaLoader, tag, limit);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(results, null, 2),
					},
				],
			};
		}

		if (name === "search_presets") {
			const { keyword, limit, geometry } = args as {
				keyword?: string;
				limit?: number;
				geometry?: "point" | "vertex" | "line" | "area" | "relation";
			};
			if (!keyword) {
				throw new Error("keyword parameter is required");
			}
			const results = await searchPresets(schemaLoader, keyword, { limit, geometry });
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(results, null, 2),
					},
				],
			};
		}

		throw new Error(`Unknown tool: ${name}`);
	});

	return server;
}

/**
 * Main entry point
 */
async function main() {
	const server = createServer();
	const transport = new StdioServerTransport();

	await server.connect(transport);

	console.error("OSM Tagging Schema MCP Server running on stdio");
}

// Run if this is the main module
// Check if the file is being run directly (not imported as a module)
const isMainModule =
	process.argv[1] &&
	(import.meta.url === `file://${process.argv[1]}` ||
		import.meta.url.endsWith(process.argv[1]) ||
		process.argv[1].endsWith("index.js"));

if (isMainModule) {
	main().catch((error) => {
		console.error("Server error:", error);
		process.exit(1);
	});
}
