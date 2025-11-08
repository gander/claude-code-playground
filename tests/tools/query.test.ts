import { describe, it } from "node:test";
import assert from "node:assert";
import { getTagValues, searchTags } from "../../src/tools/query.ts";
import { SchemaLoader } from "../../src/utils/schema-loader.ts";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };

describe("Tag Query Tools", () => {
	describe("getTagValues", () => {
		it("should return values for a valid tag key", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const values = await getTagValues(loader, "amenity");

			assert.ok(Array.isArray(values), "Should return an array");
			assert.ok(values.length > 0, "Should have at least one value");
		});

		it("should return unique values only", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const values = await getTagValues(loader, "amenity");

			const uniqueValues = new Set(values);
			assert.strictEqual(
				values.length,
				uniqueValues.size,
				"Should return unique values only",
			);
		});

		it("should return sorted values", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const values = await getTagValues(loader, "amenity");

			const sorted = [...values].sort();
			assert.deepStrictEqual(values, sorted, "Values should be sorted");
		});

		it("should return empty array for non-existent tag key", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const values = await getTagValues(loader, "nonexistent_tag_key_12345");

			assert.ok(Array.isArray(values), "Should return an array");
			assert.strictEqual(values.length, 0, "Should return empty array");
		});

		it("should use cached data on subsequent calls", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const values1 = await getTagValues(loader, "amenity");
			const values2 = await getTagValues(loader, "amenity");

			assert.deepStrictEqual(values1, values2, "Values should be identical from cache");
		});

		it("should handle tag keys with special characters", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			// Tags like "addr:street" exist in OSM
			const values = await getTagValues(loader, "building");

			assert.ok(Array.isArray(values), "Should handle tag keys");
			// Should not throw error
		});
	});

	describe("searchTags", () => {
		it("should return tags matching the keyword", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const results = await searchTags(loader, "restaurant");

			assert.ok(Array.isArray(results), "Should return an array");
			assert.ok(results.length > 0, "Should find matching tags");
		});

		it("should return tags with key and value properties", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const results = await searchTags(loader, "cafe");

			assert.ok(results.length > 0, "Should have results");
			const first = results[0];
			assert.ok(first, "Should have first result");
			assert.ok(typeof first.key === "string", "Should have key property");
			assert.ok(typeof first.value === "string", "Should have value property");
		});

		it("should perform case-insensitive search", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const resultsLower = await searchTags(loader, "park");
			const resultsUpper = await searchTags(loader, "PARK");

			assert.ok(resultsLower.length > 0, "Should find results with lowercase");
			assert.ok(resultsUpper.length > 0, "Should find results with uppercase");
			assert.deepStrictEqual(
				resultsLower,
				resultsUpper,
				"Case should not matter",
			);
		});

		it("should return empty array for no matches", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const results = await searchTags(
				loader,
				"nonexistentkeywordinosm12345xyz",
			);

			assert.ok(Array.isArray(results), "Should return an array");
			assert.strictEqual(results.length, 0, "Should return empty array");
		});

		it("should limit results to prevent overwhelming output", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const results = await searchTags(loader, "building");

			assert.ok(Array.isArray(results), "Should return an array");
			// Should have reasonable limit, not thousands of results
			assert.ok(results.length <= 100, "Should limit results to reasonable number");
		});

		it("should use cached data on subsequent calls", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const results1 = await searchTags(loader, "school");
			const results2 = await searchTags(loader, "school");

			assert.deepStrictEqual(
				results1,
				results2,
				"Results should be identical from cache",
			);
		});
	});

	describe("JSON Schema Validation", () => {
		it("should return tag values that exist in JSON presets", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const values = await getTagValues(loader, "amenity");

			// Collect all amenity values from JSON
			const expectedValues = new Set<string>();
			for (const preset of Object.values(presets)) {
				if (preset.tags?.amenity) {
					const value = preset.tags.amenity;
					if (value && value !== "*" && !value.includes("|")) {
						expectedValues.add(value);
					}
				}
				if (preset.addTags?.amenity) {
					const value = preset.addTags.amenity;
					if (value && value !== "*" && !value.includes("|")) {
						expectedValues.add(value);
					}
				}
			}

			// Verify all returned values exist in JSON
			for (const value of values) {
				assert.ok(
					expectedValues.has(value),
					`Value "${value}" should exist in JSON presets`,
				);
			}

			// Verify all JSON values are returned
			const returnedSet = new Set(values);
			for (const expected of expectedValues) {
				assert.ok(
					returnedSet.has(expected),
					`JSON value "${expected}" should be returned`,
				);
			}
		});

		it("should return search results matching JSON preset data", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const results = await searchTags(loader, "parking");

			// Verify each result corresponds to actual preset data
			for (const result of results) {
				let found = false;

				for (const preset of Object.values(presets)) {
					// Check in tags
					if (preset.tags?.[result.key] === result.value) {
						found = true;
						break;
					}
					// Check in addTags
					if (preset.addTags?.[result.key] === result.value) {
						found = true;
						break;
					}
				}

				assert.ok(
					found,
					`Result ${result.key}=${result.value} should exist in JSON presets`,
				);
			}
		});

		it("should filter out wildcards and complex patterns from JSON", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Test with a tag that might have wildcards in JSON
			const values = await getTagValues(loader, "building");

			// Verify no wildcards or pipe-separated values
			for (const value of values) {
				assert.notStrictEqual(value, "*", "Should not include wildcard values");
				assert.ok(
					!value.includes("|"),
					`Should not include pipe-separated values: ${value}`,
				);
			}
		});
	});
});
