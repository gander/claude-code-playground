/**
 * Integration tests for get_tag_info tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setupClientServer, teardownClientServer, type TestServer } from "./helpers.js";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };

describe("get_tag_info integration", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Basic Functionality", () => {
		it("should call get_tag_info tool successfully", async () => {
			const response = await client.callTool({
				name: "get_tag_info",
				arguments: { tagKey: "parking" },
			});

			assert.ok(response);
			assert.ok(response.content);
			assert.ok(Array.isArray(response.content));
			assert.strictEqual(response.content.length, 1);
			assert.strictEqual(response.content[0]?.type, "text");

			// Parse the info from the response
			const info = JSON.parse((response.content[0] as { text: string }).text);
			assert.ok(typeof info.key === "string");
			assert.strictEqual(info.key, "parking");
			assert.ok(Array.isArray(info.values));
			assert.ok(info.values.length > 0);
			assert.ok(typeof info.hasFieldDefinition === "boolean");
			assert.strictEqual(info.hasFieldDefinition, true);
			assert.ok(typeof info.type === "string");
		});

		it("should call get_tag_info tool for tag without field definition", async () => {
			const response = await client.callTool({
				name: "get_tag_info",
				arguments: { tagKey: "amenity" },
			});

			assert.ok(response);
			const info = JSON.parse((response.content[0] as { text: string }).text);
			assert.strictEqual(info.key, "amenity");
			assert.ok(Array.isArray(info.values));
		});

		it("should throw error for missing tagKey parameter in get_tag_info", async () => {
			await assert.rejects(
				async () => {
					await client.callTool({
						name: "get_tag_info",
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
		it("should return tag info matching JSON data via MCP", async () => {
			const response = await client.callTool({
				name: "get_tag_info",
				arguments: { tagKey: "parking" },
			});

			const info = JSON.parse((response.content[0] as { text: string }).text);

			// Collect expected values from JSON
			const expectedValues = new Set<string>();

			// From fields
			const field = fields.parking;
			if (field?.options && Array.isArray(field.options)) {
				for (const option of field.options) {
					if (typeof option === "string") {
						expectedValues.add(option);
					}
				}
			}

			// From presets
			for (const preset of Object.values(presets)) {
				if (preset.tags?.parking) {
					const value = preset.tags.parking;
					if (value && value !== "*" && !value.includes("|")) {
						expectedValues.add(value);
					}
				}
				if (preset.addTags?.parking) {
					const value = preset.addTags.parking;
					if (value && value !== "*" && !value.includes("|")) {
						expectedValues.add(value);
					}
				}
			}

			// CRITICAL: Validate EACH returned value individually via MCP
			for (const value of info.values) {
				assert.ok(
					expectedValues.has(value),
					`Value "${value}" should exist in JSON data via MCP`,
				);
			}

			// CRITICAL: Bidirectional validation via MCP
			const returnedSet = new Set(info.values);
			for (const expected of expectedValues) {
				assert.ok(
					returnedSet.has(expected),
					`JSON value "${expected}" should be returned via MCP`,
				);
			}

			// Verify field definition properties
			assert.strictEqual(
				info.hasFieldDefinition,
				true,
				"parking should have field definition via MCP",
			);
			assert.strictEqual(
				info.type,
				field.type,
				"Type should match field definition via MCP",
			);
		});

		it("should validate tag info for ALL keys via MCP using provider pattern", async () => {
			// CRITICAL: Collect ALL unique tag keys from JSON (100% coverage)
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

			// CRITICAL: Test EACH key individually via MCP (no sampling!)
			for (const key of allKeys) {
				const response = await client.callTool({
					name: "get_tag_info",
					arguments: { tagKey: key },
				});

				const info = JSON.parse((response.content[0] as { text: string }).text);

				// Collect expected values from JSON
				const expectedValues = new Set<string>();
				let hasFieldDef = false;

				// Fields are stored with slash separator, so convert key
				const fieldKeyLookup = key.replace(/:/g, "/");
				const field = fields[fieldKeyLookup];
				if (field) {
					hasFieldDef = true;
					if (field.options && Array.isArray(field.options)) {
						for (const option of field.options) {
							if (typeof option === "string") {
								expectedValues.add(option);
							}
						}
					}
				}

				// Collect from presets
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

				// Validate field definition flag
				assert.strictEqual(
					info.hasFieldDefinition,
					hasFieldDef,
					`Key "${key}" field definition flag should match JSON via MCP`,
				);

				// CRITICAL: Validate EACH value individually via MCP
				const returnedSet = new Set(info.values);
				for (const value of info.values) {
					assert.ok(
						expectedValues.has(value),
						`Value "${value}" for key "${key}" should exist in JSON via MCP`,
					);
				}

				// CRITICAL: Bidirectional validation via MCP
				for (const expected of expectedValues) {
					assert.ok(
						returnedSet.has(expected),
						`JSON value "${expected}" for key "${key}" should be returned via MCP`,
					);
				}
			}
		});
	});
});
