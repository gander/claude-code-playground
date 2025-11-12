/**
 * MCP Server Initialization Integration Tests
 *
 * Tests basic server initialization and tool registration
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setupClientServer, type TestServer, teardownClientServer } from "./helpers.js";

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
		assert.strictEqual(response.tools.length, 14);

		// Check that expected tools exist (order-independent)
		const toolNames = response.tools.map((tool) => tool.name);
		const expectedTools = [
			"get_schema_stats",
			"get_categories",
			"get_category_tags",
			"get_tag_values",
			"get_tag_info",
			"search_tags",
			"search_presets",
			"get_preset_details",
			"get_preset_tags",
			"get_related_tags",
			"check_deprecated",
			"suggest_improvements",
			"validate_tag",
			"validate_tag_collection",
		];

		for (const expectedTool of expectedTools) {
			assert.ok(toolNames.includes(expectedTool), `Tool "${expectedTool}" should be available`);
		}
	});

	// REMOVED: Parameter validation now handled by Zod SDK
});
