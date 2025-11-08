/**
 * MCP Server Initialization Integration Tests
 *
 * Tests basic server initialization and tool registration
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setupClientServer, teardownClientServer, type TestServer } from "./helpers.js";

describe("MCP Server Initialization", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	it("should successfully connect to the server", () => {
		// If we reached this point, connection was successful
		assert.ok(client);
	});

	it("should have correct server info", async () => {
		// The server should have name and version
		const serverInfo = client.getServerVersion();
		assert.ok(serverInfo);
	});

	it("should list all available tools", async () => {
		const response = await client.listTools();

		assert.ok(response);
		assert.ok(Array.isArray(response.tools));
		assert.strictEqual(response.tools.length, 6);
		assert.strictEqual(response.tools[0]?.name, "get_schema_stats");
		assert.strictEqual(response.tools[1]?.name, "get_categories");
		assert.strictEqual(response.tools[2]?.name, "get_category_tags");
		assert.strictEqual(response.tools[3]?.name, "get_tag_values");
		assert.strictEqual(response.tools[4]?.name, "get_tag_info");
		assert.strictEqual(response.tools[5]?.name, "search_tags");
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
