/**
 * Integration tests for search_presets tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { setupClientServer, type TestServer, teardownClientServer } from "./helpers.js";

describe("search_presets integration", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Basic Functionality", () => {
		it("should call search_presets tool successfully", async () => {
			const response = await client.callTool({
				name: "search_presets",
				arguments: { keyword: "restaurant" },
			});

			assert.ok(response);
			assert.ok(response.content);
			assert.ok(Array.isArray(response.content));
			assert.strictEqual(response.content.length, 1);
			assert.strictEqual(response.content[0]?.type, "text");

			// Parse the results from the response
			const results = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(Array.isArray(results));
			assert.ok(results.length > 0);
		});

		it("should search by keyword", async () => {
			const response = await client.callTool({
				name: "search_presets",
				arguments: { keyword: "restaurant" },
			});

			const results = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(results.length > 0, "Should find results for 'restaurant'");

			// Should include amenity/restaurant
			const hasRestaurant = results.some((r: { id: string }) => r.id === "amenity/restaurant");
			assert.ok(hasRestaurant, "Should find amenity/restaurant");
		});

		it("should search by tag", async () => {
			const response = await client.callTool({
				name: "search_presets",
				arguments: { keyword: "amenity=restaurant" },
			});

			const results = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(results.length > 0, "Should find results for tag search");

			// All results should have amenity=restaurant
			for (const result of results) {
				assert.strictEqual(result.tags.amenity, "restaurant", "Should have amenity=restaurant tag");
			}
		});

		it("should filter by geometry type via MCP", async () => {
			const response = await client.callTool({
				name: "search_presets",
				arguments: {
					keyword: "restaurant",
					geometry: "area",
				},
			});

			const results = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(results.length > 0, "Should find results");

			// All results should support area geometry
			for (const result of results) {
				assert.ok(
					result.geometry.includes("area"),
					`Preset ${result.id} should support area geometry`,
				);
			}
		});

		it("should respect limit parameter via MCP", async () => {
			const response = await client.callTool({
				name: "search_presets",
				arguments: {
					keyword: "building",
					limit: 5,
				},
			});

			const results = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(Array.isArray(results), "Should return an array");
			assert.ok(results.length <= 5, "Should respect limit");
		});

		it("should perform case-insensitive search via MCP", async () => {
			const responseLower = await client.callTool({
				name: "search_presets",
				arguments: { keyword: "restaurant" },
			});

			const responseUpper = await client.callTool({
				name: "search_presets",
				arguments: { keyword: "RESTAURANT" },
			});

			const resultsLower = JSON.parse((responseLower.content[0] as { text: string }).text);
			const resultsUpper = JSON.parse((responseUpper.content[0] as { text: string }).text);

			assert.ok(resultsLower.length > 0, "Should find results with lowercase");
			assert.ok(resultsUpper.length > 0, "Should find results with uppercase");
			assert.deepStrictEqual(resultsLower, resultsUpper, "Case should not matter");
		});

		it("should throw error for missing keyword parameter", async () => {
			await assert.rejects(
				async () => {
					await client.callTool({
						name: "search_presets",
						arguments: {},
					});
				},
				{
					message: /keyword.*required/i,
				},
			);
		});
	});

	describe("JSON Schema Data Integrity", () => {
		it("should return presets matching JSON data via MCP", async () => {
			const response = await client.callTool({
				name: "search_presets",
				arguments: { keyword: "restaurant" },
			});

			const results = JSON.parse((response.content[0] as { text: string }).text);

			// Verify each result exists in JSON
			for (const result of results) {
				const preset = presets[result.id];
				assert.ok(preset, `Preset ${result.id} should exist in JSON`);

				// Verify tags match
				assert.deepStrictEqual(result.tags, preset.tags, `Tags for ${result.id} should match JSON`);

				// Verify geometry matches
				assert.deepStrictEqual(
					result.geometry,
					preset.geometry,
					`Geometry for ${result.id} should match JSON`,
				);
			}
		});

		it("should find presets by exact tag match via MCP", async () => {
			const response = await client.callTool({
				name: "search_presets",
				arguments: { keyword: "amenity=cafe" },
			});

			const results = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(results.length > 0, "Should find cafe presets");

			// Verify all have amenity=cafe
			for (const result of results) {
				const preset = presets[result.id];
				assert.ok(preset, `Preset ${result.id} should exist`);
				assert.strictEqual(preset.tags.amenity, "cafe", `Should have amenity=cafe tag`);
			}
		});

		it("should validate search results structure via MCP", async () => {
			const response = await client.callTool({
				name: "search_presets",
				arguments: { keyword: "parking" },
			});

			const results = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(results.length > 0, "Should find parking presets");

			// CRITICAL: Validate EACH result individually
			for (const result of results) {
				assert.ok(result.id, "Should have preset ID");
				assert.ok(result.tags, "Should have tags");
				assert.ok(result.geometry, "Should have geometry");

				// Verify in JSON
				const jsonPreset = presets[result.id];
				assert.ok(jsonPreset, `Preset ${result.id} should exist in JSON`);
				assert.deepStrictEqual(
					result.tags,
					jsonPreset.tags,
					`Preset ${result.id} tags should match JSON`,
				);
			}
		});

		it("should validate geometry filtering against JSON via MCP", async () => {
			const response = await client.callTool({
				name: "search_presets",
				arguments: {
					keyword: "building",
					geometry: "point",
				},
			});

			const results = JSON.parse((response.content[0] as { text: string }).text);

			// Verify all returned presets support point geometry in JSON
			for (const result of results) {
				const jsonPreset = presets[result.id];
				assert.ok(jsonPreset, `Preset ${result.id} should exist in JSON`);
				assert.ok(
					jsonPreset.geometry.includes("point"),
					`Preset ${result.id} should support point geometry in JSON`,
				);
			}
		});

		it("should validate searchability for representative sample of presets via MCP (sample-based for performance)", async () => {
			// Note: Testing ALL 1707 presets via MCP would be too slow
			// We test a representative sample (every 10th preset)
			const allPresetIds = Object.keys(presets);
			const sampleSize = Math.floor(allPresetIds.length / 10);
			const sampleIds = allPresetIds.filter((_, idx) => idx % 10 === 0);

			assert.ok(
				sampleIds.length >= sampleSize,
				`Should have representative sample (${sampleIds.length} presets)`,
			);

			let foundCount = 0;

			for (const presetId of sampleIds) {
				const searchTerm = presetId.split("/").pop() || presetId;

				const response = await client.callTool({
					name: "search_presets",
					arguments: { keyword: searchTerm },
				});

				const results = JSON.parse((response.content[0] as { text: string }).text);
				const found = results.some((r) => r.id === presetId);

				if (found) {
					foundCount++;
					// Verify match
					const result = results.find((r) => r.id === presetId);
					assert.deepStrictEqual(result.tags, presets[presetId].tags);
				}
			}

			// Most sampled presets should be findable
			assert.ok(
				foundCount > sampleIds.length * 0.5,
				`Should find most sampled presets via MCP (found ${foundCount}/${sampleIds.length})`,
			);
		});
	});
});
