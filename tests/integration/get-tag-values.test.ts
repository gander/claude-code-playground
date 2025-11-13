/**
 * Integration tests for get_tag_values tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { setupClientServer, type TestServer, teardownClientServer } from "./helpers.js";

describe("get_tag_values integration", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Basic Functionality", () => {
		it("should call get_tag_values tool successfully", async () => {
			const response = await client.callTool({
				name: "get_tag_values",
				arguments: { tagKey: "amenity" },
			});

			assert.ok(response);
			assert.ok(response.content);
			assert.ok(Array.isArray(response.content));
			assert.strictEqual(response.content.length, 1);
			assert.strictEqual(response.content[0]?.type, "text");

			// Parse the values from the response
			const values = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(typeof values === "object" && !Array.isArray(values), "Should return an object");
			assert.ok(Object.keys(values).length > 0, "Should have at least one value");

			// Check structure of first value
			const firstKey = Object.keys(values)[0];
			assert.ok(firstKey, "Should have at least one key");
			assert.ok(typeof values[firstKey] === "object", "Value should be an object");
		});

		it.skip("should throw error for missing tagKey parameter", async () => {
			await assert.rejects(
				async () => {
					await client.callTool({
						name: "get_tag_values",
						arguments: {},
					});
				},
				{
					message: /tagKey parameter is required/,
				},
			);
		});
	});

	describe("JSON Schema Data Integrity", () => {
		/**
		 * Provider pattern: Generates tag keys for MCP validation
		 * CRITICAL: Collects ALL unique tag keys from JSON (100% coverage)
		 */
		function* tagKeyProvider() {
			// CRITICAL: Collect ALL unique tag keys from JSON (fields + presets)
			const allKeys = new Set<string>();

			// Collect from fields - use field.key (actual OSM key with colon)
			// not the map key (which uses slash separator)
			for (const field of Object.values(fields)) {
				if (field.key) {
					allKeys.add(field.key);
				}
			}

			// Collect from presets
			for (const preset of Object.values(presets)) {
				if (preset.tags) {
					for (const key of Object.keys(preset.tags)) {
						allKeys.add(key);
					}
				}
				if (preset.addTags) {
					for (const key of Object.keys(preset.addTags)) {
						allKeys.add(key);
					}
				}
			}

			// CRITICAL: Test EVERY key, not just a sample
			for (const key of allKeys) {
				const expectedValues = new Set<string>();

				// First collect from fields if available
				// Fields are stored with slash separator, so convert key
				const fieldKeyLookup = key.replace(/:/g, "/");
				const field = fields[fieldKeyLookup];
				if (field?.options && Array.isArray(field.options)) {
					for (const option of field.options) {
						if (typeof option === "string") {
							expectedValues.add(option);
						}
					}
				}

				// Then collect from presets
				for (const preset of Object.values(presets)) {
					if (preset.tags?.[key]) {
						const value = preset.tags[key];
						if (value && value !== "*" && !value.includes("|")) {
							expectedValues.add(value);
						}
					}
					if (preset.addTags?.[key]) {
						const value = preset.addTags[key];
						if (value && value !== "*" && !value.includes("|")) {
							expectedValues.add(value);
						}
					}
				}

				if (expectedValues.size > 0) {
					yield { key, expectedValues };
				}
			}
		}

		it("should return correct tag values from JSON via MCP", async () => {
			const response = await client.callTool({
				name: "get_tag_values",
				arguments: { tagKey: "amenity" },
			});

			const values = JSON.parse((response.content[0] as { text: string }).text);

			// Collect expected values from JSON (fields + presets)
			const expectedValues = new Set<string>();

			// First collect from fields
			const field = fields.amenity;
			if (field?.options && Array.isArray(field.options)) {
				for (const option of field.options) {
					if (typeof option === "string") {
						expectedValues.add(option);
					}
				}
			}

			// Then collect from presets
			for (const preset of Object.values(presets)) {
				if (preset.tags?.amenity) {
					const value = preset.tags.amenity;
					if (value && value !== "*" && !value.includes("|")) {
						expectedValues.add(value);
					}
				}
				if (preset.addTags?.amenity) {
					const value = preset.addTags.amenity;
					if (value && value !== "*" && !value.includes("|")) {
						expectedValues.add(value);
					}
				}
			}

			// Verify all values match exactly (bidirectional)
			assert.deepStrictEqual(
				new Set(Object.keys(values)),
				expectedValues,
				"Tag values should match JSON data exactly",
			);
		});

		it("should validate tag values for ALL keys via MCP using provider pattern", async () => {
			// CRITICAL: Test EACH tag key from provider (100% coverage)
			for (const testCase of tagKeyProvider()) {
				const response = await client.callTool({
					name: "get_tag_values",
					arguments: { tagKey: testCase.key },
				});

				const values = JSON.parse((response.content[0] as { text: string }).text);
				const returnedSet = new Set(Object.keys(values));

				// Bidirectional validation through MCP
				assert.deepStrictEqual(
					returnedSet,
					testCase.expectedValues,
					`Tag key "${testCase.key}" should return correct values via MCP`,
				);
			}
		});
	});
});
