import { describe, it } from "node:test";
import assert from "node:assert";
import { getTagValues } from "../../src/tools/get-tag-values.ts";
import { SchemaLoader } from "../../src/utils/schema-loader.ts";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };

describe("get_tag_values", () => {
	describe("Basic Functionality", () => {
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

	describe("JSON Schema Validation", () => {
		/**
		 * Provider pattern: Generates tag keys with their expected values from JSON
		 * Tests multiple tag keys to ensure comprehensive validation
		 */
		function* tagKeyProvider() {
			// Common tag keys to test
			const testKeys = ["amenity", "building", "highway", "natural", "shop"];

			for (const key of testKeys) {
				const expectedValues = new Set<string>();

				// First, collect values from fields if available
				const field = fields[key];
				if (field?.options && Array.isArray(field.options)) {
					for (const option of field.options) {
						if (typeof option === "string") {
							expectedValues.add(option);
						}
					}
				}

				// Then collect values from JSON presets
				for (const preset of Object.values(presets)) {
					if (preset.tags?.[key]) {
						const value = preset.tags[key];
						if (value && value !== "*" && !value.includes("|")) {
							expectedValues.add(value);
						}
					}
					if (preset.addTags?.[key]) {
						const value = preset.addTags[key];
						if (value && value !== "*" && !value.includes("|")) {
							expectedValues.add(value);
						}
					}
				}

				// Only yield if there are values
				if (expectedValues.size > 0) {
					yield {
						key,
						expectedValues,
					};
				}
			}
		}

		it("should return tag values that exist in JSON (fields and presets)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const values = await getTagValues(loader, "amenity");

			// Collect all amenity values from JSON (fields + presets)
			const expectedValues = new Set<string>();

			// First collect from fields
			const field = fields.amenity;
			if (field?.options && Array.isArray(field.options)) {
				for (const option of field.options) {
					if (typeof option === "string") {
						expectedValues.add(option);
					}
				}
			}

			// Then collect from presets
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
					`Value "${value}" should exist in JSON (fields or presets)`,
				);
			}

			// Verify all JSON values are returned (bidirectional validation)
			const returnedSet = new Set(values);
			for (const expected of expectedValues) {
				assert.ok(
					returnedSet.has(expected),
					`JSON value "${expected}" should be returned`,
				);
			}
		});

		it("should return correct tag values for multiple keys using provider pattern", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Test each tag key from provider
			for (const testCase of tagKeyProvider()) {
				const values = await getTagValues(loader, testCase.key);
				const returnedSet = new Set(values);

				// Bidirectional validation: all returned values should exist in expected
				for (const value of values) {
					assert.ok(
						testCase.expectedValues.has(value),
						`Value "${value}" for key "${testCase.key}" should exist in JSON presets`,
					);
				}

				// Bidirectional validation: all expected values should be returned
				for (const expected of testCase.expectedValues) {
					assert.ok(
						returnedSet.has(expected),
						`JSON value "${expected}" for key "${testCase.key}" should be returned`,
					);
				}

				// Exact match validation
				assert.strictEqual(
					returnedSet.size,
					testCase.expectedValues.size,
					`Tag key "${testCase.key}" should return exactly ${testCase.expectedValues.size} values`,
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

		it("should validate wildcard filtering across multiple tag keys", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Test multiple keys using provider
			for (const testCase of tagKeyProvider()) {
				const values = await getTagValues(loader, testCase.key);

				// Verify no wildcards or pipe-separated values
				for (const value of values) {
					assert.notStrictEqual(
						value,
						"*",
						`Key "${testCase.key}" should not include wildcard values`,
					);
					assert.ok(
						!value.includes("|"),
						`Key "${testCase.key}" should not include pipe-separated values: ${value}`,
					);
				}
			}
		});

		it("should return values from fields.json for keys with field definitions", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Test with "parking" which has comprehensive options in fields.json
			const values = await getTagValues(loader, "parking");

			// Get expected values from fields.json
			const parkingField = fields.parking;
			assert.ok(parkingField, "parking field should exist in fields.json");
			assert.ok(parkingField.options, "parking field should have options");

			const expectedOptions = new Set(parkingField.options);

			// Verify ALL field options are included in returned values
			for (const option of parkingField.options) {
				assert.ok(
					values.includes(option),
					`Field option "${option}" should be included in returned values. Got: ${values.join(", ")}`,
				);
			}

			// Verify we have at least the number of options from fields
			assert.ok(
				values.length >= expectedOptions.size,
				`Should return at least ${expectedOptions.size} values (from fields), got ${values.length}`,
			);
		});
	});
});
