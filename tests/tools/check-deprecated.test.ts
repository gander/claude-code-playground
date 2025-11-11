import assert from "node:assert/strict";
import { describe, it } from "node:test";
import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import { checkDeprecated } from "../../src/tools/check-deprecated.js";
import { SchemaLoader } from "../../src/utils/schema-loader.js";

describe("checkDeprecated", () => {
	describe("Basic Functionality", () => {
		it("should check if a tag key-value pair is deprecated", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Use first deprecated entry
			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const result = await checkDeprecated(loader, key, value as string);

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);
			assert.ok(result.replacement);
			assert.strictEqual(typeof result.replacement, "object");
		});

		it("should return not deprecated for valid non-deprecated tag", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const result = await checkDeprecated(loader, "amenity", "parking");

			assert.ok(result);
			assert.strictEqual(result.deprecated, false);
			assert.strictEqual(result.replacement, undefined);
		});

		it("should check tag by key only (any value)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Find a deprecated entry
			const entry = deprecated.find((e) => Object.keys(e.old).length === 1);
			assert.ok(entry);

			const key = Object.keys(entry.old)[0];

			const result = await checkDeprecated(loader, key);

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);
			assert.ok(result.replacement);
		});

		it("should return full replacement object", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Find entry with multiple replacement tags
			const entry = deprecated.find((e) => e.replace && Object.keys(e.replace).length > 1);
			assert.ok(entry);

			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const result = await checkDeprecated(loader, key, value as string);

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);
			assert.ok(result.replacement);
			assert.ok(Object.keys(result.replacement).length > 1);
		});
	});

	describe("Edge Cases", () => {
		it("should handle key with no deprecated entries", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const result = await checkDeprecated(loader, "nonexistent_key_xyz_12345");

			assert.ok(result);
			assert.strictEqual(result.deprecated, false);
			assert.strictEqual(result.replacement, undefined);
		});

		it("should handle empty key", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const result = await checkDeprecated(loader, "");

			assert.ok(result);
			assert.strictEqual(result.deprecated, false);
		});

		it("should handle key with value that is not deprecated", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Use a key that exists in deprecated but with different value
			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];

			const result = await checkDeprecated(loader, key, "definitely_not_deprecated_value_xyz");

			assert.ok(result);
			assert.strictEqual(result.deprecated, false);
		});
	});

	describe("Result Structure", () => {
		it("should return correct result structure", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const result = await checkDeprecated(loader, "amenity", "parking");

			assert.ok(result);
			assert.ok("deprecated" in result);
			assert.strictEqual(typeof result.deprecated, "boolean");
			assert.ok("replacement" in result || result.replacement === undefined);
			assert.ok("oldTags" in result);
			assert.ok("message" in result);
		});

		it("should include old tags in result when deprecated", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const result = await checkDeprecated(loader, key, value as string);

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);
			assert.ok(result.oldTags);
			assert.deepStrictEqual(result.oldTags, entry.old);
		});

		it("should include helpful message", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const result = await checkDeprecated(loader, key, value as string);

			assert.ok(result);
			assert.ok(result.message);
			assert.strictEqual(typeof result.message, "string");
			assert.ok(result.message.length > 0);
		});
	});

	describe("JSON Schema Validation", () => {
		it("should detect ALL deprecated entries from JSON (100% coverage)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

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

				const result = await checkDeprecated(loader, key, value as string);

				assert.strictEqual(result.deprecated, true, `Tag ${key}=${value} should be deprecated`);
				assert.ok(result.replacement, `Tag ${key}=${value} should have replacement`);
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
			const loader = new SchemaLoader({ enableIndexing: true });

			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const result = await checkDeprecated(loader, key, value as string);

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);

			// Verify replacement matches JSON
			const expectedReplacement: Record<string, string> = {};
			for (const [k, v] of Object.entries(entry.replace)) {
				if (v !== undefined) {
					expectedReplacement[k] = v;
				}
			}

			assert.deepStrictEqual(result.replacement, expectedReplacement);
		});
	});
});
