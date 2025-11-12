import assert from "node:assert";
import { describe, it } from "node:test";
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { getTagInfo } from "../../src/tools/get-tag-info.ts";

describe("get_tag_info", () => {
	describe("Basic Functionality", () => {
		it("should return info for a valid tag key with field definition", async () => {
			const info = await getTagInfo("parking");

			assert.ok(info, "Should return tag info");
			assert.strictEqual(info.key, "parking", "Should return correct key");
			assert.ok(Array.isArray(info.values), "Should return values array");
			assert.ok(info.values.length > 0, "Should have at least one value");
			assert.strictEqual(info.hasFieldDefinition, true, "parking should have field definition");
			assert.ok(info.type, "Should have type from field definition");
		});

		it("should return info for a tag key without field definition", async () => {
			const info = await getTagInfo("amenity");

			assert.ok(info, "Should return tag info");
			assert.strictEqual(info.key, "amenity", "Should return correct key");
			assert.ok(Array.isArray(info.values), "Should return values array");
			assert.ok(info.values.length > 0, "Should have at least one value");
		});

		it("should return sorted values", async () => {
			const info = await getTagInfo("parking");

			const sorted = [...info.values].sort();
			assert.deepStrictEqual(info.values, sorted, "Values should be sorted alphabetically");
		});

		it("should return unique values only", async () => {
			const info = await getTagInfo("building");

			const uniqueValues = new Set(info.values);
			assert.strictEqual(info.values.length, uniqueValues.size, "Should return unique values only");
		});

		it("should handle non-existent tag key", async () => {
			const info = await getTagInfo("nonexistent_tag_key_12345");

			assert.ok(info, "Should return tag info even for non-existent key");
			assert.strictEqual(info.key, "nonexistent_tag_key_12345", "Should return correct key");
			assert.ok(Array.isArray(info.values), "Should return values array");
			assert.strictEqual(info.values.length, 0, "Should have no values");
			assert.strictEqual(info.hasFieldDefinition, false, "Should not have field definition");
		});

		it("should accept keys with colon separator (BUG FIX TEST)", async () => {
			// toilets:wheelchair is a field stored as "toilets/wheelchair" in fields map
			// but should accept "toilets:wheelchair" as input (OSM format)
			const info = await getTagInfo("toilets:wheelchair");

			assert.ok(info, "Should return tag info");
			assert.strictEqual(info.key, "toilets:wheelchair", "Should return key with colon separator");
			assert.strictEqual(info.hasFieldDefinition, true, "Should find field definition");
			assert.ok(info.values.length > 0, "Should have values from field options");
		});

		it("should return keys with colon separator (BUG FIX TEST)", async () => {
			// Test that returned key uses colon, not slash
			const info = await getTagInfo("toilets:wheelchair");

			assert.ok(info, "Should return tag info");
			assert.ok(!info.key.includes("/"), "Returned key should not contain slash separator");
			assert.ok(info.key.includes(":"), "Returned key should contain colon separator");
		});

		it("should use cached data on subsequent calls", async () => {
			const info1 = await getTagInfo("amenity");
			const info2 = await getTagInfo("amenity");

			assert.deepStrictEqual(info1, info2, "Should return identical data from cache");
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
				let hasFieldDef = false;
				let fieldType: string | undefined;

				// First, collect values from fields if available
				// Fields are stored with slash separator, so convert key
				const fieldKeyLookup = key.replace(/:/g, "/");
				const field = fields[fieldKeyLookup];
				if (field) {
					hasFieldDef = true;
					fieldType = field.type;

					if (field.options && Array.isArray(field.options)) {
						for (const option of field.options) {
							if (typeof option === "string") {
								expectedValues.add(option);
							}
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

				// Only yield if there are values or field definition
				if (expectedValues.size > 0 || hasFieldDef) {
					yield {
						key,
						expectedValues,
						hasFieldDefinition: hasFieldDef,
						fieldType,
					};
				}
			}
		}

		it("should return ALL values matching JSON data (fields + presets)", async () => {
			// Test parking which has comprehensive field definition
			const info = await getTagInfo("parking");

			// Collect expected values from JSON
			const expectedValues = new Set<string>();

			// From fields
			const field = fields.parking;
			if (field?.options && Array.isArray(field.options)) {
				for (const option of field.options) {
					if (typeof option === "string") {
						expectedValues.add(option);
					}
				}
			}

			// From presets
			for (const preset of Object.values(presets)) {
				if (preset.tags?.parking) {
					const value = preset.tags.parking;
					if (value && value !== "*" && !value.includes("|")) {
						expectedValues.add(value);
					}
				}
				if (preset.addTags?.parking) {
					const value = preset.addTags.parking;
					if (value && value !== "*" && !value.includes("|")) {
						expectedValues.add(value);
					}
				}
			}

			// CRITICAL: Validate EACH returned value exists in JSON (100% coverage)
			for (const value of info.values) {
				assert.ok(
					expectedValues.has(value),
					`Value "${value}" should exist in JSON (fields or presets)`,
				);
			}

			// CRITICAL: Bidirectional validation - ALL JSON values should be returned
			const returnedSet = new Set(info.values);
			for (const expected of expectedValues) {
				assert.ok(returnedSet.has(expected), `JSON value "${expected}" should be returned by tool`);
			}

			// Exact count match
			assert.strictEqual(
				info.values.length,
				expectedValues.size,
				`Should return exactly ${expectedValues.size} values`,
			);
		});

		it("should validate ALL tag keys using provider pattern (100% coverage)", async () => {
			// CRITICAL: Test EVERY tag key from provider, NO sampling
			for (const testCase of tagKeyProvider()) {
				const info = await getTagInfo(testCase.key);

				// Validate hasFieldDefinition matches JSON
				assert.strictEqual(
					info.hasFieldDefinition,
					testCase.hasFieldDefinition,
					`Key "${testCase.key}" field definition flag should match JSON`,
				);

				// Validate type if field exists
				if (testCase.hasFieldDefinition && testCase.fieldType) {
					assert.strictEqual(
						info.type,
						testCase.fieldType,
						`Key "${testCase.key}" type should match field definition`,
					);
				}

				const returnedSet = new Set(info.values);

				// CRITICAL: Validate EACH returned value individually
				for (const value of info.values) {
					assert.ok(
						testCase.expectedValues.has(value),
						`Value "${value}" for key "${testCase.key}" should exist in JSON`,
					);
				}

				// CRITICAL: Bidirectional validation - validate EACH expected value
				for (const expected of testCase.expectedValues) {
					assert.ok(
						returnedSet.has(expected),
						`JSON value "${expected}" for key "${testCase.key}" should be returned`,
					);
				}

				// Exact count match
				assert.strictEqual(
					info.values.length,
					testCase.expectedValues.size,
					`Key "${testCase.key}" should return exactly ${testCase.expectedValues.size} values`,
				);
			}
		});

		it("should filter out wildcards and complex patterns from JSON", async () => {
			// Test with building which might have wildcards
			const info = await getTagInfo("building");

			// CRITICAL: Verify EACH value individually (NO wildcards, NO pipes)
			for (const value of info.values) {
				assert.notStrictEqual(value, "*", `Should not include wildcard: ${value}`);
				assert.ok(!value.includes("|"), `Should not include pipe-separated value: ${value}`);
			}
		});

		it("should validate field definition properties from JSON", async () => {
			// Test parking which has field definition
			const info = await getTagInfo("parking");
			const parkingField = fields.parking;

			assert.ok(parkingField, "parking field should exist in fields.json");
			assert.strictEqual(info.hasFieldDefinition, true, "Should have field definition");
			assert.strictEqual(info.type, parkingField.type, "Type should match field definition");

			// CRITICAL: Validate ALL field options are included
			if (parkingField.options && Array.isArray(parkingField.options)) {
				for (const option of parkingField.options) {
					assert.ok(
						info.values.includes(option),
						`Field option "${option}" should be included in values`,
					);
				}
			}
		});
	});
});
