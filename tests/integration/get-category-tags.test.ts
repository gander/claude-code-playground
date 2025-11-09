/**
 * Integration tests for get_category_tags tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import categories from "@openstreetmap/id-tagging-schema/dist/preset_categories.json" with {
	type: "json",
};
import { setupClientServer, type TestServer, teardownClientServer } from "./helpers.js";

describe("get_category_tags integration", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Basic Functionality", () => {
		it("should call get_category_tags tool successfully", async () => {
			// First get categories to get a valid category name
			const categoriesResponse = await client.callTool({
				name: "get_categories",
				arguments: {},
			});
			const categoriesData = JSON.parse((categoriesResponse.content[0] as { text: string }).text);
			const categoryName = categoriesData[0]?.name;

			// Now get tags for that category
			const response = await client.callTool({
				name: "get_category_tags",
				arguments: { category: categoryName },
			});

			assert.ok(response);
			assert.ok(response.content);
			assert.ok(Array.isArray(response.content));
			assert.strictEqual(response.content.length, 1);
			assert.strictEqual(response.content[0]?.type, "text");

			// Parse the tags from the response
			const tags = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(Array.isArray(tags));
		});

		it("should throw error for missing category parameter", async () => {
			await assert.rejects(
				async () => {
					await client.callTool({
						name: "get_category_tags",
						arguments: {},
					});
				},
				{
					message: /category parameter is required/,
				},
			);
		});
	});

	describe("JSON Schema Data Integrity", () => {
		it("should validate ALL category members via MCP using provider pattern", async () => {
			// CRITICAL: Test EACH category individually (100% coverage)
			for (const [name, category] of Object.entries(categories)) {
				// Get tags for this category via MCP
				const tagsResponse = await client.callTool({
					name: "get_category_tags",
					arguments: { category: name },
				});

				const tags = JSON.parse((tagsResponse.content[0] as { text: string }).text);
				const expectedMembers = category.members || [];

				assert.deepStrictEqual(
					tags,
					expectedMembers,
					`Category "${name}" should return correct members via MCP`,
				);
			}
		});
	});
});
