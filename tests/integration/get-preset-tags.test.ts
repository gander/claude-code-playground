/**
 * Integration tests for get_preset_tags tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setupClientServer, teardownClientServer, type TestServer } from "./helpers.js";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };

describe("get_preset_tags integration", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Basic Functionality", () => {
		it("should call get_preset_tags tool successfully", async () => {
			const response = await client.callTool({
				name: "get_preset_tags",
				arguments: { presetId: "amenity/restaurant" },
			});

			assert.ok(response);
			assert.ok(response.content);
			assert.ok(Array.isArray(response.content));
			assert.strictEqual(response.content.length, 1);
			assert.strictEqual(response.content[0]?.type, "text");

			// Parse the result from the response
			const result = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(result);
			assert.ok(result.tags);
		});

		it("should return tags property via MCP", async () => {
			const response = await client.callTool({
				name: "get_preset_tags",
				arguments: { presetId: "amenity/restaurant" },
			});

			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.tags, "Should have tags");
			assert.strictEqual(typeof result.tags, "object");
			assert.strictEqual(result.tags.amenity, "restaurant");
		});

		it("should throw error for missing presetId parameter", async () => {
			await assert.rejects(
				async () => {
					await client.callTool({
						name: "get_preset_tags",
						arguments: {},
					});
				},
				{
					message: /presetId.*required/i,
				},
			);
		});

		it("should throw error for non-existent preset via MCP", async () => {
			await assert.rejects(
				async () => {
					await client.callTool({
						name: "get_preset_tags",
						arguments: { presetId: "nonexistent/preset" },
					});
				},
				{
					message: /not found/i,
				},
			);
		});
	});

	describe("JSON Schema Data Integrity", () => {
		it("should return tags matching JSON data via MCP", async () => {
			const response = await client.callTool({
				name: "get_preset_tags",
				arguments: { presetId: "amenity/restaurant" },
			});

			const result = JSON.parse((response.content[0] as { text: string }).text);
			const expected = presets["amenity/restaurant"];

			assert.ok(expected, "Preset should exist in JSON");

			// Verify tags match
			assert.deepStrictEqual(result.tags, expected.tags);

			// Verify addTags match (if present)
			if (expected.addTags && Object.keys(expected.addTags).length > 0) {
				assert.deepStrictEqual(result.addTags, expected.addTags);
			}
		});

		it("should validate tags for representative sample via MCP (sample-based for performance)", async () => {
			// Note: Testing ALL 1707 presets via MCP would be too slow
			// We test a representative sample (every 20th preset)
			const allPresetIds = Object.keys(presets);
			const sampleIds = allPresetIds.filter((_, idx) => idx % 20 === 0);

			assert.ok(
				sampleIds.length >= 80,
				`Should have representative sample (${sampleIds.length} presets)`,
			);

			for (const presetId of sampleIds) {
				const response = await client.callTool({
					name: "get_preset_tags",
					arguments: { presetId },
				});

				const result = JSON.parse((response.content[0] as { text: string }).text);
				const expected = presets[presetId];

				assert.ok(expected, `Preset ${presetId} should exist in JSON`);

				// Verify tags match EXACTLY
				assert.deepStrictEqual(
					result.tags,
					expected.tags,
					`Tags for ${presetId} should match JSON`,
				);

				// Verify addTags match EXACTLY (if present)
				if (expected.addTags && Object.keys(expected.addTags).length > 0) {
					assert.deepStrictEqual(
						result.addTags,
						expected.addTags,
						`AddTags for ${presetId} should match JSON`,
					);
				} else {
					assert.ok(
						!result.addTags || Object.keys(result.addTags).length === 0,
						`Preset ${presetId} should not have addTags`,
					);
				}
			}
		});

		it("should return tags as key-value pairs via MCP", async () => {
			const response = await client.callTool({
				name: "get_preset_tags",
				arguments: { presetId: "amenity/restaurant" },
			});

			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.tags);
			assert.strictEqual(typeof result.tags, "object");

			// Verify each tag is a string key-value pair
			for (const [key, value] of Object.entries(result.tags)) {
				assert.strictEqual(typeof key, "string", "Tag key should be a string");
				assert.strictEqual(typeof value, "string", "Tag value should be a string");
			}
		});
	});
});
