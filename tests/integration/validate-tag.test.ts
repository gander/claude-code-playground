/**
 * Integration tests for validate_tag tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import { setupClientServer, type TestServer, teardownClientServer } from "./helpers.js";

describe("Integration: validate_tag", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Tool Registration", () => {
		it("should register validate_tag tool", async () => {
			const response = await client.listTools();

			assert.ok(response.tools);
			const validateTagTool = response.tools.find((t) => t.name === "validate_tag");

			assert.ok(validateTagTool, "validate_tag tool should be registered");
			assert.strictEqual(validateTagTool.name, "validate_tag");
			assert.ok(validateTagTool.description);
			assert.ok(validateTagTool.inputSchema);
			assert.deepStrictEqual(validateTagTool.inputSchema.required, ["key", "value"]);
		});
	});

	describe("Basic Validation", () => {
		it("should validate a valid tag from fields.json", async () => {
			const response = await client.callTool({
				name: "validate_tag",
				arguments: {
					key: "access",
					value: "yes",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.deprecated, false);
			assert.ok(result.message);
			assert.match(result.message, /valid/i);
		});

		it("should detect deprecated tag from deprecated.json", async () => {
			// Use first deprecated entry from JSON
			const deprecatedEntry = deprecated[0];
			const oldKey = Object.keys(deprecatedEntry.old)[0];
			const oldValue = deprecatedEntry.old[oldKey];

			const response = await client.callTool({
				name: "validate_tag",
				arguments: {
					key: oldKey,
					value: oldValue,
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.deprecated, true);
			assert.ok(result.replacement);
			assert.ok(result.message);
			assert.match(result.message, /deprecated/i);
		});

		it("should warn about unknown key not in fields.json", async () => {
			const response = await client.callTool({
				name: "validate_tag",
				arguments: {
					key: "nonexistent_unknown_key_12345",
					value: "some_value",
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.valid, true);
			assert.ok(result.message);
			assert.match(result.message, /not found in schema/i);
		});

		it("should validate value against field options", async () => {
			// Find a field with options
			const fieldWithOptions = Object.entries(fields).find(
				([_, field]) => field.options && field.options.length > 0,
			);
			assert.ok(fieldWithOptions, "Should find field with options");

			const [_, field] = fieldWithOptions;
			const key = field.key || fieldWithOptions[0].replace(/\//g, ":");
			const validValue = field.options[0];

			const response = await client.callTool({
				name: "validate_tag",
				arguments: {
					key,
					value: validValue,
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.valid, true);
		});
	});

	describe("Error Handling", () => {
		it("should return error for empty key", async () => {
			const response = await client.callTool({
				name: "validate_tag",
				arguments: {
					key: "",
					value: "some_value",
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.valid, false);
			assert.ok(result.message);
			assert.match(result.message, /empty/i);
		});

		it("should return error for empty value", async () => {
			const response = await client.callTool({
				name: "validate_tag",
				arguments: {
					key: "amenity",
					value: "",
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.valid, false);
			assert.ok(result.message);
			assert.match(result.message, /empty/i);
		});
	});

	describe("JSON Schema Data Integrity", () => {
		it("should handle all deprecated tags from deprecated.json", async () => {
			// Test first 20 deprecated entries
			const testEntries = deprecated.slice(0, 20);

			for (const entry of testEntries) {
				const oldKeys = Object.keys(entry.old);
				if (oldKeys.length !== 1) continue;

				const oldKey = oldKeys[0];
				const oldValue = entry.old[oldKey];

				const response = await client.callTool({
					name: "validate_tag",
					arguments: {
						key: oldKey,
						value: oldValue,
					},
				});

				assert.ok(response.content);
				const result = JSON.parse((response.content[0] as { text: string }).text);

				assert.strictEqual(
					result.deprecated,
					true,
					`Tag ${oldKey}=${oldValue} should be marked as deprecated`,
				);
				assert.ok(
					result.replacement,
					`Deprecated tag ${oldKey}=${oldValue} should have replacement`,
				);
			}
		});

		it("should validate against all fields with options from fields.json", async () => {
			// Get all fields with options
			const fieldsWithOptions = Object.entries(fields)
				.filter(([_, field]) => field.options && field.options.length > 0)
				.slice(0, 30); // Test first 30 for performance

			assert.ok(fieldsWithOptions.length > 0, "Should have fields with options");

			for (const [fieldPath, field] of fieldsWithOptions) {
				const key = field.key || fieldPath.replace(/\//g, ":");
				const validValue = field.options[0];

				const response = await client.callTool({
					name: "validate_tag",
					arguments: {
						key,
						value: validValue,
					},
				});

				assert.ok(response.content, `Should get response for ${key}=${validValue}`);
				const result = JSON.parse((response.content[0] as { text: string }).text);

				assert.strictEqual(result.valid, true, `Tag ${key}=${validValue} should be valid`);
			}
		});

		it("should warn about values not in field options", async () => {
			// Find a field with limited options (not combo type)
			const fieldWithOptions = Object.entries(fields).find(
				([_, field]) => field.options && field.options.length > 0 && field.type !== "combo",
			);

			if (!fieldWithOptions) {
				// Skip if no suitable field found
				return;
			}

			const [_, field] = fieldWithOptions;
			const key = field.key || fieldWithOptions[0].replace(/\//g, ":");
			const invalidValue = "definitely_not_a_valid_value_12345";

			const response = await client.callTool({
				name: "validate_tag",
				arguments: {
					key,
					value: invalidValue,
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.message, `Should have message for invalid value on ${key}`);
			assert.match(result.message, /not in the standard options/i);
		});
	});
});
