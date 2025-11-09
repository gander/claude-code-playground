import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SchemaLoader } from "../../src/utils/schema-loader.js";
import { validateTag } from "../../src/tools/validate-tag.js";
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with { type: "json" };

describe("validateTag", () => {
	describe("Basic Functionality", () => {
		it("should validate a tag with valid key and value from options", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await validateTag(loader, "access", "yes");

			assert.ok(result);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.deprecated, false);
			assert.deepStrictEqual(result.errors, []);
			assert.deepStrictEqual(result.warnings, []);
		});

		it("should validate a tag with valid key but value not in options", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			// building has options, but allows custom values (combo type)
			const result = await validateTag(loader, "building", "custom_value");

			assert.ok(result);
			assert.strictEqual(result.valid, true);
			// May have a warning that it's not in the standard options
			assert.strictEqual(result.deprecated, false);
		});

		it("should detect deprecated tag", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			// Find a deprecated tag from the JSON
			const deprecatedEntry = deprecated[0];
			const oldKey = Object.keys(deprecatedEntry.old)[0];
			const oldValue = deprecatedEntry.old[oldKey];

			const result = await validateTag(loader, oldKey, oldValue);

			assert.ok(result);
			assert.strictEqual(result.deprecated, true);
			assert.ok(result.replacement);
			assert.strictEqual(result.valid, true); // Still valid, but deprecated
		});

		it("should detect unknown key", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await validateTag(
				loader,
				"nonexistent_key_12345",
				"some_value",
			);

			assert.ok(result);
			assert.strictEqual(result.valid, true); // Unknown keys are allowed in OSM
			assert.ok(result.warnings.length > 0);
			assert.ok(
				result.warnings.some((w) => w.includes("not found in schema")),
			);
		});

		it("should handle tag with no options field", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			// maxspeed has no options - any value is allowed
			const result = await validateTag(loader, "maxspeed", "50");

			assert.ok(result);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.deprecated, false);
		});
	});

	describe("JSON Schema Validation", () => {
		it("should validate against fields with options", () => {
			// Find fields with options
			const fieldsWithOptions = Object.entries(fields)
				.filter(([_, field]) => field.options && field.options.length > 0)
				.slice(0, 10); // Test first 10

			assert.ok(fieldsWithOptions.length > 0, "Should have fields with options");

			for (const [fieldPath, field] of fieldsWithOptions) {
				assert.ok(field.options, `Field ${fieldPath} should have options`);
				assert.ok(
					Array.isArray(field.options),
					`Field ${fieldPath} options should be array`,
				);
				assert.ok(
					field.options.length > 0,
					`Field ${fieldPath} should have at least one option`,
				);
			}
		});

		it("should handle all deprecated tags from JSON", () => {
			assert.ok(deprecated.length > 0, "Should have deprecated tags");
			assert.ok(deprecated.length > 500, "Should have many deprecated tags");

			// Verify structure
			for (let i = 0; i < Math.min(50, deprecated.length); i++) {
				const entry = deprecated[i];
				assert.ok(entry.old, `Deprecated entry ${i} should have 'old'`);
				assert.ok(
					entry.replace,
					`Deprecated entry ${i} should have 'replace'`,
				);
				assert.ok(
					typeof entry.old === "object",
					`Deprecated entry ${i} 'old' should be object`,
				);
				assert.ok(
					typeof entry.replace === "object",
					`Deprecated entry ${i} 'replace' should be object`,
				);
			}
		});
	});

	describe("Error Handling", () => {
		it("should handle empty key", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await validateTag(loader, "", "value");

			assert.ok(result);
			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.length > 0);
			assert.ok(result.errors.some((e) => e.includes("empty")));
		});

		it("should handle empty value", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await validateTag(loader, "amenity", "");

			assert.ok(result);
			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.length > 0);
			assert.ok(result.errors.some((e) => e.includes("empty")));
		});
	});
});
