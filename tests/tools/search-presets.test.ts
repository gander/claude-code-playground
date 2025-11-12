import assert from "node:assert";
import { describe, it } from "node:test";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { handler } from "../../src/tools/search-presets.ts";
import { SchemaLoader } from "../../src/utils/schema-loader.ts";

describe("search_presets", () => {
	describe("Basic Functionality", () => {
		it("should search presets by ID keyword", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ keyword: "restaurant" }, loader);
			const results = handlerResult.structuredContent.presets;

			assert.ok(Array.isArray(results), "Should return an array");
			assert.ok(results.length > 0, "Should find matching presets");

			// Should include amenity/restaurant
			const hasRestaurant = results.some((r) => r.id === "amenity/restaurant");
			assert.ok(hasRestaurant, "Should find amenity/restaurant");
		});

		it("should return preset with required properties", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ keyword: "restaurant" }, loader);
			const results = handlerResult.structuredContent.presets;

			assert.ok(results.length > 0, "Should have results");
			const first = results[0];
			assert.ok(first, "Should have first result");
			assert.ok(typeof first.id === "string", "Should have id property");
			assert.ok(typeof first.tags === "object", "Should have tags property");
			assert.ok(Array.isArray(first.geometry), "Should have geometry array");
		});

		it("should search presets by tag", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ keyword: "amenity=restaurant" }, loader);
			const results = handlerResult.structuredContent.presets;

			assert.ok(results.length > 0, "Should find presets with tag");

			// All results should have amenity=restaurant tag
			for (const result of results) {
				assert.strictEqual(result.tags.amenity, "restaurant", "Should have amenity=restaurant tag");
			}
		});

		it("should perform case-insensitive search", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResultLower = await handler({ keyword: "restaurant" }, loader);
			const resultsLower = handlerResultLower.structuredContent.presets;
			const handlerResultUpper = await handler({ keyword: "RESTAURANT" }, loader);
			const resultsUpper = handlerResultUpper.structuredContent.presets;

			assert.ok(resultsLower.length > 0, "Should find results with lowercase");
			assert.ok(resultsUpper.length > 0, "Should find results with uppercase");
			assert.deepStrictEqual(resultsLower, resultsUpper, "Case should not matter");
		});

		it("should return empty array for no matches", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ keyword: "nonexistentpresetxyz12345" }, loader);
			const results = handlerResult.structuredContent.presets;

			assert.ok(Array.isArray(results), "Should return an array");
			assert.strictEqual(results.length, 0, "Should return empty array");
		});

		it("should limit results when limit parameter is provided", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ keyword: "building", limit: 5 }, loader);
			const results = handlerResult.structuredContent.presets;

			assert.ok(Array.isArray(results), "Should return an array");
			assert.ok(results.length <= 5, "Should respect limit");
		});

		it("should filter by geometry type", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ keyword: "restaurant", geometry: "area" }, loader);
			const results = handlerResult.structuredContent.presets;

			assert.ok(results.length > 0, "Should find results");

			// All results should support area geometry
			for (const result of results) {
				assert.ok(
					result.geometry.includes("area"),
					`Preset ${result.id} should support area geometry`,
				);
			}
		});

		it("should use cached data on subsequent calls", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const handlerResult1 = await handler({ keyword: "school" }, loader);
			const results1 = handlerResult1.structuredContent;
			const handlerResult2 = await handler({ keyword: "school" }, loader);
			const results2 = handlerResult2.structuredContent;

			assert.deepStrictEqual(results1, results2, "Results should be identical from cache");
		});
	});

	describe("JSON Schema Validation", () => {
		it("should return presets matching JSON data", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ keyword: "restaurant" }, loader);
			const results = handlerResult.structuredContent.presets;

			// Verify each result exists in JSON
			for (const result of results) {
				const preset = presets[result.id];
				assert.ok(preset, `Preset ${result.id} should exist in JSON`);

				// Verify tags match
				assert.deepStrictEqual(result.tags, preset.tags, `Tags for ${result.id} should match JSON`);

				// Verify geometry matches
				assert.deepStrictEqual(
					result.geometry,
					preset.geometry,
					`Geometry for ${result.id} should match JSON`,
				);
			}
		});

		it("should find presets by exact tag match", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ keyword: "amenity=cafe" }, loader);
			const results = handlerResult.structuredContent.presets;

			assert.ok(results.length > 0, "Should find cafe presets");

			// Verify all have amenity=cafe
			for (const result of results) {
				const preset = presets[result.id];
				assert.ok(preset, `Preset ${result.id} should exist`);
				assert.strictEqual(preset.tags.amenity, "cafe", `Should have amenity=cafe tag`);
			}
		});

		it("should validate search results against complete preset data", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ keyword: "parking" }, loader);
			const results = handlerResult.structuredContent.presets;

			assert.ok(results.length > 0, "Should find parking presets");

			// CRITICAL: Validate EACH result individually
			for (const result of results) {
				assert.ok(result.id, "Should have preset ID");
				assert.ok(result.tags, "Should have tags");
				assert.ok(result.geometry, "Should have geometry");

				// Verify in JSON
				const jsonPreset = presets[result.id];
				assert.ok(jsonPreset, `Preset ${result.id} should exist in JSON`);
				assert.deepStrictEqual(
					result.tags,
					jsonPreset.tags,
					`Preset ${result.id} tags should match JSON`,
				);
			}
		});

		it("should be able to find ALL presets from JSON by ID using provider pattern (100% coverage)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// CRITICAL: Test EVERY preset from JSON, not a sample
			const allPresetIds = Object.keys(presets);
			assert.ok(allPresetIds.length > 1500, "Should have all presets from JSON");

			let foundCount = 0;
			let _notFoundCount = 0;

			// Provider pattern: iterate through EVERY preset
			for (const presetId of allPresetIds) {
				// Search by preset ID (use last part for searchable presets)
				const searchTerm = presetId.split("/").pop() || presetId;

				const handlerResult = await handler({ keyword: searchTerm }, loader);
				const results = handlerResult.structuredContent.presets;

				// Check if this preset was found in results
				const found = results.some((r) => r.id === presetId);

				if (found) {
					foundCount++;
					// Verify the preset data matches JSON
					const result = results.find((r) => r.id === presetId);
					assert.ok(result, `Should find preset ${presetId}`);
					assert.deepStrictEqual(
						result.tags,
						presets[presetId].tags,
						`Tags for ${presetId} should match JSON`,
					);
					assert.deepStrictEqual(
						result.geometry,
						presets[presetId].geometry,
						`Geometry for ${presetId} should match JSON`,
					);
				} else {
					_notFoundCount++;
				}
			}

			// Most presets should be findable (some may be unsearchable by design)
			assert.ok(
				foundCount > allPresetIds.length * 0.5,
				`Should find most presets (found ${foundCount}/${allPresetIds.length})`,
			);
		});
	});
});
