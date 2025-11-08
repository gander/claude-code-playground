/**
 * Integration tests for get_categories tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setupClientServer, teardownClientServer, type TestServer } from "./helpers.js";
import categories from "@openstreetmap/id-tagging-schema/dist/preset_categories.json" with { type: "json" };

describe("get_categories integration", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Basic Functionality", () => {
		it("should call get_categories tool successfully", async () => {
			const response = await client.callTool({
				name: "get_categories",
				arguments: {},
			});

			assert.ok(response);
			assert.ok(response.content);
			assert.ok(Array.isArray(response.content));
			assert.strictEqual(response.content.length, 1);
			assert.strictEqual(response.content[0]?.type, "text");

			// Parse the categories from the response
			const categoriesData = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(Array.isArray(categoriesData));
			assert.ok(categoriesData.length > 0);
			assert.ok(typeof categoriesData[0].name === "string");
			assert.ok(typeof categoriesData[0].count === "number");
		});
	});

	describe("JSON Schema Data Integrity", () => {
		it("should return all categories from JSON data via MCP", async () => {
			const response = await client.callTool({
				name: "get_categories",
				arguments: {},
			});

			const returnedCategories = JSON.parse((response.content[0] as { text: string }).text);
			const actualCategoryNames = Object.keys(categories).sort();
			const returnedNames = returnedCategories.map((cat: { name: string }) => cat.name).sort();

			// Full comparison, not just count - detects key replacement
			assert.deepStrictEqual(
				returnedNames,
				actualCategoryNames,
				"Should return all categories from JSON",
			);
		});

		it("should validate each category via MCP using provider pattern", async () => {
			const response = await client.callTool({
				name: "get_categories",
				arguments: {},
			});

			const returnedCategories = JSON.parse((response.content[0] as { text: string }).text);

			// CRITICAL: Test EACH category individually (100% coverage)
			for (const [name, category] of Object.entries(categories)) {
				const returnedCategory = returnedCategories.find(
					(cat: { name: string; count: number }) => cat.name === name,
				);

				assert.ok(
					returnedCategory,
					`Category "${name}" should exist in MCP response`,
				);
				assert.strictEqual(
					returnedCategory.count,
					category.members?.length || 0,
					`Category "${name}" should have correct count via MCP`,
				);
			}
		});
	});
});
