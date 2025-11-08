import { describe, it } from "node:test";
import assert from "node:assert";
import {
	getSchemaStats,
	getCategories,
	getCategoryTags,
} from "../../src/tools/schema.ts";
import { SchemaLoader } from "../../src/utils/schema-loader.ts";

describe("Schema Tools", () => {
	describe("getSchemaStats", () => {
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

			assert.ok(
				typeof stats.deprecatedCount === "number",
				"Should have deprecated count",
			);
			assert.ok(
				stats.deprecatedCount >= 0,
				"Deprecated count should be non-negative",
			);
		});

		it("should use cached data on subsequent calls", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const stats1 = await getSchemaStats(loader);
			const stats2 = await getSchemaStats(loader);

			assert.deepStrictEqual(stats1, stats2, "Stats should be identical from cache");
		});
	});

	describe("getCategories", () => {
		it("should return an array of categories", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const categories = await getCategories(loader);

			assert.ok(Array.isArray(categories), "Should return an array");
			assert.ok(categories.length > 0, "Should have at least one category");
		});

		it("should return categories with name and count properties", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const categories = await getCategories(loader);

			const firstCategory = categories[0];
			assert.ok(firstCategory, "Should have first category");
			assert.ok(typeof firstCategory.name === "string", "Category should have name");
			assert.ok(typeof firstCategory.count === "number", "Category should have count");
			assert.ok(firstCategory.count >= 0, "Count should be non-negative");
		});

		it("should return categories sorted by name", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const categories = await getCategories(loader);

			for (let i = 1; i < categories.length; i++) {
				const prev = categories[i - 1];
				const curr = categories[i];
				assert.ok(
					prev && curr && prev.name <= curr.name,
					`Categories should be sorted: ${prev?.name} <= ${curr?.name}`,
				);
			}
		});

		it("should use cached data on subsequent calls", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const categories1 = await getCategories(loader);
			const categories2 = await getCategories(loader);

			assert.deepStrictEqual(
				categories1,
				categories2,
				"Categories should be identical from cache",
			);
		});
	});

	describe("getCategoryTags", () => {
		it("should return tags for a valid category", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// First get a valid category name
			const categories = await getCategories(loader);
			assert.ok(categories.length > 0, "Should have categories");

			const categoryName = categories[0]?.name;
			assert.ok(categoryName, "Should have category name");

			const tags = await getCategoryTags(loader, categoryName);
			assert.ok(Array.isArray(tags), "Should return an array");
		});

		it("should return preset IDs for category members", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const categories = await getCategories(loader);

			// Find a category with members
			const categoryWithMembers = categories.find((cat) => cat.count > 0);
			assert.ok(categoryWithMembers, "Should have category with members");

			const tags = await getCategoryTags(loader, categoryWithMembers.name);
			assert.ok(tags.length > 0, "Should have tags");
			assert.ok(typeof tags[0] === "string", "Tags should be strings (preset IDs)");
		});

		it("should return empty array for category with no members", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const tags = await getCategoryTags(loader, "nonexistent-category");

			assert.ok(Array.isArray(tags), "Should return an array");
			assert.strictEqual(tags.length, 0, "Should be empty for nonexistent category");
		});

		it("should use cached data on subsequent calls", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const categories = await getCategories(loader);
			const categoryName = categories[0]?.name || "";

			const tags1 = await getCategoryTags(loader, categoryName);
			const tags2 = await getCategoryTags(loader, categoryName);

			assert.deepStrictEqual(tags1, tags2, "Tags should be identical from cache");
		});
	});
});
