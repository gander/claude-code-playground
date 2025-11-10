/**
 * Type definitions for OpenStreetMap tagging schema structures
 */

/**
 * Geometry types supported by OSM presets
 */
export type GeometryType = "point" | "vertex" | "line" | "area" | "relation";

/**
 * Field types available in the schema
 */
export type FieldType =
	| "check"
	| "combo"
	| "typeCombo"
	| "multiCombo"
	| "semiCombo"
	| "text"
	| "textarea"
	| "number"
	| "radio"
	| "url"
	| "identifier"
	| "email"
	| "tel"
	| "wikipedia"
	| "wikidata"
	| "address"
	| "manyCombo"
	| "networkCombo"
	| "roadheight"
	| "roadspeed";

/**
 * Location set for geographic restrictions
 */
export interface LocationSet {
	include?: string[];
	exclude?: string[];
}

/**
 * Field definition in the schema
 */
export interface Field {
	key: string;
	keys?: string[];
	type: FieldType;
	label?: string;
	placeholder?: string;
	universal?: boolean;
	geometry?: GeometryType[];
	default?: string | number | boolean;
	options?: string[];
	strings?: Record<string, { title: string; description?: string }>;
	minValue?: number;
	maxValue?: number;
	locationSet?: LocationSet;
	urlFormat?: string;
	pattern?: string;
	reference?: { key: string; value?: string };
	prerequisiteTag?: { key: string; value?: string; valueNot?: string };
	terms?: string[];
}

/**
 * Preset definition in the schema
 */
export interface Preset {
	name?: string;
	icon?: string;
	imageURL?: string;
	geometry: GeometryType[];
	tags: Record<string, string>;
	addTags?: Record<string, string>;
	removeTags?: Record<string, string>;
	fields?: string[];
	moreFields?: string[];
	terms?: string[];
	searchable?: boolean;
	matchScore?: number;
	reference?: { key: string; value?: string };
	locationSet?: LocationSet;
}

/**
 * Preset category in the schema
 */
export interface PresetCategory {
	icon?: string;
	geometry: GeometryType[];
	members: string[];
}

/**
 * Deprecated tag mapping
 */
export interface DeprecatedTag {
	old: Record<string, string>;
	replace: Record<string, string>;
}

/**
 * Complete schema data structure
 */
export interface SchemaData {
	presets: Record<string, Preset>;
	fields: Record<string, Field>;
	categories: Record<string, PresetCategory>;
	deprecated: DeprecatedTag[];
	defaults: Record<string, { area?: string[]; line?: string[]; point?: string[] }>;
}

/**
 * Index for fast tag lookups
 */
export interface TagIndex {
	byKey: Map<string, Set<string>>; // key -> Set of preset IDs
	byTag: Map<string, Set<string>>; // "key=value" -> Set of preset IDs
	byGeometry: Map<GeometryType, Set<string>>; // geometry -> Set of preset IDs
	byFieldKey: Map<string, Field>; // OSM tag key -> Field definition
}

/**
 * Schema loader configuration
 */
export interface SchemaLoaderConfig {
	cacheTTL?: number; // Cache time-to-live in milliseconds (default: infinite)
	// Note: Indexing is always enabled for optimal performance
}

/**
 * Validation result for a tag
 */
export interface TagValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	deprecated?: {
		old: Record<string, string>;
		replacement: Record<string, string>;
	};
}

/**
 * Tag collection validation result
 */
export interface TagCollectionValidationResult {
	valid: boolean;
	tags: Record<string, TagValidationResult>;
	suggestions: string[];
}
