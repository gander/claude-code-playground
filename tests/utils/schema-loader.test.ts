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

	describe("optimizations", () => {
		describe("preloading", () => {
			it("should support warmup/preload method", async () => {
				const preloadLoader = new SchemaLoader();

				// warmup() should load and cache the schema
				await preloadLoader.warmup();

				// Subsequent loadSchema() should return cached data instantly
				const schema = await preloadLoader.loadSchema();

				assert.ok(schema);
				assert.ok(schema.presets);
				assert.ok(schema.fields);
			});

			it("should build index during warmup", async () => {
				const preloadLoader = new SchemaLoader();

				await preloadLoader.warmup();

				// Index should be available after warmup
				const index = preloadLoader.getIndex();

				assert.ok(index);
				assert.ok(index.byKey.size > 0);
				assert.ok(index.byTag.size > 0);
				assert.ok(index.byGeometry.size > 0);
			});

			it("should make warmup() idempotent", async () => {
				const preloadLoader = new SchemaLoader();

				// Call warmup multiple times
				await preloadLoader.warmup();
				const schema1 = await preloadLoader.loadSchema();

				await preloadLoader.warmup();
				const schema2 = await preloadLoader.loadSchema();

				// Should return the same cached instance
				assert.strictEqual(schema1, schema2);
			});
		});

		describe("always build index", () => {
			it("should always build index by default", async () => {
				// Create loader without explicit enableIndexing
				const defaultLoader = new SchemaLoader();
				await defaultLoader.loadSchema();

				// Index should be available without enableIndexing flag
				const index = defaultLoader.getIndex();

				assert.ok(index);
				assert.ok(index.byKey.size > 0);
			});

			it("should not throw when getting index after load", async () => {
				const defaultLoader = new SchemaLoader();
				await defaultLoader.loadSchema();

				// Should not throw - index is always built
				assert.doesNotThrow(() => {
					defaultLoader.getIndex();
				});
			});
		});

		describe("field key index", () => {
			it("should index all field keys for fast lookup", async () => {
				const indexedLoader = new SchemaLoader();
				await indexedLoader.loadSchema();

				const index = indexedLoader.getIndex();

				// Field key index should exist
				assert.ok(index.byFieldKey);
				assert.ok(index.byFieldKey instanceof Map);
				assert.ok(index.byFieldKey.size > 0);
			});

			it("should map OSM tag keys to field definitions", async () => {
				const indexedLoader = new SchemaLoader();
				await indexedLoader.loadSchema();

				const index = indexedLoader.getIndex();

				// Check that common fields are indexed by their OSM tag key
				assert.ok(index.byFieldKey.has("name"));
				assert.ok(index.byFieldKey.has("amenity"));

				// Get field via index
				const nameField = index.byFieldKey.get("name");
				assert.ok(nameField);
				assert.strictEqual(nameField.key, "name");
			});

			it("should support fast field lookups using index", async () => {
				const indexedLoader = new SchemaLoader();
				await indexedLoader.loadSchema();

				// New optimized method using index
				const field = indexedLoader.findFieldByKey("name");

				assert.ok(field);
				assert.strictEqual(field.key, "name");
			});

			it("should return undefined for non-existent field keys", async () => {
				const indexedLoader = new SchemaLoader();
				await indexedLoader.loadSchema();

				const field = indexedLoader.findFieldByKey("nonexistent_key_12345");

				assert.strictEqual(field, undefined);
			});
		});

		describe("performance", () => {
			it("should build index during schema load (single pass)", async () => {
				const optimizedLoader = new SchemaLoader();

				// Track that index is built during loadSchema, not after
				const startTime = Date.now();
				await optimizedLoader.loadSchema();
				const loadTime = Date.now() - startTime;

				// Index should be immediately available
				const index = optimizedLoader.getIndex();
				assert.ok(index);

				// Getting index should be instant (already built)
				const indexStartTime = Date.now();
				optimizedLoader.getIndex();
				const indexTime = Date.now() - indexStartTime;

				// Index access should be < 1ms (already built during load)
				assert.ok(indexTime < 5, `Index access took ${indexTime}ms, should be instant`);

				// Just verify load completed reasonably fast
				assert.ok(
					loadTime < 5000,
					`Schema load took ${loadTime}ms, should complete in reasonable time`,
				);
			});
		});
	});
});
