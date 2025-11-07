/**
 * MCP Server Integration Tests
 *
 * Test approach inspired by:
 * https://github.com/czlonkowski/n8n-mcp/blob/main/tests/integration/mcp-protocol/tool-invocation.test.ts
 * Licensed under MIT License
 *
 * Uses InMemoryTransport for stable client-server communication testing
 * without subprocess spawning complexity.
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/index.js";

describe("MCP Server Integration", () => {
	let client: Client;
	let server: ReturnType<typeof createServer>;

	beforeEach(async () => {
		// Create server instance
		server = createServer();

		// Create linked in-memory transports for client-server communication
		const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

		// Connect server to its transport
		await server.connect(serverTransport);

		// Create and connect client
		client = new Client(
			{
				name: "test-client",
				version: "1.0.0",
			},
			{
				capabilities: {},
			},
		);

		await client.connect(clientTransport);
	});

	afterEach(async () => {
		// Clean up: close client and server connections
		await client.close();
		await server.close();
	});

	describe("Server Initialization", () => {
		it("should successfully connect to the server", () => {
			// If we reached this point, connection was successful
			assert.ok(client);
		});

		it("should have correct server info", async () => {
			// The server should have name and version
			const serverInfo = client.getServerVersion();
			assert.ok(serverInfo);
		});
	});

	describe("Tools", () => {
		it("should list available tools", async () => {
			const response = await client.listTools();

			assert.ok(response);
			assert.ok(Array.isArray(response.tools));
			assert.strictEqual(response.tools.length, 3);
			assert.strictEqual(response.tools[0]?.name, "get_schema_stats");
			assert.strictEqual(response.tools[1]?.name, "get_categories");
			assert.strictEqual(response.tools[2]?.name, "get_category_tags");
		});

		it("should call get_schema_stats tool successfully", async () => {
			const response = await client.callTool({
				name: "get_schema_stats",
				arguments: {},
			});

			assert.ok(response);
			assert.ok(response.content);
			assert.ok(Array.isArray(response.content));
			assert.strictEqual(response.content.length, 1);
			assert.strictEqual(response.content[0]?.type, "text");

			// Parse the stats from the response
			const stats = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(typeof stats.presetCount === "number");
			assert.ok(typeof stats.fieldCount === "number");
			assert.ok(typeof stats.categoryCount === "number");
			assert.ok(typeof stats.deprecatedCount === "number");
			assert.ok(stats.presetCount > 0);
		});

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
			const categories = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(Array.isArray(categories));
			assert.ok(categories.length > 0);
			assert.ok(typeof categories[0].name === "string");
			assert.ok(typeof categories[0].count === "number");
		});

		it("should call get_category_tags tool successfully", async () => {
			// First get categories to get a valid category name
			const categoriesResponse = await client.callTool({
				name: "get_categories",
				arguments: {},
			});
			const categories = JSON.parse(
				(categoriesResponse.content[0] as { text: string }).text,
			);
			const categoryName = categories[0]?.name;

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

		it("should throw error for unknown tool", async () => {
			await assert.rejects(
				async () => {
					await client.callTool({
						name: "unknown-tool",
						arguments: {},
					});
				},
				{
					message: /Unknown tool/,
				},
			);
		});
	});

	// Note: Resources and Prompts capabilities are not yet implemented
	// These tests will be added in future phases
});
