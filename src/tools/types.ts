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
	version?: string; // Schema package version
	loadedAt?: number; // Timestamp when schema was loaded
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
 * Value information with localized title and optional description
 */
export interface ValueInfo {
	title: string;
	description?: string;
}

/**
 * Tag information interface
 */
export interface TagInfo {
	key: string;
	name?: string; // Localized field label
	values: Record<string, ValueInfo>; // Value key -> localized info
	type?: string;
	hasFieldDefinition: boolean;
}

/**
 * Related tag result interface
 */
export interface RelatedTag {
	key: string;
	value?: string;
	frequency: number;
	presetExamples?: string[];
}

/**
 * Preset search result interface
 */
export interface PresetSearchResult {
	id: string;
	tags: Record<string, string>;
	geometry: string[];
}

/**
 * Preset details interface
 */
export interface PresetDetails {
	id: string;
	tags: Record<string, string>;
	geometry: string[];
	name?: string;
	fields?: string[];
	moreFields?: string[];
	icon?: string;
}

/**
 * Preset tags interface
 */
export interface PresetTags {
	tags: Record<string, string>;
	addTags?: Record<string, string>;
}
