/**
 * Integration tests for get_related_tags tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setupClientServer, teardownClientServer, type TestServer } from "./helpers.js";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };

describe("get_related_tags integration", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Basic Functionality", () => {
		it("should call get_related_tags tool successfully with tag key", async () => {
			const response = await client.callTool({
				name: "get_related_tags",
				arguments: { tag: "amenity", limit: 10 },
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
				assert.ok(typeof results[0].frequency === "number");
			}
		});

		it("should call get_related_tags tool successfully with key=value", async () => {
			const response = await client.callTool({
				name: "get_related_tags",
				arguments: { tag: "amenity=restaurant", limit: 10 },
			});

			assert.ok(response);
			const results = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(Array.isArray(results));
			assert.ok(results.length > 0);
		});

		it("should throw error for missing tag parameter", async () => {
			await assert.rejects(
				async () => {
					await client.callTool({
						name: "get_related_tags",
						arguments: {},
					});
				},
				{
					message: /tag parameter is required/,
				},
			);
		});

		it("should respect limit parameter via MCP", async () => {
			const response = await client.callTool({
				name: "get_related_tags",
				arguments: { tag: "amenity=cafe", limit: 5 },
			});

			const results = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(results.length <= 5, "Should respect limit parameter");
		});
	});

	describe("JSON Schema Data Integrity", () => {
		it("should return related tags that exist in JSON presets via MCP", async () => {
			const response = await client.callTool({
				name: "get_related_tags",
				arguments: { tag: "amenity=parking", limit: 15 },
			});

			const results = JSON.parse((response.content[0] as { text: string }).text);

			// CRITICAL: Verify EACH returned tag exists in JSON presets
			for (const result of results) {
				let found = false;

				for (const preset of Object.values(presets)) {
					if (preset.tags?.[result.key] === result.value) {
						found = true;
						break;
					}
					if (preset.addTags?.[result.key] === result.value) {
						found = true;
						break;
					}
					// Check for key-only matches
					if (result.value === undefined && preset.tags?.[result.key]) {
						found = true;
						break;
					}
				}

				assert.ok(
					found,
					`Related tag ${result.key}${result.value ? "=" + result.value : ""} should exist in JSON presets via MCP`,
				);
			}
		});

		it("should validate frequency counts match JSON data via MCP", async () => {
			const response = await client.callTool({
				name: "get_related_tags",
				arguments: { tag: "amenity=restaurant", limit: 10 },
			});

			const results = JSON.parse((response.content[0] as { text: string }).text);

			// Verify frequency counts for each result
			for (const result of results) {
				let actualCount = 0;

				// Count presets with BOTH amenity=restaurant AND the related tag
				for (const preset of Object.values(presets)) {
					const hasInputTag =
						preset.tags?.amenity === "restaurant" ||
						preset.addTags?.amenity === "restaurant";

					if (hasInputTag) {
						const hasRelatedTag =
							preset.tags?.[result.key] === result.value ||
							preset.addTags?.[result.key] === result.value ||
							(result.value === undefined &&
								(preset.tags?.[result.key] || preset.addTags?.[result.key]));

						if (hasRelatedTag) {
							actualCount++;
						}
					}
				}

				assert.strictEqual(
					result.frequency,
					actualCount,
					`Frequency for ${result.key}${result.value ? "=" + result.value : ""} should match JSON data via MCP`,
				);
			}
		});

		it("should validate related tags co-occur with input tag in JSON via MCP", async () => {
			const testCases = [
				{ tag: "amenity=cafe", limit: 10 },
				{ tag: "building=yes", limit: 10 },
				{ tag: "highway=residential", limit: 10 },
			];

			for (const testCase of testCases) {
				const response = await client.callTool({
					name: "get_related_tags",
					arguments: testCase,
				});

				const results = JSON.parse((response.content[0] as { text: string }).text);
				const [inputKey, inputValue] = testCase.tag.split("=");

				// Verify each result co-occurs with the input tag in JSON
				for (const result of results) {
					let foundCoOccurrence = false;

					for (const preset of Object.values(presets)) {
						const hasInputTag =
							preset.tags?.[inputKey] === inputValue ||
							preset.addTags?.[inputKey] === inputValue;

						if (hasInputTag) {
							const hasRelatedTag =
								preset.tags?.[result.key] === result.value ||
								preset.addTags?.[result.key] === result.value ||
								(result.value === undefined &&
									(preset.tags?.[result.key] || preset.addTags?.[result.key]));

							if (hasRelatedTag) {
								foundCoOccurrence = true;
								break;
							}
						}
					}

					assert.ok(
						foundCoOccurrence,
						`Related tag ${result.key}${result.value ? "=" + result.value : ""} should co-occur with ${testCase.tag} in JSON via MCP`,
					);
				}
			}
		});

		it("should return results sorted by frequency descending via MCP", async () => {
			const response = await client.callTool({
				name: "get_related_tags",
				arguments: { tag: "amenity=school", limit: 20 },
			});

			const results = JSON.parse((response.content[0] as { text: string }).text);

			// Verify sorting
			for (let i = 1; i < results.length; i++) {
				assert.ok(
					results[i - 1].frequency >= results[i].frequency,
					"Results should be sorted by frequency descending via MCP",
				);
			}
		});
	});
});
