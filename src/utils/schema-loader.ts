import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	DeprecatedTag,
	Field,
	GeometryType,
	Preset,
	PresetCategory,
	SchemaData,
	SchemaLoaderConfig,
	TagIndex,
} from "../types/index.ts";

/**
 * Schema loader for OpenStreetMap tagging schema
 * Handles loading, caching, and indexing of schema data
 * Optimized version: Always builds indexes, single-pass loading
 */
export class SchemaLoader {
	private cacheTTL: number;
	private cache: SchemaData | null = null;
	private cacheTimestamp: number = 0;
	private index: TagIndex | null = null;
	private schemaBasePath: string;

	constructor(config: SchemaLoaderConfig = {}) {
		this.cacheTTL = config.cacheTTL ?? Number.POSITIVE_INFINITY;

		// Resolve path to node_modules/@openstreetmap/id-tagging-schema/dist
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = dirname(__filename);
		this.schemaBasePath = join(
			__dirname,
			"../../node_modules/@openstreetmap/id-tagging-schema/dist",
		);
	}

	/**
	 * Load schema data from the id-tagging-schema package
	 * Optimized: Builds indexes during load in a single pass
	 */
	async loadSchema(): Promise<SchemaData> {
		// Check cache validity
		if (this.cache && this.isCacheValid()) {
			return this.cache;
		}

		// Load all schema files in parallel
		const [presets, fields, categories, deprecated, defaults] = await Promise.all([
			this.loadJSON<Record<string, Preset>>("presets.json"),
			this.loadJSON<Record<string, Field>>("fields.json"),
			this.loadJSON<Record<string, PresetCategory>>("preset_categories.json"),
			this.loadJSON<DeprecatedTag[]>("deprecated.json"),
			this.loadJSON<Record<string, { area?: string[]; line?: string[]; point?: string[] }>>(
				"preset_defaults.json",
			),
		]);

		this.cache = {
			presets,
			fields,
			categories,
			deprecated,
			defaults,
		};

		this.cacheTimestamp = Date.now();

		// Always build index during load (optimized: single pass)
		this.buildIndex();

		return this.cache;
	}

	/**
	 * Warmup method to preload schema and build indexes
	 * Call this at server startup to eliminate initial latency
	 */
	async warmup(): Promise<void> {
		await this.loadSchema();
	}

	/**
	 * Clear cached schema data
	 */
	clearCache(): void {
		this.cache = null;
		this.cacheTimestamp = 0;
		this.index = null;
	}

	/**
	 * Get the tag index
	 * Index is always built during schema load
	 */
	getIndex(): TagIndex {
		if (!this.index) {
			throw new Error("Schema not loaded. Call loadSchema() or warmup() first.");
		}
		return this.index;
	}

	/**
	 * Find field by OSM tag key using the index
	 * Optimized O(1) lookup using byFieldKey index
	 */
	findFieldByKey(key: string): Field | undefined {
		if (!this.index) {
			throw new Error("Schema not loaded. Call loadSchema() or warmup() first.");
		}
		return this.index.byFieldKey.get(key);
	}

	/**
	 * Find presets by tag key
	 */
	findPresetsByKey(key: string): Preset[] {
		if (!this.index) {
			throw new Error("Schema not loaded. Call loadSchema() or warmup() first.");
		}

		const presetIds = this.index.byKey.get(key);
		if (!presetIds || !this.cache) {
			return [];
		}

		return Array.from(presetIds)
			.map((id) => this.cache?.presets[id])
			.filter((preset) => preset !== undefined);
	}

	/**
	 * Find presets by tag key-value pair
	 */
	findPresetsByTag(key: string, value: string): Preset[] {
		if (!this.index) {
			throw new Error("Schema not loaded. Call loadSchema() or warmup() first.");
		}

		const tagKey = `${key}=${value}`;
		const presetIds = this.index.byTag.get(tagKey);
		if (!presetIds || !this.cache) {
			return [];
		}

		return Array.from(presetIds)
			.map((id) => this.cache?.presets[id])
			.filter((preset) => preset !== undefined);
	}

	/**
	 * Find presets by geometry type
	 */
	findPresetsByGeometry(geometry: GeometryType): Preset[] {
		if (!this.index) {
			throw new Error("Schema not loaded. Call loadSchema() or warmup() first.");
		}

		const presetIds = this.index.byGeometry.get(geometry);
		if (!presetIds || !this.cache) {
			return [];
		}

		return Array.from(presetIds)
			.map((id) => this.cache?.presets[id])
			.filter((preset) => preset !== undefined);
	}

	/**
	 * Get field by key
	 */
	getField(key: string): Field | undefined {
		if (!this.cache) {
			throw new Error("Schema not loaded. Call loadSchema() first.");
		}
		return this.cache.fields[key];
	}

	/**
	 * Get all deprecated tags
	 */
	getDeprecated(): DeprecatedTag[] {
		if (!this.cache) {
			throw new Error("Schema not loaded. Call loadSchema() first.");
		}
		return this.cache.deprecated;
	}

	/**
	 * Load JSON file from schema package
	 */
	private async loadJSON<T>(filename: string): Promise<T> {
		const filePath = join(this.schemaBasePath, filename);
		const content = await readFile(filePath, "utf-8");
		return JSON.parse(content) as T;
	}

	/**
	 * Check if cache is still valid
	 */
	private isCacheValid(): boolean {
		if (this.cacheTTL === Number.POSITIVE_INFINITY) {
			return true;
		}
		const age = Date.now() - this.cacheTimestamp;
		return age < this.cacheTTL;
	}

	/**
	 * Build index for fast lookups
	 * Optimized: Single pass through data, builds all indexes at once
	 */
	private buildIndex(): void {
		if (!this.cache) {
			throw new Error("Cannot build index without loaded schema");
		}

		this.index = {
			byKey: new Map(),
			byTag: new Map(),
			byGeometry: new Map(),
			byFieldKey: new Map(),
		};

		// Index all fields by OSM tag key
		for (const field of Object.values(this.cache.fields)) {
			// Index by the actual OSM tag key (field.key)
			if (field.key) {
				this.index.byFieldKey.set(field.key, field);
			}
		}

		// Index all presets
		for (const [presetId, preset] of Object.entries(this.cache.presets)) {
			// Index by tag keys
			for (const key of Object.keys(preset.tags)) {
				if (!this.index.byKey.has(key)) {
					this.index.byKey.set(key, new Set());
				}
				this.index.byKey.get(key)?.add(presetId);
			}

			// Index by full tags (key=value)
			for (const [key, value] of Object.entries(preset.tags)) {
				// Skip wildcard values
				if (value === "*") continue;

				const tagKey = `${key}=${value}`;
				if (!this.index.byTag.has(tagKey)) {
					this.index.byTag.set(tagKey, new Set());
				}
				this.index.byTag.get(tagKey)?.add(presetId);
			}

			// Index by geometry
			for (const geometry of preset.geometry) {
				if (!this.index.byGeometry.has(geometry)) {
					this.index.byGeometry.set(geometry, new Set());
				}
				this.index.byGeometry.get(geometry)?.add(presetId);
			}
		}
	}
}
