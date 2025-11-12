/**
 * Tool registry - exports all tools with their definitions and handlers
 */

import type { SchemaLoader } from "../utils/schema-loader.js";
import * as checkDeprecated from "./check-deprecated.js";
import * as getCategories from "./get-categories.js";
import * as getCategoryTags from "./get-category-tags.js";
import * as getPresetDetails from "./get-preset-details.js";
import * as getPresetTags from "./get-preset-tags.js";
import * as getRelatedTags from "./get-related-tags.js";
import * as getSchemaStats from "./get-schema-stats.js";
import * as getTagInfo from "./get-tag-info.js";
import * as getTagValues from "./get-tag-values.js";
import * as searchPresets from "./search-presets.js";
import * as searchTags from "./search-tags.js";
import * as suggestImprovements from "./suggest-improvements.js";
import * as validateTag from "./validate-tag.js";
import * as validateTagCollection from "./validate-tag-collection.js";

/**
 * Tool definition structure (without name, which is exported separately)
 */
export interface ToolDefinition {
	description: string;
	inputSchema: {
		type: "object";
		properties: Record<string, unknown>;
		required: string[];
	};
}

/**
 * Tool handler factory function signature
 * Returns a handler function that accepts typed args
 * Uses 'any' to allow handlers to specify their own argument types
 */
// biome-ignore lint/suspicious/noExplicitAny: Handlers need to define their own argument types
export type ToolHandlerFactory = (loader: SchemaLoader) => (args: any) => Promise<{
	content: Array<{ type: "text"; text: string }>;
}>;

/**
 * Tool entry combining name, definition, and handler factory
 */
export interface ToolEntry {
	name: string;
	definition: ToolDefinition;
	handler: ToolHandlerFactory;
}

/**
 * All available tools
 * Sorted alphabetically by name for consistent ordering
 */
export const tools: ToolEntry[] = [
	{
		name: checkDeprecated.name,
		definition: checkDeprecated.definition,
		handler: checkDeprecated.handler,
	},
	{
		name: getCategories.name,
		definition: getCategories.definition,
		handler: getCategories.handler,
	},
	{
		name: getCategoryTags.name,
		definition: getCategoryTags.definition,
		handler: getCategoryTags.handler,
	},
	{
		name: getPresetDetails.name,
		definition: getPresetDetails.definition,
		handler: getPresetDetails.handler,
	},
	{
		name: getPresetTags.name,
		definition: getPresetTags.definition,
		handler: getPresetTags.handler,
	},
	{
		name: getRelatedTags.name,
		definition: getRelatedTags.definition,
		handler: getRelatedTags.handler,
	},
	{
		name: getSchemaStats.name,
		definition: getSchemaStats.definition,
		handler: getSchemaStats.handler,
	},
	{ name: getTagInfo.name, definition: getTagInfo.definition, handler: getTagInfo.handler },
	{ name: getTagValues.name, definition: getTagValues.definition, handler: getTagValues.handler },
	{
		name: searchPresets.name,
		definition: searchPresets.definition,
		handler: searchPresets.handler,
	},
	{ name: searchTags.name, definition: searchTags.definition, handler: searchTags.handler },
	{
		name: suggestImprovements.name,
		definition: suggestImprovements.definition,
		handler: suggestImprovements.handler,
	},
	{ name: validateTag.name, definition: validateTag.definition, handler: validateTag.handler },
	{
		name: validateTagCollection.name,
		definition: validateTagCollection.definition,
		handler: validateTagCollection.handler,
	},
];
