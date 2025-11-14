/**
 * Integration tests for search_tags tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { setupClientServer, type TestServer, teardownClientServer } from "./helpers.js";

describe("search_tags integration", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Basic Functionality", () => {
		it("should call search_tags tool successfully", async () => {
			const response = await client.callTool({
				name: "search_tags",
				arguments: { keyword: "park" },
			});

			assert.ok(response);
			assert.ok(response.content);
			assert.ok(Array.isArray(response.content));
			assert.strictEqual(response.content.length, 1);
			assert.strictEqual(response.content[0]?.type, "text");

			// Parse the results from the response
			const results = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(Array.isArray(results));
			if (results.length > 0) {
				assert.ok(typeof results[0].key === "string");
				assert.ok(typeof results[0].value === "string");
			}
		});
	});

	describe("JSON Schema Data Integrity", () => {
		it("should return valid search results from JSON via MCP", async () => {
			const response = await client.callTool({
				name: "search_tags",
				arguments: { keyword: "school", limit: 10 },
			});

			const results = JSON.parse((response.content[0] as { text: string }).text);

			// CRITICAL: Verify EACH result exists in JSON (fields OR presets)
			for (const result of results) {
				let found = false;

				// Check in fields.json
				// Note: field.key might not be a simple conversion from map key
				// (e.g., "parking/side/parking" → "parking:both"), so we need to search by field.key
				for (const field of Object.values(fields)) {
					if (field.key === result.key && field.options && Array.isArray(field.options)) {
						if (field.options.includes(result.value)) {
							found = true;
							break;
						}
					}
				}

				// Check in presets
				if (!found) {
					for (const preset of Object.values(presets)) {
						if (preset.tags?.[result.key] === result.value) {
							found = true;
							break;
						}
						if (preset.addTags?.[result.key] === result.value) {
							found = true;
							break;
						}
					}
				}

				assert.ok(
					found,
					`Search result ${result.key}=${result.value} should exist in JSON (fields or presets)`,
				);
			}
		});

		it("should validate search results for multiple keywords via MCP", async () => {
			const keywords = ["parking", "restaurant", "school"];

			// CRITICAL: Test EACH keyword individually
			for (const keyword of keywords) {
				const response = await client.callTool({
					name: "search_tags",
					arguments: { keyword, limit: 20 },
				});

				const results = JSON.parse((response.content[0] as { text: string }).text);

				// CRITICAL: Verify EACH returned result exists in JSON (fields OR presets)
				for (const result of results) {
					let found = false;

					// Check in fields.json
					// Note: field.key might not be a simple conversion from map key
					// (e.g., "parking/side/parking" → "parking:both"), so we need to search by field.key
					for (const field of Object.values(fields)) {
						if (field.key === result.key && field.options && Array.isArray(field.options)) {
							if (field.options.includes(result.value)) {
								found = true;
								break;
							}
						}
					}

					// Check in presets
					if (!found) {
						for (const preset of Object.values(presets)) {
							if (preset.tags?.[result.key] === result.value) {
								found = true;
								break;
							}
							if (preset.addTags?.[result.key] === result.value) {
								found = true;
								break;
							}
						}
					}

					assert.ok(
						found,
						`Search result "${result.key}=${result.value}" for keyword "${keyword}" should exist in JSON (fields or presets) via MCP`,
					);
				}
			}
		});
	});
});
