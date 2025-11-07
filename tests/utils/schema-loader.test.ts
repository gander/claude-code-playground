import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { SchemaLoader } from "../../src/utils/schema-loader.ts";

describe("SchemaLoader", () => {
	let loader: SchemaLoader;

	beforeEach(() => {
		loader = new SchemaLoader();
	});

	describe("loadSchema", () => {
		it("should load schema data successfully", async () => {
			const schema = await loader.loadSchema();

			assert.ok(schema);
			assert.ok(schema.presets);
			assert.ok(schema.fields);
			assert.ok(schema.categories);
			assert.ok(schema.deprecated);
			assert.ok(Array.isArray(schema.deprecated));
		});

		it("should load presets with correct structure", async () => {
			const schema = await loader.loadSchema();
			const presetKeys = Object.keys(schema.presets);

			assert.ok(presetKeys.length > 0);

			// Check first preset has required properties
			const firstPreset = schema.presets[presetKeys[0]];
			assert.ok(firstPreset);
			assert.ok(Array.isArray(firstPreset.geometry));
			assert.ok(typeof firstPreset.tags === "object");
		});

		it("should load fields with correct structure", async () => {
			const schema = await loader.loadSchema();
			const fieldKeys = Object.keys(schema.fields);

			assert.ok(fieldKeys.length > 0);

			// Check first field has required properties
			const firstField = schema.fields[fieldKeys[0]];
			assert.ok(firstField);
			assert.ok(firstField.key);
			assert.ok(firstField.type);
		});
	});

	describe("caching", () => {
		it("should cache schema data after first load", async () => {
			const schema1 = await loader.loadSchema();
			const schema2 = await loader.loadSchema();

			// Should return the same instance (cached)
			assert.strictEqual(schema1, schema2);
		});

		it("should allow clearing cache", async () => {
			const schema1 = await loader.loadSchema();
			loader.clearCache();
			const schema2 = await loader.loadSchema();

			// Should be different instances after cache clear
			assert.notStrictEqual(schema1, schema2);
		});

		it("should respect cache TTL configuration", async () => {
			const shortCacheLoader = new SchemaLoader({ cacheTTL: 100 }); // 100ms
			const schema1 = await shortCacheLoader.loadSchema();

			// Wait for cache to expire
			await new Promise((resolve) => setTimeout(resolve, 150));

			const schema2 = await shortCacheLoader.loadSchema();

			// Should be different instances after TTL expiry
			assert.notStrictEqual(schema1, schema2);
		});
	});

	describe("indexing", () => {
		it("should build tag index when enabled", async () => {
			const indexedLoader = new SchemaLoader({ enableIndexing: true });
			await indexedLoader.loadSchema();

			const index = indexedLoader.getIndex();

			assert.ok(index);
			assert.ok(index.byKey);
			assert.ok(index.byTag);
			assert.ok(index.byGeometry);
		});

		it("should index presets by tag key", async () => {
			const indexedLoader = new SchemaLoader({ enableIndexing: true });
			await indexedLoader.loadSchema();

			const index = indexedLoader.getIndex();

			// Should have entries for common keys like "amenity", "shop", etc.
			assert.ok(index.byKey.size > 0);

			// Check that "amenity" key exists and has preset IDs
			const amenityPresets = index.byKey.get("amenity");
			if (amenityPresets) {
				assert.ok(amenityPresets.size > 0);
			}
		});

		it("should index presets by full tag (key=value)", async () => {
			const indexedLoader = new SchemaLoader({ enableIndexing: true });
			await indexedLoader.loadSchema();

			const index = indexedLoader.getIndex();

			assert.ok(index.byTag.size > 0);
		});

		it("should index presets by geometry type", async () => {
			const indexedLoader = new SchemaLoader({ enableIndexing: true });
			await indexedLoader.loadSchema();

			const index = indexedLoader.getIndex();

			// Should have entries for all geometry types
			assert.ok(index.byGeometry.get("point"));
			assert.ok(index.byGeometry.get("area"));
		});
	});

	describe("query operations", () => {
		it("should find presets by tag key", async () => {
			const indexedLoader = new SchemaLoader({ enableIndexing: true });
			await indexedLoader.loadSchema();

			const presets = indexedLoader.findPresetsByKey("amenity");

			assert.ok(Array.isArray(presets));
			assert.ok(presets.length > 0);
		});

		it("should find presets by tag key-value pair", async () => {
			const indexedLoader = new SchemaLoader({ enableIndexing: true });
			await indexedLoader.loadSchema();

			const presets = indexedLoader.findPresetsByTag("amenity", "parking");

			assert.ok(Array.isArray(presets));
		});

		it("should find presets by geometry", async () => {
			const indexedLoader = new SchemaLoader({ enableIndexing: true });
			await indexedLoader.loadSchema();

			const presets = indexedLoader.findPresetsByGeometry("point");

			assert.ok(Array.isArray(presets));
			assert.ok(presets.length > 0);
		});

		it("should get field by key", async () => {
			const indexedLoader = new SchemaLoader({ enableIndexing: true });
			const _schema = await indexedLoader.loadSchema();

			const field = indexedLoader.getField("name");

			assert.ok(field);
			assert.strictEqual(field.key, "name");
		});

		it("should check if tag is deprecated", async () => {
			const indexedLoader = new SchemaLoader({ enableIndexing: true });
			await indexedLoader.loadSchema();

			const deprecated = indexedLoader.getDeprecated();

			assert.ok(Array.isArray(deprecated));
			assert.ok(deprecated.length > 0);

			// Check structure of first deprecated item
			const firstDeprecated = deprecated[0];
			assert.ok(firstDeprecated.old);
			assert.ok(firstDeprecated.replace);
		});
	});
});
