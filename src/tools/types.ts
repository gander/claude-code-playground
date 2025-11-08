/**
 * Shared types for OSM tagging schema tools
 */

/**
 * Schema statistics interface
 */
export interface SchemaStats {
	presetCount: number;
	fieldCount: number;
	categoryCount: number;
	deprecatedCount: number;
}

/**
 * Category information interface
 */
export interface CategoryInfo {
	name: string;
	count: number;
}

/**
 * Tag search result interface
 */
export interface TagSearchResult {
	key: string;
	value: string;
	presetName?: string;
}

/**
 * Tag information interface
 */
export interface TagInfo {
	key: string;
	values: string[];
	type?: string;
	hasFieldDefinition: boolean;
}
