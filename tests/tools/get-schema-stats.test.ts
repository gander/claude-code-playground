import assert from "node:assert";
import { describe, it } from "node:test";
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import categories from "@openstreetmap/id-tagging-schema/dist/preset_categories.json" with {
	type: "json",
};
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { getSchemaStats } from "../../src/tools/get-schema-stats.ts";
import { SchemaLoader } from "../../src/utils/schema-loader.ts";

describe("get_schema_stats", () => {
	describe("Basic Functionality", () => {
		it("should return schema statistics with preset count", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const stats = await getSchemaStats(loader);

			assert.ok(stats, "Stats should be returned");
			assert.ok(typeof stats.presetCount === "number", "Should have preset count");
			assert.ok(stats.presetCount > 0, "Preset count should be greater than 0");
		});

		it("should return schema statistics with field count", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const stats = await getSchemaStats(loader);

			assert.ok(typeof stats.fieldCount === "number", "Should have field count");
			assert.ok(stats.fieldCount > 0, "Field count should be greater than 0");
		});

		it("should return schema statistics with category count", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const stats = await getSchemaStats(loader);

			assert.ok(typeof stats.categoryCount === "number", "Should have category count");
			assert.ok(stats.categoryCount > 0, "Category count should be greater than 0");
		});

		it("should return schema statistics with deprecated tag count", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const stats = await getSchemaStats(loader);

			assert.ok(typeof stats.deprecatedCount === "number", "Should have deprecated count");
			assert.ok(stats.deprecatedCount >= 0, "Deprecated count should be non-negative");
		});

		it("should use cached data on subsequent calls", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const stats1 = await getSchemaStats(loader);
			const stats2 = await getSchemaStats(loader);

			assert.deepStrictEqual(stats1, stats2, "Stats should be identical from cache");
		});
	});

	describe("JSON Schema Validation", () => {
		/**
		 * Provider pattern: Returns ALL preset keys from JSON for validation
		 * CRITICAL: Tests 100% of presets, not samples or subsets
		 */
		function* presetKeyProvider() {
			const presetKeys = Object.keys(presets);
			for (const key of presetKeys) {
				yield key;
			}
		}

		/**
		 * Provider pattern: Returns ALL field keys from JSON for validation
		 * CRITICAL: Tests 100% of fields, not samples or subsets
		 */
		function* fieldKeyProvider() {
			const fieldKeys = Object.keys(fields);
			for (const key of fieldKeys) {
				yield key;
			}
		}

		it("should return stats matching actual JSON data counts", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const stats = await getSchemaStats(loader);

			// Verify preset count matches JSON data
			const actualPresetCount = Object.keys(presets).length;
			assert.strictEqual(
				stats.presetCount,
				actualPresetCount,
				`Preset count should match JSON data: ${stats.presetCount} === ${actualPresetCount}`,
			);

			// Verify field count matches JSON data
			const actualFieldCount = Object.keys(fields).length;
			assert.strictEqual(
				stats.fieldCount,
				actualFieldCount,
				`Field count should match JSON data: ${stats.fieldCount} === ${actualFieldCount}`,
			);

			// Verify category count matches JSON data
			const actualCategoryCount = Object.keys(categories).length;
			assert.strictEqual(
				stats.categoryCount,
				actualCategoryCount,
				`Category count should match JSON data: ${stats.categoryCount} === ${actualCategoryCount}`,
			);
		});

		it("should verify ALL preset keys exist in schema (100% coverage)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const schema = await loader.loadSchema();
			const schemaPresetKeys = Object.keys(schema.presets);

			// CRITICAL: Verify EVERY preset key exists in both JSON and loaded schema
			let validatedCount = 0;
			for (const presetKey of presetKeyProvider()) {
				assert.ok(
					schemaPresetKeys.includes(presetKey as string),
					`Preset key "${presetKey}" from JSON should exist in loaded schema`,
				);
				validatedCount++;
			}

			// Verify we tested ALL presets, not a sample
			const expectedCount = Object.keys(presets).length;
			assert.strictEqual(
				validatedCount,
				expectedCount,
				`Should have validated ALL ${expectedCount} preset keys`,
			);
		});

		it("should verify ALL field keys exist in schema (100% coverage)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const schema = await loader.loadSchema();
			const schemaFieldKeys = Object.keys(schema.fields);

			// CRITICAL: Verify EVERY field key exists in both JSON and loaded schema
			let validatedCount = 0;
			for (const fieldKey of fieldKeyProvider()) {
				assert.ok(
					schemaFieldKeys.includes(fieldKey as string),
					`Field key "${fieldKey}" from JSON should exist in loaded schema`,
				);
				validatedCount++;
			}

			// Verify we tested ALL fields, not a sample
			const expectedCount = Object.keys(fields).length;
			assert.strictEqual(
				validatedCount,
				expectedCount,
				`Should have validated ALL ${expectedCount} field keys`,
			);
		});
	});
});
