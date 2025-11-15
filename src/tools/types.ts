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
 * @deprecated Use SearchTagsResponse instead (Phase 8.4 refactor)
 */
export interface TagSearchResult {
	key: string;
	value: string;
	presetName?: string;
}

/**
 * Key match result (Phase 8.4 format)
 * When a keyword matches a tag key, return ALL values for that key
 */
export interface KeyMatch {
	key: string; // The matched key (e.g., "amenity")
	keyName: string; // Localized key name (e.g., "Amenity")
	values: string[]; // Simple array of all values
	valuesDetailed: ValueDetailed[]; // Detailed values with names
}

/**
 * Value match result (Phase 8.4 format)
 * When a keyword matches a tag value, return specific key-value pair
 */
export interface ValueMatch {
	key: string; // The key (e.g., "amenity")
	keyName: string; // Localized key name (e.g., "Amenity")
	value: string; // The matched value (e.g., "restaurant")
	valueName: string; // Localized value name (e.g., "Restaurant")
}

/**
 * Response for search_tags tool (Phase 8.4 format)
 */
export interface SearchTagsResponse {
	keyMatches: KeyMatch[]; // Tags matched by key
	valueMatches: ValueMatch[]; // Tags matched by value
}

/**
 * Value information with localized name and optional description
 * @deprecated Use TagValuesResponse instead (Phase 8.3 refactor)
 */
export interface ValueInfo {
	value: string; // The actual value key (e.g., "surface", "underground")
	name: string; // Localized title (e.g., "Surface", "Underground")
	description?: string; // Optional description
}

/**
 * Detailed value information with localized name (Phase 8.3 format)
 */
export interface ValueDetailed {
	value: string; // The actual value key (e.g., "surface", "underground")
	valueName: string; // Localized name (e.g., "Surface", "Underground")
}

/**
 * Response for get_tag_values tool (Phase 8.3 format)
 */
export interface TagValuesResponse {
	key: string; // The queried key (e.g., "amenity")
	keyName: string; // Localized key name (e.g., "Amenity")
	values: string[]; // Simple array of values
	valuesDetailed: ValueDetailed[]; // Detailed values with names
}

/**
 * Tag information interface
 */
export interface TagInfo {
	key: string;
	name?: string; // Preset name (e.g., "Parking Lot") or field label
	values: ValueInfo[]; // Array of structured value information
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
