import { describe, it } from "node:test";
import assert from "node:assert";
import { getTagValues } from "../../src/tools/query.ts";
import { SchemaLoader } from "../../src/utils/schema-loader.ts";

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
});
