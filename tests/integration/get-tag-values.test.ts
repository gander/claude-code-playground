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

			// Parse the response object (NEW FORMAT)
			const result = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(typeof result === "object", "Should return an object");
			assert.ok("key" in result, "Should have 'key' field");
			assert.ok("keyName" in result, "Should have 'keyName' field");
			assert.ok("values" in result, "Should have 'values' field");
			assert.ok("valuesDetailed" in result, "Should have 'valuesDetailed' field");

			// Check values array
			assert.ok(Array.isArray(result.values), "values should be an array");
			assert.ok(result.values.length > 0, "values should have at least one item");

			// Check valuesDetailed array
			assert.ok(Array.isArray(result.valuesDetailed), "valuesDetailed should be an array");
			assert.ok(result.valuesDetailed.length > 0, "valuesDetailed should have at least one item");

			// Check structure of first item in valuesDetailed
			const firstValue = result.valuesDetailed[0];
			assert.ok(firstValue, "Should have at least one value");
			assert.ok(typeof firstValue === "object", "Value should be an object");
			assert.ok(typeof firstValue.value === "string", "Value should have a 'value' property");
			assert.ok(
				typeof firstValue.valueName === "string",
				"Value should have a 'valueName' property",
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

			const result = JSON.parse((response.content[0] as { text: string }).text);

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

			// Verify all values match exactly (bidirectional) using NEW FORMAT
			assert.deepStrictEqual(
				new Set(result.values),
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

				const result = JSON.parse((response.content[0] as { text: string }).text);
				const returnedSet = new Set(result.values);

				// Bidirectional validation through MCP (using NEW FORMAT)
				assert.deepStrictEqual(
					returnedSet,
					testCase.expectedValues,
					`Tag key "${testCase.key}" should return correct values via MCP`,
				);
			}
		});
	});
});
