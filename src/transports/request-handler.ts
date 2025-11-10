/**
 * Request handler helper for HTTP-based transports
 * Directly invokes MCP server handlers without full Transport layer
 */

import { SchemaLoader } from "../utils/schema-loader.js";
import { getSchemaStats } from "../tools/get-schema-stats.js";
import { getCategories } from "../tools/get-categories.js";
import { getCategoryTags } from "../tools/get-category-tags.js";
import { getPresetDetails } from "../tools/get-preset-details.js";
import { getPresetTags } from "../tools/get-preset-tags.js";
import { getRelatedTags } from "../tools/get-related-tags.js";
import { getTagInfo } from "../tools/get-tag-info.js";
import { getTagValues } from "../tools/get-tag-values.js";
import { searchPresets } from "../tools/search-presets.js";
import { searchTags } from "../tools/search-tags.js";
import { checkDeprecated } from "../tools/check-deprecated.js";
import { suggestImprovements } from "../tools/suggest-improvements.js";
import { validateTag } from "../tools/validate-tag.js";
import { validateTagCollection } from "../tools/validate-tag-collection.js";

/**
 * JSON-RPC request
 */
export interface JsonRpcRequest {
	jsonrpc: "2.0";
	id: string | number | null;
	method: string;
	params?: unknown;
}

/**
 * JSON-RPC response
 */
export interface JsonRpcResponse {
	jsonrpc: "2.0";
	id: string | number | null;
	result?: unknown;
	error?: {
		code: number;
		message: string;
		data?: unknown;
	};
}

/**
 * MCP Request Handler
 * Handles MCP protocol requests directly
 */
export class McpRequestHandler {
	private schemaLoader: SchemaLoader;

	constructor() {
		this.schemaLoader = new SchemaLoader({ enableIndexing: true });
	}

	/**
 * Handle MCP request and return JSON-RPC response
	 */
	public async handle(request: JsonRpcRequest): Promise<JsonRpcResponse> {
		try {
			switch (request.method) {
				case "tools/list":
					return this.handleToolsList(request);

				case "tools/call":
					return await this.handleToolsCall(request);

				default:
					return {
						jsonrpc: "2.0",
						id: request.id,
						error: {
							code: -32601,
							message: `Method not found: ${request.method}`,
						},
					};
			}
		} catch (error) {
			return {
				jsonrpc: "2.0",
				id: request.id,
				error: {
					code: -32603,
					message: error instanceof Error ? error.message : "Internal error",
				},
			};
		}
	}

	private handleToolsList(request: JsonRpcRequest): JsonRpcResponse {
		return {
			jsonrpc: "2.0",
			id: request.id,
			result: {
				tools: [
					{
						name: "check_deprecated",
						description:
							"Check if an OSM tag is deprecated. Accepts tag key or key-value pair.",
						inputSchema: {
							type: "object",
							properties: {
								key: {
									type: "string",
									description: "The tag key to check (e.g., 'amenity', 'highway')",
								},
								value: {
									type: "string",
									description:
										"Optional tag value. If not provided, checks if any value for this key is deprecated",
								},
							},
							required: ["key"],
						},
					},
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
					{
						name: "suggest_improvements",
						description:
							"Suggest improvements for an OSM tag collection. Analyzes tags and provides suggestions for missing fields, warnings about deprecated tags, and recommendations based on matched presets.",
						inputSchema: {
							type: "object",
							properties: {
								tags: {
									type: "object",
									description:
										"Object containing tag key-value pairs to analyze (e.g., { 'amenity': 'restaurant' })",
									additionalProperties: {
										type: "string",
									},
								},
							},
							required: ["tags"],
						},
					},
					{
						name: "validate_tag",
						description:
							"Validate a single OSM tag key-value pair. Checks for deprecated tags, unknown keys, and validates against field options.",
						inputSchema: {
							type: "object",
							properties: {
								key: {
									type: "string",
									description: "The tag key to validate (e.g., 'amenity', 'building')",
								},
								value: {
									type: "string",
									description: "The tag value to validate (e.g., 'restaurant', 'yes')",
								},
							},
							required: ["key", "value"],
						},
					},
					{
						name: "validate_tag_collection",
						description:
							"Validate a collection of OSM tags. Returns validation results for each tag and aggregated statistics.",
						inputSchema: {
							type: "object",
							properties: {
								tags: {
									type: "object",
									description:
										"Object containing tag key-value pairs to validate (e.g., { 'amenity': 'parking', 'parking': 'surface' })",
									additionalProperties: {
										type: "string",
									},
								},
							},
							required: ["tags"],
						},
					},
				],
			},
		};
	}

	private async handleToolsCall(request: JsonRpcRequest): Promise<JsonRpcResponse> {
		const params = request.params as { name: string; arguments: Record<string, unknown> };

		if (!params || !params.name) {
			return {
				jsonrpc: "2.0",
				id: request.id,
				error: {
					code: -32602,
					message: "Invalid params: name is required",
				},
			};
		}

		const { name, arguments: args } = params;

		try {
			let result;

			switch (name) {
				case "get_schema_stats": {
					const stats = await getSchemaStats(this.schemaLoader);
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(stats, null, 2),
							},
						],
					};
					break;
				}

				case "get_categories": {
					const categories = await getCategories(this.schemaLoader);
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(categories, null, 2),
							},
						],
					};
					break;
				}

				case "get_category_tags": {
					const category = args.category as string;
					if (!category) {
						throw new Error("category parameter is required");
					}
					const tags = await getCategoryTags(this.schemaLoader, category);
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(tags, null, 2),
							},
						],
					};
					break;
				}

				case "get_preset_details": {
					const presetId = args.presetId as string;
					if (!presetId) {
						throw new Error("presetId parameter is required");
					}
					const preset = await getPresetDetails(this.schemaLoader, presetId);
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(preset, null, 2),
							},
						],
					};
					break;
				}

				case "get_preset_tags": {
					const presetId = args.presetId as string;
					if (!presetId) {
						throw new Error("presetId parameter is required");
					}
					const tags = await getPresetTags(this.schemaLoader, presetId);
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(tags, null, 2),
							},
						],
					};
					break;
				}

				case "get_related_tags": {
					const tag = args.tag as string;
					const limit = args.limit as number | undefined;
					if (!tag) {
						throw new Error("tag parameter is required");
					}
					const related = await getRelatedTags(this.schemaLoader, tag, limit);
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(related, null, 2),
							},
						],
					};
					break;
				}

				case "get_tag_info": {
					const tagKey = args.tagKey as string;
					if (!tagKey) {
						throw new Error("tagKey parameter is required");
					}
					const info = await getTagInfo(this.schemaLoader, tagKey);
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(info, null, 2),
							},
						],
					};
					break;
				}

				case "get_tag_values": {
					const tagKey = args.tagKey as string;
					if (!tagKey) {
						throw new Error("tagKey parameter is required");
					}
					const values = await getTagValues(this.schemaLoader, tagKey);
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(values, null, 2),
							},
						],
					};
					break;
				}

				case "search_presets": {
					const keyword = args.keyword as string;
					const limit = args.limit as number | undefined;
					const geometry = args.geometry as "point" | "vertex" | "line" | "area" | "relation" | undefined;
					if (!keyword) {
						throw new Error("keyword parameter is required");
					}
					const presets = await searchPresets(this.schemaLoader, keyword, { limit, geometry });
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(presets, null, 2),
							},
						],
					};
					break;
				}

				case "search_tags": {
					const keyword = args.keyword as string;
					const limit = args.limit as number | undefined;
					if (!keyword) {
						throw new Error("keyword parameter is required");
					}
					const tags = await searchTags(this.schemaLoader, keyword, limit);
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(tags, null, 2),
							},
						],
					};
					break;
				}

				case "check_deprecated": {
					const key = args.key as string;
					const value = args.value as string | undefined;
					if (!key) {
						throw new Error("key parameter is required");
					}
					const deprecated = await checkDeprecated(this.schemaLoader, key, value);
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(deprecated, null, 2),
							},
						],
					};
					break;
				}

				case "suggest_improvements": {
					const tags = args.tags as Record<string, string>;
					if (!tags) {
						throw new Error("tags parameter is required");
					}
					const suggestions = await suggestImprovements(this.schemaLoader, tags);
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(suggestions, null, 2),
							},
						],
					};
					break;
				}

				case "validate_tag": {
					const key = args.key as string;
					const value = args.value as string;
					if (!key || !value) {
						throw new Error("key and value parameters are required");
					}
					const validation = await validateTag(this.schemaLoader, key, value);
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(validation, null, 2),
							},
						],
					};
					break;
				}

				case "validate_tag_collection": {
					const tags = args.tags as Record<string, string>;
					if (!tags) {
						throw new Error("tags parameter is required");
					}
					const validation = await validateTagCollection(this.schemaLoader, tags);
					result = {
						content: [
							{
								type: "text",
								text: JSON.stringify(validation, null, 2),
							},
						],
					};
					break;
				}

				default:
					return {
						jsonrpc: "2.0",
						id: request.id,
						error: {
							code: -32601,
							message: `Unknown tool: ${name}`,
						},
					};
			}

			return {
				jsonrpc: "2.0",
				id: request.id,
				result,
			};
		} catch (error) {
			return {
				jsonrpc: "2.0",
				id: request.id,
				error: {
					code: -32603,
					message: error instanceof Error ? error.message : "Internal error",
				},
			};
		}
	}
}
