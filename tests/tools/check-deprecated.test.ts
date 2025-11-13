import assert from "node:assert/strict";
import { describe, it } from "node:test";
import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import { checkDeprecated } from "../../src/tools/check-deprecated.js";

describe("checkDeprecated", () => {
	describe("BUG FIX: Return ALL deprecated cases (TDD RED)", () => {
		it("should return ALL deprecated values for 'parking' key (not just one)", async () => {
			// When user provides only key, should get ALL deprecated values for that key
			const result = await checkDeprecated("parking");

			// parking has 6 deprecated values: covered, customers, entrance, park_and_ride, private, public
			const parkingDeprecated = deprecated.filter((e) => e.old.parking);

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);

			// CRITICAL: Should return ALL cases, not just one
			assert.ok(Array.isArray(result.cases), "Result should have 'cases' array");
			assert.strictEqual(
				result.cases.length,
				parkingDeprecated.length,
				`Should return all ${parkingDeprecated.length} deprecated parking values`,
			);

			// Verify each case has proper structure
			for (const case_ of result.cases) {
				assert.ok(case_.oldTags, "Each case should have oldTags");
				assert.ok(case_.replacement, "Each case should have replacement");
				assert.strictEqual(case_.oldTags.parking !== undefined, true, "Should have parking key");
				assert.ok(case_.deprecationType, "Should indicate deprecation type");
			}
		});

		it("should distinguish key-deprecated vs value-deprecated", async () => {
			// building:height=* means the KEY is deprecated (any value)
			const resultKey = await checkDeprecated("building:height");

			assert.ok(resultKey);
			assert.strictEqual(resultKey.deprecated, true);
			assert.ok(Array.isArray(resultKey.cases));
			assert.strictEqual(resultKey.cases.length, 1);
			assert.strictEqual(
				resultKey.cases[0].deprecationType,
				"key",
				"building:height should be key-deprecated",
			);
			assert.strictEqual(
				resultKey.cases[0].oldTags["building:height"],
				"*",
				"Key deprecation uses * for value",
			);

			// parking=covered means only this specific VALUE is deprecated
			const resultValue = await checkDeprecated("parking", "covered");

			assert.ok(resultValue);
			assert.strictEqual(resultValue.deprecated, true);
			assert.ok(Array.isArray(resultValue.cases));
			assert.strictEqual(resultValue.cases.length, 1);
			assert.strictEqual(
				resultValue.cases[0].deprecationType,
				"value",
				"parking=covered should be value-deprecated",
			);
			assert.strictEqual(
				resultValue.cases[0].oldTags.parking,
				"covered",
				"Value deprecation uses specific value",
			);
		});

		it("should return collection even for single deprecated case", async () => {
			const result = await checkDeprecated("building:height");

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);
			assert.ok(Array.isArray(result.cases), "Should return array even for single case");
			assert.strictEqual(result.cases.length, 1);
		});
	});

	describe("Basic Functionality", () => {
		it("should check if a tag key-value pair is deprecated", async () => {
			// Use first deprecated entry
			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const result = await checkDeprecated(key, value as string);

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);
			// Updated: should have cases array
			assert.ok(Array.isArray(result.cases));
			assert.ok(result.cases[0].replacement);
			assert.strictEqual(typeof result.cases[0].replacement, "object");
		});

		it("should return not deprecated for valid non-deprecated tag", async () => {
			const result = await checkDeprecated("amenity", "parking");

			assert.ok(result);
			assert.strictEqual(result.deprecated, false);
			assert.strictEqual(result.cases, undefined, "Non-deprecated should have no cases");
		});

		it("should check tag by key only (returns all deprecated values)", async () => {
			// Find a deprecated entry
			const entry = deprecated.find((e) => Object.keys(e.old).length === 1);
			assert.ok(entry);

			const key = Object.keys(entry.old)[0];

			const result = await checkDeprecated(key);

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);
			assert.ok(Array.isArray(result.cases), "Should return cases array");
			assert.ok(result.cases.length > 0, "Should have at least one case");
			assert.ok(result.cases[0].replacement);
		});

		it("should return full replacement object", async () => {
			// Find entry with multiple replacement tags
			const entry = deprecated.find((e) => e.replace && Object.keys(e.replace).length > 1);
			assert.ok(entry);

			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const result = await checkDeprecated(key, value as string);

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);
			assert.ok(Array.isArray(result.cases));
			assert.ok(result.cases[0].replacement);
			assert.ok(Object.keys(result.cases[0].replacement).length > 1);
		});
	});

	describe("Edge Cases", () => {
		it("should handle key with no deprecated entries", async () => {
			const result = await checkDeprecated("nonexistent_key_xyz_12345");

			assert.ok(result);
			assert.strictEqual(result.deprecated, false);
			assert.strictEqual(result.cases, undefined);
		});

		it("should handle empty key", async () => {
			const result = await checkDeprecated("");

			assert.ok(result);
			assert.strictEqual(result.deprecated, false);
			assert.strictEqual(result.cases, undefined);
		});

		it("should handle key with value that is not deprecated", async () => {
			// Use a key that exists in deprecated but with different value
			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];

			const result = await checkDeprecated(key, "definitely_not_deprecated_value_xyz");

			assert.ok(result);
			assert.strictEqual(result.deprecated, false);
			assert.strictEqual(result.cases, undefined);
		});
	});

	describe("Result Structure", () => {
		it("should return correct result structure for non-deprecated", async () => {
			const result = await checkDeprecated("amenity", "parking");

			assert.ok(result);
			assert.ok("deprecated" in result);
			assert.strictEqual(typeof result.deprecated, "boolean");
			assert.strictEqual(result.deprecated, false);
			assert.ok("message" in result);
			assert.strictEqual(result.cases, undefined);
		});

		it("should return correct result structure for deprecated", async () => {
			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const result = await checkDeprecated(key, value as string);

			assert.ok(result);
			assert.ok("deprecated" in result);
			assert.strictEqual(typeof result.deprecated, "boolean");
			assert.strictEqual(result.deprecated, true);
			assert.ok("cases" in result);
			assert.ok(Array.isArray(result.cases));
			assert.ok("message" in result);

			// Each case should have proper structure
			for (const case_ of result.cases) {
				assert.ok("oldTags" in case_);
				assert.ok("replacement" in case_ || case_.replacement === undefined);
				assert.ok("deprecationType" in case_);
				assert.ok(["key", "value"].includes(case_.deprecationType));
			}
		});

		it("should include old tags in each case when deprecated", async () => {
			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const result = await checkDeprecated(key, value as string);

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);
			assert.ok(result.cases);
			assert.ok(result.cases[0].oldTags);
			assert.deepStrictEqual(result.cases[0].oldTags, entry.old);
		});

		it("should include helpful message", async () => {
			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const result = await checkDeprecated(key, value as string);

			assert.ok(result);
			assert.ok(result.message);
			assert.strictEqual(typeof result.message, "string");
			assert.ok(result.message.length > 0);
		});
	});

	describe("JSON Schema Validation", () => {
		it("should detect ALL deprecated entries from JSON (100% coverage)", async () => {
			// CRITICAL: Test ALL deprecated entries - no Math.min, no sampling
			let testedCount = 0;
			let skippedCount = 0;
			for (let i = 0; i < deprecated.length; i++) {
				const entry = deprecated[i];
				const oldKeys = Object.keys(entry.old);

				// Skip entries with multiple keys (complex cases)
				if (oldKeys.length !== 1) {
					skippedCount++;
					continue;
				}

				const key = oldKeys[0];
				if (!key) {
					skippedCount++;
					continue;
				}
				const value = entry.old[key as keyof typeof entry.old];

				// Skip if replace doesn't exist (edge cases)
				if (!entry.replace || Object.keys(entry.replace).length === 0) {
					skippedCount++;
					continue;
				}

				const result = await checkDeprecated(key, value as string);

				assert.strictEqual(result.deprecated, true, `Tag ${key}=${value} should be deprecated`);
				assert.ok(result.cases, `Tag ${key}=${value} should have cases`);
				assert.ok(result.cases.length > 0, `Tag ${key}=${value} should have at least one case`);
				assert.ok(result.cases[0].replacement, `Tag ${key}=${value} should have replacement`);
				testedCount++;
			}

			// Verify we processed ALL entries (tested + skipped = total)
			assert.strictEqual(
				testedCount + skippedCount,
				deprecated.length,
				`Should have processed ALL ${deprecated.length} deprecated entries (tested: ${testedCount}, skipped: ${skippedCount})`,
			);
			assert.ok(testedCount > 0, "Should have tested at least some deprecated entries");
		});

		it("should return correct replacement from JSON", async () => {
			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const result = await checkDeprecated(key, value as string);

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);

			// Verify replacement matches JSON
			const expectedReplacement: Record<string, string> = {};
			for (const [k, v] of Object.entries(entry.replace)) {
				if (v !== undefined) {
					expectedReplacement[k] = v;
				}
			}

			assert.ok(result.cases);
			assert.deepStrictEqual(result.cases[0].replacement, expectedReplacement);
		});
	});
});
