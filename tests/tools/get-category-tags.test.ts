import assert from "node:assert";
import { describe, it } from "node:test";
import categories from "@openstreetmap/id-tagging-schema/dist/preset_categories.json" with {
	type: "json",
};
import { handler as getCategoriesHandler } from "../../src/tools/get-categories.ts";
import { handler as getCategoryTagsHandler } from "../../src/tools/get-category-tags.ts";
import { SchemaLoader } from "../../src/utils/schema-loader.ts";

describe("get_category_tags", () => {
	describe("Basic Functionality", () => {
		it("should return tags for a valid category", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// First get a valid category name
			const categoriesResult = await getCategoriesHandler({}, loader);
			const allCategories = categoriesResult.structuredContent.categories;
			assert.ok(allCategories.length > 0, "Should have categories");

			const categoryName = allCategories[0]?.name;
			assert.ok(categoryName, "Should have category name");

			const tagsResult = await getCategoryTagsHandler({ category: categoryName }, loader);
			const tags = tagsResult.structuredContent.tags;
			assert.ok(Array.isArray(tags), "Should return an array");
		});

		it("should return preset IDs for category members", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const categoriesResult = await getCategoriesHandler({}, loader);
			const allCategories = categoriesResult.structuredContent.categories;

			// Find a category with members
			const categoryWithMembers = allCategories.find((cat) => cat.count > 0);
			assert.ok(categoryWithMembers, "Should have category with members");

			const tagsResult = await getCategoryTagsHandler(
				{ category: categoryWithMembers.name },
				loader,
			);
			const tags = tagsResult.structuredContent.tags;
			assert.ok(tags.length > 0, "Should have tags");
			assert.ok(typeof tags[0] === "string", "Tags should be strings (preset IDs)");
		});

		it("should return empty array for category with no members", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const tagsResult = await getCategoryTagsHandler({ category: "nonexistent-category" }, loader);
			const tags = tagsResult.structuredContent.tags;

			assert.ok(Array.isArray(tags), "Should return an array");
			assert.strictEqual(tags.length, 0, "Should be empty for nonexistent category");
		});

		it("should use cached data on subsequent calls", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const categoriesResult = await getCategoriesHandler({}, loader);
			const allCategories = categoriesResult.structuredContent.categories;
			const categoryName = allCategories[0]?.name || "";

			const tagsResult1 = await getCategoryTagsHandler({ category: categoryName }, loader);
			const tags1 = tagsResult1.structuredContent;
			const tagsResult2 = await getCategoryTagsHandler({ category: categoryName }, loader);
			const tags2 = tagsResult2.structuredContent;

			assert.deepStrictEqual(tags1, tags2, "Tags should be identical from cache");
		});
	});

	describe("JSON Schema Validation", () => {
		/**
		 * Provider pattern: Generates test data items from JSON source
		 * Tests each category individually to detect key replacement scenarios
		 */
		function* categoryProvider() {
			for (const [name, category] of Object.entries(categories)) {
				yield {
					name,
					expectedCount: category.members?.length || 0,
					expectedMembers: category.members || [],
				};
			}
		}

		it("should return correct data for each category using provider pattern", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Use provider to test each category individually
			for (const testCase of categoryProvider()) {
				const categoriesResult = await getCategoriesHandler({}, loader);
				const allCategories = categoriesResult.structuredContent.categories;
				const returnedCategory = allCategories.find((cat) => cat.name === testCase.name);

				assert.ok(returnedCategory, `Category "${testCase.name}" should exist in returned data`);
				assert.strictEqual(
					returnedCategory.count,
					testCase.expectedCount,
					`Category "${testCase.name}" should have correct count`,
				);

				const tagsResult = await getCategoryTagsHandler({ category: testCase.name }, loader);
				const tags = tagsResult.structuredContent.tags;
				assert.deepStrictEqual(
					tags,
					testCase.expectedMembers,
					`Category "${testCase.name}" should return correct preset IDs from JSON`,
				);
			}
		});

		it("should return correct preset IDs for specific categories", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Test a few categories
			const testCategories = ["path", "building", "natural"];

			for (const categoryName of testCategories) {
				const actualCategory = categories[categoryName];
				if (!actualCategory) continue;

				const tagsResult = await getCategoryTagsHandler({ category: categoryName }, loader);
				const tags = tagsResult.structuredContent.tags;
				const expectedMembers = actualCategory.members || [];

				assert.deepStrictEqual(
					tags,
					expectedMembers,
					`Category ${categoryName} should return correct preset IDs from JSON`,
				);
			}
		});
	});
});
