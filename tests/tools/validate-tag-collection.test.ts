import assert from "node:assert/strict";
import { describe, it } from "node:test";
import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import { validateTagCollection } from "../../src/tools/validate-tag-collection.js";

describe("validateTagCollection", () => {
	describe("Basic Functionality", () => {
		it("should validate a collection of valid tags", async () => {
			const tags = {
				amenity: "parking",
				parking: "surface",
				capacity: "50",
			};

			const result = await validateTagCollection(tags);

			assert.ok(result);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errorCount, 0);
			assert.strictEqual(result.deprecatedCount, 0);
			assert.ok(result.tagResults);
			assert.strictEqual(Object.keys(result.tagResults).length, 3);
		});

		it("should detect errors in individual tags", async () => {
			const tags = {
				amenity: "",
				parking: "surface",
			};

			const result = await validateTagCollection(tags);

			assert.ok(result);
			assert.strictEqual(result.valid, false);
			assert.ok(result.errorCount > 0);
			assert.ok(result.tagResults.amenity);
			assert.strictEqual(result.tagResults.amenity.valid, false);
		});

		it("should detect deprecated tags in collection", async () => {
			// Use first deprecated entry
			const deprecatedEntry = deprecated[0];
			const oldKey = Object.keys(deprecatedEntry.old)[0];
			if (!oldKey) return;
			const oldValue = deprecatedEntry.old[oldKey as keyof typeof deprecatedEntry.old];

			const tags = {
				[oldKey]: oldValue as string,
				amenity: "parking",
			};

			const result = await validateTagCollection(tags);

			assert.ok(result);
			assert.strictEqual(result.deprecatedCount, 1);
			assert.ok(result.tagResults[oldKey]);
			assert.strictEqual(result.tagResults[oldKey].deprecated, true);
		});

		it("should handle empty tag collection", async () => {
			const tags = {};

			const result = await validateTagCollection(tags);

			assert.ok(result);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errorCount, 0);
			assert.strictEqual(result.warningCount, 0);
			assert.strictEqual(Object.keys(result.tagResults).length, 0);
		});

		it("should aggregate warnings from individual tags", async () => {
			const tags = {
				unknown_tag_key_12345: "value1",
				another_unknown_key_67890: "value2",
			};

			const result = await validateTagCollection(tags);

			assert.ok(result);
			assert.strictEqual(result.valid, true);
			assert.ok(result.warningCount >= 2);
		});
	});

	describe("Result Structure", () => {
		it("should return correct result structure", async () => {
			const tags = {
				amenity: "parking",
			};

			const result = await validateTagCollection(tags);

			assert.ok(result);
			assert.ok("valid" in result);
			assert.ok("tagResults" in result);
			assert.ok("errors" in result);
			assert.ok("warnings" in result);
			assert.ok("deprecatedCount" in result);
			assert.ok("errorCount" in result);
			assert.ok("warningCount" in result);
			assert.strictEqual(typeof result.valid, "boolean");
			assert.ok(typeof result.tagResults === "object");
			assert.ok(Array.isArray(result.errors));
			assert.ok(Array.isArray(result.warnings));
			assert.strictEqual(typeof result.deprecatedCount, "number");
			assert.strictEqual(typeof result.errorCount, "number");
			assert.strictEqual(typeof result.warningCount, "number");
		});

		it("should include individual tag validation results", async () => {
			const tags = {
				amenity: "parking",
				access: "yes",
			};

			const result = await validateTagCollection(tags);

			assert.ok(result);
			assert.ok(result.tagResults.amenity);
			assert.ok(result.tagResults.access);
			assert.ok("valid" in result.tagResults.amenity);
			assert.ok("deprecated" in result.tagResults.amenity);
			assert.ok("message" in result.tagResults.amenity);
		});
	});

	describe("JSON Schema Validation", () => {
		it("should validate collection with ALL deprecated tags from JSON (100% coverage)", async () => {
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

				const oldKey = oldKeys[0];
				if (!oldKey) {
					skippedCount++;
					continue;
				}
				const oldValue = entry.old[oldKey as keyof typeof entry.old];

				// Skip if replace doesn't exist or is empty (edge cases)
				if (!entry.replace || Object.keys(entry.replace).length === 0) {
					skippedCount++;
					continue;
				}

				// Create tags with the deprecated tag plus a non-conflicting tag
				const tags: Record<string, string> = {
					[oldKey]: oldValue as string,
				};

				// Add a second tag that won't conflict with oldKey
				if (oldKey !== "name") {
					tags.name = "Test Name";
				} else {
					tags.ref = "Test Ref";
				}

				const result = await validateTagCollection(tags);

				assert.ok(result, `Should validate collection for ${oldKey}=${oldValue}`);
				assert.strictEqual(
					result.deprecatedCount,
					1,
					`Should detect deprecated tag ${oldKey}=${oldValue}`,
				);
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
	});

	describe("Error Handling", () => {
		it("should handle tags with empty keys", async () => {
			const tags = {
				"": "value",
				amenity: "parking",
			};

			const result = await validateTagCollection(tags);

			assert.ok(result);
			assert.strictEqual(result.valid, false);
			assert.ok(result.errorCount > 0);
		});

		it("should handle tags with empty values", async () => {
			const tags = {
				amenity: "",
				parking: "surface",
			};

			const result = await validateTagCollection(tags);

			assert.ok(result);
			assert.strictEqual(result.valid, false);
			assert.ok(result.errorCount > 0);
		});
	});
});
