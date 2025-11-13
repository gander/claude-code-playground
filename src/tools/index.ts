/**
 * Tool registry - exports all tools as OsmToolDefinition array
 */

import type { OsmToolDefinition } from "../types/index.js";
import CheckDeprecated from "./check-deprecated.js";
import GetCategories from "./get-categories.js";
import GetCategoryTags from "./get-category-tags.js";
import GetPresetDetails from "./get-preset-details.js";
import GetPresetTags from "./get-preset-tags.js";
import GetRelatedTags from "./get-related-tags.js";
import GetSchemaStats from "./get-schema-stats.js";
import GetTagInfo from "./get-tag-info.js";
import GetTagValues from "./get-tag-values.js";
import SearchPresets from "./search-presets.js";
import SearchTags from "./search-tags.js";
import SuggestImprovements from "./suggest-improvements.js";
import ValidateTag from "./validate-tag.js";
import ValidateTagCollection from "./validate-tag-collection.js";

/**
 * All available tools using new OsmToolDefinition interface
 * Sorted alphabetically by name for consistent ordering
 */
// biome-ignore lint/suspicious/noExplicitAny: Heterogeneous array of tools with different input schemas
export const tools: OsmToolDefinition<any>[] = [
	CheckDeprecated,
	GetCategories,
	GetCategoryTags,
	GetPresetDetails,
	GetPresetTags,
	GetRelatedTags,
	GetSchemaStats,
	GetTagInfo,
	GetTagValues,
	SearchPresets,
	SearchTags,
	SuggestImprovements,
	ValidateTag,
	ValidateTagCollection,
];
