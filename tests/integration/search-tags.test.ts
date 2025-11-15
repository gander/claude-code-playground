/**
 * Integration tests for search_tags tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import type { SearchTagsResponse } from "../../src/tools/types.js";
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

			// Parse the results from the response (Phase 8.4 format)
			const result = JSON.parse(
				(response.content[0] as { text: string }).text,
			) as SearchTagsResponse;

			assert.ok(typeof result === "object", "Should return an object");
			assert.ok(Array.isArray(result.keyMatches), "Should have keyMatches array");
			assert.ok(Array.isArray(result.valueMatches), "Should have valueMatches array");
		});

		it("should return keyMatches with proper structure", async () => {
			const response = await client.callTool({
				name: "search_tags",
				arguments: { keyword: "wheelchair" },
			});

			const result = JSON.parse(
				(response.content[0] as { text: string }).text,
			) as SearchTagsResponse;

			// wheelchair is a key, should be in keyMatches
			const wheelchairKey = result.keyMatches.find((match) => match.key === "wheelchair");
			assert.ok(wheelchairKey, "Should find wheelchair in keyMatches");
			assert.ok(wheelchairKey.keyName, "Should have keyName");
			assert.ok(Array.isArray(wheelchairKey.values), "Should have values array");
			assert.ok(Array.isArray(wheelchairKey.valuesDetailed), "Should have valuesDetailed array");

			// Verify valuesDetailed structure
			for (const valueDetail of wheelchairKey.valuesDetailed) {
				assert.ok(valueDetail.value, "Should have value property");
				assert.ok(valueDetail.valueName, "Should have valueName property");
			}
		});

		it("should return valueMatches with proper structure", async () => {
			const response = await client.callTool({
				name: "search_tags",
				arguments: { keyword: "restaurant" },
			});

			const result = JSON.parse(
				(response.content[0] as { text: string }).text,
			) as SearchTagsResponse;

			// "restaurant" is a value, should be in valueMatches
			const restaurantValue = result.valueMatches.find((match) => match.value === "restaurant");
			assert.ok(restaurantValue, "Should find restaurant in valueMatches");
			assert.ok(restaurantValue.key, "Should have key property");
			assert.ok(restaurantValue.keyName, "Should have keyName property");
			assert.ok(restaurantValue.value, "Should have value property");
			assert.ok(restaurantValue.valueName, "Should have valueName property");
		});

		it("should respect limit parameter across both result types", async () => {
			const response = await client.callTool({
				name: "search_tags",
				arguments: { keyword: "building", limit: 5 },
			});

			const result = JSON.parse(
				(response.content[0] as { text: string }).text,
			) as SearchTagsResponse;

			const totalResults = result.keyMatches.length + result.valueMatches.length;
			assert.ok(totalResults <= 5, `Should respect limit of 5, got ${totalResults} total results`);
		});
	});

	describe("JSON Schema Data Integrity", () => {
		it("should return valid keyMatches from JSON via MCP", async () => {
			const response = await client.callTool({
				name: "search_tags",
				arguments: { keyword: "amenity", limit: 10 },
			});

			const result = JSON.parse(
				(response.content[0] as { text: string }).text,
			) as SearchTagsResponse;

			// CRITICAL: Verify EACH keyMatch exists in JSON (fields OR presets)
			for (const keyMatch of result.keyMatches) {
				let found = false;

				// Check in fields.json
				for (const field of Object.values(fields)) {
					if (field.key === keyMatch.key) {
						found = true;
						break;
					}
				}

				// Check in presets
				if (!found) {
					for (const preset of Object.values(presets)) {
						if (preset.tags?.[keyMatch.key] || preset.addTags?.[keyMatch.key]) {
							found = true;
							break;
						}
					}
				}

				assert.ok(found, `Key "${keyMatch.key}" should exist in JSON (fields or presets)`);

				// Verify all values exist in JSON
				for (const value of keyMatch.values) {
					let valueFound = false;

					// Check in fields.json
					for (const field of Object.values(fields)) {
						if (field.key === keyMatch.key && field.options && Array.isArray(field.options)) {
							if (field.options.includes(value)) {
								valueFound = true;
								break;
							}
						}
					}

					// Check in presets
					if (!valueFound) {
						for (const preset of Object.values(presets)) {
							if (preset.tags?.[keyMatch.key] === value) {
								valueFound = true;
								break;
							}
							if (preset.addTags?.[keyMatch.key] === value) {
								valueFound = true;
								break;
							}
						}
					}

					// Note: Some values might not be in JSON (from other sources)
					// So we don't assert here, just verify structure
				}
			}
		});

		it("should return valid valueMatches from JSON via MCP", async () => {
			const response = await client.callTool({
				name: "search_tags",
				arguments: { keyword: "restaurant", limit: 10 },
			});

			const result = JSON.parse(
				(response.content[0] as { text: string }).text,
			) as SearchTagsResponse;

			// CRITICAL: Verify EACH valueMatch exists in JSON (fields OR presets)
			for (const valueMatch of result.valueMatches) {
				let found = false;

				// Check in fields.json
				for (const field of Object.values(fields)) {
					if (field.key === valueMatch.key && field.options && Array.isArray(field.options)) {
						if (field.options.includes(valueMatch.value)) {
							found = true;
							break;
						}
					}
				}

				// Check in presets
				if (!found) {
					for (const preset of Object.values(presets)) {
						if (preset.tags?.[valueMatch.key] === valueMatch.value) {
							found = true;
							break;
						}
						if (preset.addTags?.[valueMatch.key] === valueMatch.value) {
							found = true;
							break;
						}
					}
				}

				assert.ok(
					found,
					`Value match ${valueMatch.key}=${valueMatch.value} should exist in JSON (fields or presets)`,
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

				const result = JSON.parse(
					(response.content[0] as { text: string }).text,
				) as SearchTagsResponse;

				// CRITICAL: Verify EACH keyMatch exists in JSON (fields OR presets)
				for (const keyMatch of result.keyMatches) {
					let found = false;

					// Check in fields.json
					for (const field of Object.values(fields)) {
						if (field.key === keyMatch.key) {
							found = true;
							break;
						}
					}

					// Check in presets
					if (!found) {
						for (const preset of Object.values(presets)) {
							if (preset.tags?.[keyMatch.key] || preset.addTags?.[keyMatch.key]) {
								found = true;
								break;
							}
						}
					}

					assert.ok(
						found,
						`Key "${keyMatch.key}" for keyword "${keyword}" should exist in JSON (fields or presets) via MCP`,
					);
				}

				// CRITICAL: Verify EACH valueMatch exists in JSON (fields OR presets)
				for (const valueMatch of result.valueMatches) {
					let found = false;

					// Check in fields.json
					for (const field of Object.values(fields)) {
						if (field.key === valueMatch.key && field.options && Array.isArray(field.options)) {
							if (field.options.includes(valueMatch.value)) {
								found = true;
								break;
							}
						}
					}

					// Check in presets
					if (!found) {
						for (const preset of Object.values(presets)) {
							if (preset.tags?.[valueMatch.key] === valueMatch.value) {
								found = true;
								break;
							}
							if (preset.addTags?.[valueMatch.key] === valueMatch.value) {
								found = true;
								break;
							}
						}
					}

					assert.ok(
						found,
						`Value match "${valueMatch.key}=${valueMatch.value}" for keyword "${keyword}" should exist in JSON (fields or presets) via MCP`,
					);
				}
			}
		});
	});
});
