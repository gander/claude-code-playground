import assert from "node:assert";
import { describe, it } from "node:test";
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import strings from "@openstreetmap/id-tagging-schema/dist/translations/en.json" with {
	type: "json",
};
import { getTagInfo } from "../../src/tools/get-tag-info.ts";

describe("get_tag_info", () => {
	describe("Basic Functionality", () => {
		it("should return info for a valid tag key with field definition", async () => {
			const info = await getTagInfo("parking");

			assert.ok(info, "Should return tag info");
			assert.strictEqual(info.key, "parking", "Should return correct key");
			assert.ok(
				typeof info.values === "object" && !Array.isArray(info.values),
				"Should return values object",
			);
			assert.ok(Object.keys(info.values).length > 0, "Should have at least one value");
			assert.strictEqual(info.hasFieldDefinition, true, "parking should have field definition");
			assert.ok(info.type, "Should have type from field definition");
		});

		it("should return info for a tag key without field definition", async () => {
			const info = await getTagInfo("amenity");

			assert.ok(info, "Should return tag info");
			assert.strictEqual(info.key, "amenity", "Should return correct key");
			assert.ok(
				typeof info.values === "object" && !Array.isArray(info.values),
				"Should return values object",
			);
			assert.ok(Object.keys(info.values).length > 0, "Should have at least one value");
		});

		it("should return sorted values", async () => {
			const info = await getTagInfo("parking");

			const keys = Object.keys(info.values);
			const sorted = [...keys].sort();
			assert.deepStrictEqual(keys, sorted, "Value keys should be sorted alphabetically");
		});

		it("should return unique values only", async () => {
			const info = await getTagInfo("building");

			const keys = Object.keys(info.values);
			const uniqueValues = new Set(keys);
			assert.strictEqual(keys.length, uniqueValues.size, "Should return unique values only");
		});

		it("should handle non-existent tag key", async () => {
			const info = await getTagInfo("nonexistent_tag_key_12345");

			assert.ok(info, "Should return tag info even for non-existent key");
			assert.strictEqual(info.key, "nonexistent_tag_key_12345", "Should return correct key");
			assert.ok(
				typeof info.values === "object" && !Array.isArray(info.values),
				"Should return values object",
			);
			assert.strictEqual(Object.keys(info.values).length, 0, "Should have no values");
			assert.strictEqual(info.hasFieldDefinition, false, "Should not have field definition");
		});

		it("should accept keys with colon separator (BUG FIX TEST)", async () => {
			// toilets:wheelchair is a field stored as "toilets/wheelchair" in fields map
			// but should accept "toilets:wheelchair" as input (OSM format)
			const info = await getTagInfo("toilets:wheelchair");

			assert.ok(info, "Should return tag info");
			assert.strictEqual(info.key, "toilets:wheelchair", "Should return key with colon separator");
			assert.strictEqual(info.hasFieldDefinition, true, "Should find field definition");
			assert.ok(Object.keys(info.values).length > 0, "Should have values from field options");
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
			const returnedValueKeys = Object.keys(info.values);
			for (const value of returnedValueKeys) {
				assert.ok(
					expectedValues.has(value),
					`Value "${value}" should exist in JSON (fields or presets)`,
				);
			}

			// CRITICAL: Bidirectional validation - ALL JSON values should be returned
			const returnedSet = new Set(returnedValueKeys);
			for (const expected of expectedValues) {
				assert.ok(returnedSet.has(expected), `JSON value "${expected}" should be returned by tool`);
			}

			// Exact count match
			assert.strictEqual(
				returnedValueKeys.length,
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

				const returnedValueKeys = Object.keys(info.values);
				const returnedSet = new Set(returnedValueKeys);

				// CRITICAL: Validate EACH returned value individually
				for (const value of returnedValueKeys) {
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
					returnedValueKeys.length,
					testCase.expectedValues.size,
					`Key "${testCase.key}" should return exactly ${testCase.expectedValues.size} values`,
				);
			}
		});

		it("should filter out wildcards and complex patterns from JSON", async () => {
			// Test with building which might have wildcards
			const info = await getTagInfo("building");

			// CRITICAL: Verify EACH value individually (NO wildcards, NO pipes)
			const valueKeys = Object.keys(info.values);
			for (const value of valueKeys) {
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
			const valueKeys = Object.keys(info.values);
			if (parkingField.options && Array.isArray(parkingField.options)) {
				for (const option of parkingField.options) {
					assert.ok(
						valueKeys.includes(option),
						`Field option "${option}" should be included in values`,
					);
				}
			}
		});
	});

	describe("Structured Value Information (TDD RED)", () => {
		it("should return field label as name for fields with definitions", async () => {
			const info = await getTagInfo("parking");

			// Get expected label from translations
			const fieldStrings = strings.en.presets.fields.parking;
			const expectedLabel = fieldStrings?.label;

			assert.ok(info.name, "Should have name field");
			assert.strictEqual(info.name, expectedLabel, `Should return field label "${expectedLabel}"`);
		});

		it("should return values as objects with titles from translations", async () => {
			const info = await getTagInfo("parking");

			// Get expected options from translations
			const fieldStrings = strings.en.presets.fields.parking;
			const expectedOptions = fieldStrings?.options;

			assert.ok(expectedOptions, "parking field should have options in translations");
			assert.ok(
				typeof info.values === "object" && !Array.isArray(info.values),
				"values should be an object, not array",
			);

			// Check that each value has a title
			for (const [valueKey, valueData] of Object.entries(info.values)) {
				assert.ok(typeof valueData === "object", `Value "${valueKey}" should be an object`);
				assert.ok(valueData.title, `Value "${valueKey}" should have a title`);

				// Verify title matches translation
				const expectedTitle =
					typeof expectedOptions[valueKey] === "string"
						? expectedOptions[valueKey]
						: expectedOptions[valueKey]?.title;

				assert.strictEqual(
					valueData.title,
					expectedTitle,
					`Value "${valueKey}" title should match translation`,
				);
			}
		});

		it("should include descriptions when available in translations", async () => {
			// taxi_vehicle field has descriptions in translations
			const info = await getTagInfo("taxi_vehicle");

			const fieldStrings = strings.en.presets.fields.taxi_vehicle;
			const expectedOptions = fieldStrings?.options;

			assert.ok(expectedOptions, "taxi_vehicle field should have options in translations");

			// Check that motorcar has description
			assert.ok(info.values.motorcar, "Should have motorcar value");
			assert.ok(info.values.motorcar.title, "motorcar should have title");
			assert.ok(info.values.motorcar.description, "motorcar should have description");

			// Verify description matches translation
			const expectedMotorcarData = expectedOptions.motorcar;
			assert.strictEqual(
				info.values.motorcar.description,
				expectedMotorcarData.description,
				"motorcar description should match translation",
			);
		});

		it("should handle fields with string-only options (no descriptions)", async () => {
			const info = await getTagInfo("parking");

			const fieldStrings = strings.en.presets.fields.parking;
			const expectedOptions = fieldStrings?.options;

			// parking options are just strings in translations, not objects with descriptions
			for (const [valueKey, valueData] of Object.entries(info.values)) {
				assert.ok(valueData.title, `Value "${valueKey}" should have title`);

				// For parking, options are strings, so no description should be present
				const translationValue = expectedOptions[valueKey];
				if (typeof translationValue === "string") {
					assert.strictEqual(
						valueData.description,
						undefined,
						`Value "${valueKey}" should not have description when translation is just a string`,
					);
				}
			}
		});

		it("should validate ALL values have translations", async () => {
			// Test with a field that has comprehensive translations
			const info = await getTagInfo("parking");

			const fieldStrings = strings.en.presets.fields.parking;
			const expectedOptions = fieldStrings?.options;

			assert.ok(expectedOptions, "Field should have options in translations");

			// CRITICAL: Verify EACH value individually has a translation
			for (const [valueKey, valueData] of Object.entries(info.values)) {
				assert.ok(
					expectedOptions[valueKey],
					`Value "${valueKey}" should have translation in en.json`,
				);
				assert.ok(
					valueData.title,
					`Value "${valueKey}" should have title extracted from translation`,
				);
			}
		});

		it("should fall back gracefully for values without translations", async () => {
			// Some values from presets might not have translations in field options
			const info = await getTagInfo("amenity");

			// amenity has many values from presets, not all will be in field options
			assert.ok(typeof info.values === "object", "values should be an object");

			// Each value should still have at least a title (even if it's the key itself as fallback)
			for (const [valueKey, valueData] of Object.entries(info.values)) {
				assert.ok(valueData.title, `Value "${valueKey}" should have title (possibly fallback)`);
			}
		});
	});
});
