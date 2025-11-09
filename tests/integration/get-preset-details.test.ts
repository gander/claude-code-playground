/**
 * Integration tests for get_preset_details tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setupClientServer, teardownClientServer, type TestServer } from "./helpers.js";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };

describe("get_preset_details integration", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Basic Functionality", () => {
		it("should call get_preset_details tool successfully", async () => {
			const response = await client.callTool({
				name: "get_preset_details",
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
			assert.strictEqual(result.id, "amenity/restaurant");
		});

		it("should return all required properties via MCP", async () => {
			const response = await client.callTool({
				name: "get_preset_details",
				arguments: { presetId: "amenity/restaurant" },
			});

			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.id, "Should have id");
			assert.ok(result.tags, "Should have tags");
			assert.ok(result.geometry, "Should have geometry");
			assert.strictEqual(typeof result.id, "string");
			assert.strictEqual(typeof result.tags, "object");
			assert.ok(Array.isArray(result.geometry));
		});

		it("should throw error for missing presetId parameter", async () => {
			await assert.rejects(
				async () => {
					await client.callTool({
						name: "get_preset_details",
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
						name: "get_preset_details",
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
		it("should return preset details matching JSON data via MCP", async () => {
			const response = await client.callTool({
				name: "get_preset_details",
				arguments: { presetId: "amenity/restaurant" },
			});

			const result = JSON.parse((response.content[0] as { text: string }).text);
			const expected = presets["amenity/restaurant"];

			assert.ok(expected, "Preset should exist in JSON");

			// Verify required properties
			assert.strictEqual(result.id, "amenity/restaurant");
			assert.deepStrictEqual(result.tags, expected.tags);
			assert.deepStrictEqual(result.geometry, expected.geometry);

			// Verify optional properties
			if (expected.fields !== undefined) {
				assert.deepStrictEqual(result.fields, expected.fields);
			}
			if (expected.moreFields !== undefined) {
				assert.deepStrictEqual(result.moreFields, expected.moreFields);
			}
			if (expected.icon !== undefined) {
				assert.strictEqual(result.icon, expected.icon);
			}
			if (expected.name !== undefined) {
				assert.strictEqual(result.name, expected.name);
			}
		});

		it("should validate preset details for representative sample via MCP (sample-based for performance)", async () => {
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
					name: "get_preset_details",
					arguments: { presetId },
				});

				const result = JSON.parse((response.content[0] as { text: string }).text);
				const expected = presets[presetId];

				assert.ok(expected, `Preset ${presetId} should exist in JSON`);
				assert.strictEqual(result.id, presetId);
				assert.deepStrictEqual(result.tags, expected.tags);
				assert.deepStrictEqual(result.geometry, expected.geometry);

				// Verify optional properties match exactly
				if (expected.fields !== undefined) {
					assert.deepStrictEqual(result.fields, expected.fields);
				} else {
					assert.ok(
						result.fields === undefined,
						`Preset ${presetId} should not have fields`,
					);
				}

				if (expected.moreFields !== undefined) {
					assert.deepStrictEqual(result.moreFields, expected.moreFields);
				} else {
					assert.ok(
						result.moreFields === undefined,
						`Preset ${presetId} should not have moreFields`,
					);
				}

				if (expected.icon !== undefined) {
					assert.strictEqual(result.icon, expected.icon);
				} else {
					assert.ok(result.icon === undefined, `Preset ${presetId} should not have icon`);
				}

				if (expected.name !== undefined) {
					assert.strictEqual(result.name, expected.name);
				} else {
					assert.ok(result.name === undefined, `Preset ${presetId} should not have name`);
				}
			}
		});

		it("should return complete field arrays matching JSON via MCP", async () => {
			const response = await client.callTool({
				name: "get_preset_details",
				arguments: { presetId: "amenity/restaurant" },
			});

			const result = JSON.parse((response.content[0] as { text: string }).text);
			const expected = presets["amenity/restaurant"];

			// Restaurant should have fields
			assert.ok(result.fields, "Restaurant should have fields");
			assert.ok(Array.isArray(result.fields));
			assert.deepStrictEqual(result.fields, expected.fields);

			// Verify each field is a string
			for (const field of result.fields) {
				assert.strictEqual(typeof field, "string", "Field should be a string");
			}
		});
	});
});
