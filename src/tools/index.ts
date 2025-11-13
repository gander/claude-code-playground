/**
 * Tool registry - exports all tools with their definitions and handlers
 */

import * as checkDeprecated from "./check-deprecated.js";
// import * as getCategories from "./get-categories.js"; // Migrated to new ToolDefinition format
// import * as getCategoryTags from "./get-category-tags.js"; // Migrated to new ToolDefinition format
import * as getPresetDetails from "./get-preset-details.js";
import * as getPresetTags from "./get-preset-tags.js";
// import * as getRelatedTags from "./get-related-tags.js"; // Migrated to new ToolDefinition format
// import * as getSchemaStats from "./get-schema-stats.js"; // Migrated to new ToolDefinition format
// import * as getTagInfo from "./get-tag-info.js"; // Migrated to new ToolDefinition format
// import * as getTagValues from "./get-tag-values.js"; // Migrated to new ToolDefinition format
// import * as searchPresets from "./search-presets.js"; // Migrated to new ToolDefinition format
// import * as searchTags from "./search-tags.js"; // Migrated to new ToolDefinition format
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
export type ToolHandler = (args: unknown) => Promise<{
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
	// { definition: getCategories.definition, handler: getCategories.handler }, // Migrated to new ToolDefinition format
	// { definition: getCategoryTags.definition, handler: getCategoryTags.handler }, // Migrated to new ToolDefinition format
	{ definition: getPresetDetails.definition, handler: getPresetDetails.handler },
	{ definition: getPresetTags.definition, handler: getPresetTags.handler },
	// { definition: getRelatedTags.definition, handler: getRelatedTags.handler }, // Migrated to new ToolDefinition format
	// { definition: getSchemaStats.definition, handler: getSchemaStats.handler }, // Migrated to new ToolDefinition format
	// { definition: getTagInfo.definition, handler: getTagInfo.handler }, // Migrated to new ToolDefinition format
	// { definition: getTagValues.definition, handler: getTagValues.handler }, // Migrated to new ToolDefinition format
	// { definition: searchPresets.definition, handler: searchPresets.handler }, // Migrated to new ToolDefinition format
	// { definition: searchTags.definition, handler: searchTags.handler }, // Migrated to new ToolDefinition format
	{ definition: suggestImprovements.definition, handler: suggestImprovements.handler },
	{ definition: validateTag.definition, handler: validateTag.handler },
	{ definition: validateTagCollection.definition, handler: validateTagCollection.handler },
];
