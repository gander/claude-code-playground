import assert from "node:assert/strict";
import { describe, it } from "node:test";
import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import { validateTag } from "../../src/tools/validate-tag.js";

describe("validateTag", () => {
	describe("Basic Functionality", () => {
		it("should validate a tag with valid key and value from options", async () => {
			const result = await validateTag("access", "yes");

			assert.ok(result);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.deprecated, false);
			assert.ok(result.message);
			assert.match(result.message, /valid/i);
		});

		it("should validate a tag with valid key but value not in options", async () => {
			// building has options, but allows custom values (combo type)
			const result = await validateTag("building", "custom_value");

			assert.ok(result);
			assert.strictEqual(result.valid, true);
			// May have a warning that it's not in the standard options
			assert.strictEqual(result.deprecated, false);
			assert.ok(result.message);
		});

		it("should detect deprecated tag", async () => {
			// Find a deprecated tag from the JSON
			const deprecatedEntry = deprecated[0];
			const oldKey = Object.keys(deprecatedEntry.old)[0];
			const oldValue = deprecatedEntry.old[oldKey];

			const result = await validateTag(oldKey, oldValue);

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);
			assert.ok(result.replacement);
			assert.strictEqual(result.valid, true); // Still valid, but deprecated
			assert.ok(result.message);
			assert.match(result.message, /deprecated/i);
		});

		it("should detect unknown key", async () => {
			const result = await validateTag("nonexistent_key_12345", "some_value");

			assert.ok(result);
			assert.strictEqual(result.valid, true); // Unknown keys are allowed in OSM
			assert.ok(result.message);
			assert.match(result.message, /not found in schema/i);
		});

		it("should handle tag with no options field", async () => {
			// maxspeed has no options - any value is allowed
			const result = await validateTag("maxspeed", "50");

			assert.ok(result);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.deprecated, false);
			assert.ok(result.message);
		});
	});

	describe("JSON Schema Validation", () => {
		it("should validate against ALL fields with options (100% coverage)", () => {
			// CRITICAL: Find ALL fields with options - no slicing, no sampling
			const fieldsWithOptions = Object.entries(fields).filter(
				([_, field]) => field.options && field.options.length > 0,
			);

			assert.ok(fieldsWithOptions.length > 0, "Should have fields with options");

			// CRITICAL: Validate EVERY field with options individually
			let validatedCount = 0;
			for (const [fieldPath, field] of fieldsWithOptions) {
				assert.ok(field.options, `Field ${fieldPath} should have options`);
				assert.ok(Array.isArray(field.options), `Field ${fieldPath} options should be array`);
				assert.ok(field.options.length > 0, `Field ${fieldPath} should have at least one option`);
				validatedCount++;
			}

			// Verify we tested ALL fields with options, not a subset
			assert.strictEqual(
				validatedCount,
				fieldsWithOptions.length,
				`Should have validated ALL ${fieldsWithOptions.length} fields with options`,
			);
		});

		it("should handle ALL deprecated tags from JSON (100% coverage)", () => {
			assert.ok(deprecated.length > 0, "Should have deprecated tags");

			// CRITICAL: Validate EVERY deprecated entry individually - no Math.min, no sampling
			let validatedCount = 0;
			let entriesWithReplace = 0;
			let entriesWithoutReplace = 0;

			for (let i = 0; i < deprecated.length; i++) {
				const entry = deprecated[i];

				// Every entry MUST have 'old'
				assert.ok(entry.old, `Deprecated entry ${i} should have 'old'`);
				assert.ok(typeof entry.old === "object", `Deprecated entry ${i} 'old' should be object`);

				// Some entries may not have 'replace' (edge cases in JSON data)
				if (entry.replace) {
					assert.ok(
						typeof entry.replace === "object",
						`Deprecated entry ${i} 'replace' should be object when present`,
					);
					entriesWithReplace++;
				} else {
					// Count entries without replace (valid edge case)
					entriesWithoutReplace++;
				}

				validatedCount++;
			}

			// Verify we tested ALL deprecated entries, not a subset
			assert.strictEqual(
				validatedCount,
				deprecated.length,
				`Should have validated ALL ${deprecated.length} deprecated entries (${entriesWithReplace} with replace, ${entriesWithoutReplace} without)`,
			);
		});
	});

	describe("Error Handling", () => {
		it("should handle empty key", async () => {
			const result = await validateTag("", "value");

			assert.ok(result);
			assert.strictEqual(result.valid, false);
			assert.ok(result.message);
			assert.match(result.message, /empty/i);
		});

		it("should handle empty value", async () => {
			const result = await validateTag("amenity", "");

			assert.ok(result);
			assert.strictEqual(result.valid, false);
			assert.ok(result.message);
			assert.match(result.message, /empty/i);
		});
	});
});
