import { describe, it } from "node:test";
import assert from "node:assert";
import { getCategories } from "../../src/tools/get-categories.ts";
import { SchemaLoader } from "../../src/utils/schema-loader.ts";
import categories from "@openstreetmap/id-tagging-schema/dist/preset_categories.json" with { type: "json" };

describe("get_categories", () => {
	describe("Basic Functionality", () => {
		it("should return an array of categories", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const returnedCategories = await getCategories(loader);

			assert.ok(Array.isArray(returnedCategories), "Should return an array");
			assert.ok(returnedCategories.length > 0, "Should have at least one category");
		});

		it("should return categories with name and count properties", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const returnedCategories = await getCategories(loader);

			const firstCategory = returnedCategories[0];
			assert.ok(firstCategory, "Should have first category");
			assert.ok(typeof firstCategory.name === "string", "Category should have name");
			assert.ok(typeof firstCategory.count === "number", "Category should have count");
			assert.ok(firstCategory.count >= 0, "Count should be non-negative");
		});

		it("should return categories sorted by name", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const returnedCategories = await getCategories(loader);

			for (let i = 1; i < returnedCategories.length; i++) {
				const prev = returnedCategories[i - 1];
				const curr = returnedCategories[i];
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

	describe("JSON Schema Validation", () => {
		it("should return all categories from JSON data", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const returnedCategories = await getCategories(loader);

			// Get actual categories from JSON
			const actualCategoryNames = Object.keys(categories).sort();

			// Verify all categories are present (full comparison, not just count)
			const returnedCategoryNames = returnedCategories.map((cat) => cat.name).sort();
			assert.deepStrictEqual(
				returnedCategoryNames,
				actualCategoryNames,
				"Should return all categories from JSON data",
			);

			// Verify each category has correct member count
			for (const category of returnedCategories) {
				const actualCategory = categories[category.name];
				const expectedCount = actualCategory?.members?.length || 0;
				assert.strictEqual(
					category.count,
					expectedCount,
					`Category ${category.name} should have ${expectedCount} members`,
				);
			}
		});
	});
});
