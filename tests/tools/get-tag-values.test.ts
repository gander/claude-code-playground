import assert from "node:assert";
import { describe, it } from "node:test";
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { getTagValues } from "../../src/tools/get-tag-values.ts";

describe("get_tag_values", () => {
	describe("Basic Functionality", () => {
		it("should return values as an array (NEW FORMAT)", async () => {
			const values = await getTagValues("amenity");

			assert.ok(Array.isArray(values), "Should return an array");
			assert.ok(values.length > 0, "Should have at least one value");
		});

		it("should return structured value objects with value and name fields", async () => {
			const values = await getTagValues("amenity");

			assert.ok(Array.isArray(values), "Should return an array");

			// Each item should have value and name
			for (const item of values) {
				assert.ok(typeof item === "object", "Each item should be an object");
				assert.ok("value" in item, "Each item should have a 'value' field");
				assert.ok("name" in item, "Each item should have a 'name' field");
				assert.ok(typeof item.value === "string", "value should be a string");
				assert.ok(typeof item.name === "string", "name should be a string");
			}
		});

		it("should include descriptions when available", async () => {
			// taxi_vehicle field has descriptions for its values
			const values = await getTagValues("taxi_vehicle");

			assert.ok(Array.isArray(values), "Should return an array");
			assert.ok(values.length > 0, "Should have at least one value");

			// At least some values should have descriptions
			const withDescriptions = values.filter((v) => "description" in v && v.description);
			assert.ok(withDescriptions.length > 0, "At least some values should have descriptions");
		});

		it("should return values for a valid tag key", async () => {
			const values = await getTagValues("amenity");

			assert.ok(Array.isArray(values), "Should return an array");
			assert.ok(values.length > 0, "Should have at least one value");
		});

		it("should return unique values only", async () => {
			const values = await getTagValues("amenity");

			const uniqueValues = new Set(values.map((v) => v.value));
			assert.strictEqual(values.length, uniqueValues.size, "Should return unique values only");
		});

		it("should return sorted values", async () => {
			const values = await getTagValues("amenity");

			const valueKeys = values.map((v) => v.value);
			const sorted = [...valueKeys].sort();
			assert.deepStrictEqual(valueKeys, sorted, "Values should be sorted by value field");
		});

		it("should return empty array for non-existent tag key", async () => {
			const values = await getTagValues("nonexistent_tag_key_12345");

			assert.ok(Array.isArray(values), "Should return an array");
			assert.strictEqual(values.length, 0, "Should return empty array");
		});

		it("should use cached data on subsequent calls", async () => {
			const values1 = await getTagValues("amenity");
			const values2 = await getTagValues("amenity");

			assert.deepStrictEqual(values1, values2, "Values should be identical from cache");
		});

		it("should handle tag keys with special characters", async () => {
			// Tags like "addr:street" exist in OSM
			const values = await getTagValues("building");

			assert.ok(Array.isArray(values), "Should handle tag keys");
			// Should not throw error
		});

		it("should accept keys with colon separator (BUG FIX TEST)", async () => {
			// toilets:wheelchair is a field stored as "toilets/wheelchair" in fields map
			// but should accept "toilets:wheelchair" as input (OSM format)
			const values = await getTagValues("toilets:wheelchair");

			assert.ok(Array.isArray(values), "Should return an array");
			assert.ok(values.length > 0, "Should find values for colon-formatted key");

			// Verify values match the field definition
			const toiletsWheelchairField = fields["toilets/wheelchair"];
			if (toiletsWheelchairField?.options) {
				for (const item of values) {
					assert.ok(
						toiletsWheelchairField.options.includes(item.value),
						`Value "${item.value}" should be in field options`,
					);
				}
			}
		});
	});

	describe("JSON Schema Validation", () => {
		/**
		 * Provider pattern: Generates tag keys with their expected values from JSON
		 * Tests ALL tag keys to ensure 100% comprehensive validation (CRITICAL RULE)
		 */
		function* tagKeyProvider() {
			// CRITICAL: Collect ALL unique tag keys from JSON (fields + presets)
			const allKeys = new Set<string>();

			// Collect from fields - use field.key (actual OSM key with colon)
			// not the map key (which uses slash separator)
			for (const field of Object.values(fields)) {
				if (field.key) {
					allKeys.add(field.key);
				}
			}

			// Collect from presets
			for (const preset of Object.values(presets)) {
				if (preset.tags) {
					for (const key of Object.keys(preset.tags)) {
						allKeys.add(key);
					}
				}
				if (preset.addTags) {
					for (const key of Object.keys(preset.addTags)) {
						allKeys.add(key);
					}
				}
			}

			// CRITICAL: Test EVERY key, not just a sample
			for (const key of allKeys) {
				const expectedValues = new Set<string>();

				// First, collect values from fields if available
				// Fields are stored with slash separator, so convert key
				const fieldKeyLookup = key.replace(/:/g, "/");
				const field = fields[fieldKeyLookup];
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
			const values = await getTagValues("amenity");

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
			for (const item of values) {
				assert.ok(
					expectedValues.has(item.value),
					`Value "${item.value}" should exist in JSON (fields or presets)`,
				);
			}

			// Verify all JSON values are returned (bidirectional validation)
			const returnedSet = new Set(values.map((v) => v.value));
			for (const expected of expectedValues) {
				assert.ok(returnedSet.has(expected), `JSON value "${expected}" should be returned`);
			}
		});

		it("should return correct tag values for multiple keys using provider pattern", async () => {
			// Test each tag key from provider
			for (const testCase of tagKeyProvider()) {
				const values = await getTagValues(testCase.key);
				const returnedSet = new Set(values.map((v) => v.value));

				// Bidirectional validation: all returned values should exist in expected
				for (const item of values) {
					assert.ok(
						testCase.expectedValues.has(item.value),
						`Value "${item.value}" for key "${testCase.key}" should exist in JSON presets`,
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
			// Test with a tag that might have wildcards in JSON
			const values = await getTagValues("building");

			// Verify no wildcards or pipe-separated values
			for (const item of values) {
				assert.notStrictEqual(item.value, "*", "Should not include wildcard values");
				assert.ok(
					!item.value.includes("|"),
					`Should not include pipe-separated values: ${item.value}`,
				);
			}
		});

		it("should validate wildcard filtering across multiple tag keys", async () => {
			// Test multiple keys using provider
			for (const testCase of tagKeyProvider()) {
				const values = await getTagValues(testCase.key);

				// Verify no wildcards or pipe-separated values
				for (const item of values) {
					assert.notStrictEqual(
						item.value,
						"*",
						`Key "${testCase.key}" should not include wildcard values`,
					);
					assert.ok(
						!item.value.includes("|"),
						`Key "${testCase.key}" should not include pipe-separated values: ${item.value}`,
					);
				}
			}
		});

		it("should return values from fields.json for keys with field definitions", async () => {
			// Test with "parking" which has comprehensive options in fields.json
			const values = await getTagValues("parking");

			// Get expected values from fields.json
			const parkingField = fields.parking;
			assert.ok(parkingField, "parking field should exist in fields.json");
			assert.ok(parkingField.options, "parking field should have options");

			const expectedOptions = new Set(parkingField.options);
			const returnedValues = values.map((v) => v.value);

			// Verify ALL field options are included in returned values
			for (const option of parkingField.options) {
				assert.ok(
					returnedValues.includes(option),
					`Field option "${option}" should be included in returned values. Got: ${returnedValues.join(", ")}`,
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
