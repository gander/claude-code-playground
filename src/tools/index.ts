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
 * Tool definition structure
 */
export interface ToolDefinition {
	name: string;
	description: string;
	inputSchema: {
		type: "object";
		properties: Record<string, unknown>;
		required: string[];
	};
}

/**
 * Tool handler function signature
 */
export type ToolHandler = (
	loader: SchemaLoader,
	args: unknown,
) => Promise<{
	content: Array<{ type: "text"; text: string }>;
}>;

/**
 * Tool entry combining definition and handler
 */
export interface ToolEntry {
	definition: ToolDefinition;
	handler: ToolHandler;
}

/**
 * All available tools
 * Sorted alphabetically by name for consistent ordering
 */
export const tools: ToolEntry[] = [
	{ definition: checkDeprecated.definition, handler: checkDeprecated.handler },
	{ definition: getCategories.definition, handler: getCategories.handler },
	{ definition: getCategoryTags.definition, handler: getCategoryTags.handler },
	{ definition: getPresetDetails.definition, handler: getPresetDetails.handler },
	{ definition: getPresetTags.definition, handler: getPresetTags.handler },
	{ definition: getRelatedTags.definition, handler: getRelatedTags.handler },
	{ definition: getSchemaStats.definition, handler: getSchemaStats.handler },
	{ definition: getTagInfo.definition, handler: getTagInfo.handler },
	{ definition: getTagValues.definition, handler: getTagValues.handler },
	{ definition: searchPresets.definition, handler: searchPresets.handler },
	{ definition: searchTags.definition, handler: searchTags.handler },
	{ definition: suggestImprovements.definition, handler: suggestImprovements.handler },
	{ definition: validateTag.definition, handler: validateTag.handler },
	{ definition: validateTagCollection.definition, handler: validateTagCollection.handler },
];
