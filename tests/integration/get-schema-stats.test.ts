/**
 * Integration tests for get_schema_stats tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setupClientServer, teardownClientServer, type TestServer } from "./helpers.js";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import categories from "@openstreetmap/id-tagging-schema/dist/preset_categories.json" with { type: "json" };

describe("get_schema_stats integration", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Basic Functionality", () => {
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
	});

	describe("JSON Schema Data Integrity", () => {
		it("should return schema stats matching JSON data via MCP", async () => {
			const response = await client.callTool({
				name: "get_schema_stats",
				arguments: {},
			});

			const stats = JSON.parse((response.content[0] as { text: string }).text);

			// Verify counts match actual JSON data
			assert.strictEqual(
				stats.presetCount,
				Object.keys(presets).length,
				"Preset count should match JSON data",
			);
			assert.strictEqual(
				stats.fieldCount,
				Object.keys(fields).length,
				"Field count should match JSON data",
			);
			assert.strictEqual(
				stats.categoryCount,
				Object.keys(categories).length,
				"Category count should match JSON data",
			);
		});
	});
});
