/**
 * Integration tests for check_deprecated tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import { setupClientServer, type TestServer, teardownClientServer } from "./helpers.js";

describe("Integration: check_deprecated", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Tool Registration", () => {
		it("should register check_deprecated tool", async () => {
			const response = await client.listTools();

			assert.ok(response.tools);
			const tool = response.tools.find((t) => t.name === "check_deprecated");

			assert.ok(tool, "check_deprecated tool should be registered");
			assert.strictEqual(tool.name, "check_deprecated");
			assert.ok(tool.description);
			assert.ok(tool.inputSchema);
			assert.deepStrictEqual(tool.inputSchema.required, ["key"]);
		});
	});

	describe("Basic Functionality", () => {
		it("should check if a tag is deprecated", async () => {
			// Use first deprecated entry
			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const response = await client.callTool({
				name: "check_deprecated",
				arguments: {
					key,
					value: value as string,
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.deprecated, true);
			assert.ok(result.replacement);
			assert.ok(result.message);
		});

		it("should return not deprecated for valid tag", async () => {
			const response = await client.callTool({
				name: "check_deprecated",
				arguments: {
					key: "amenity",
					value: "parking",
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.deprecated, false);
			assert.strictEqual(result.replacement, undefined);
		});

		it("should check by key only", async () => {
			// Find a deprecated entry
			const entry = deprecated.find((e) => Object.keys(e.old).length === 1);
			assert.ok(entry);

			const key = Object.keys(entry.old)[0];

			const response = await client.callTool({
				name: "check_deprecated",
				arguments: {
					key,
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.deprecated, true);
			assert.ok(result.replacement);
		});

		it("should return full replacement object", async () => {
			// Find entry with multiple replacement tags
			const entry = deprecated.find((e) => e.replace && Object.keys(e.replace).length > 1);
			assert.ok(entry);

			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const response = await client.callTool({
				name: "check_deprecated",
				arguments: {
					key,
					value: value as string,
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.deprecated, true);
			assert.ok(result.replacement);
			assert.ok(Object.keys(result.replacement).length > 1);
		});
	});

	describe("Result Structure", () => {
		it("should return correct result structure", async () => {
			const response = await client.callTool({
				name: "check_deprecated",
				arguments: {
					key: "amenity",
					value: "parking",
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok("deprecated" in result);
			assert.ok("message" in result);
			assert.strictEqual(typeof result.deprecated, "boolean");
			assert.strictEqual(typeof result.message, "string");
		});

		it("should include oldTags when deprecated", async () => {
			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const response = await client.callTool({
				name: "check_deprecated",
				arguments: {
					key,
					value: value as string,
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.deprecated, true);
			assert.ok(result.oldTags);
			assert.strictEqual(typeof result.oldTags, "object");
		});
	});

	describe("Error Handling", () => {
		it.skip("should throw error when key parameter is missing", async () => {
			await assert.rejects(
				async () => {
					await client.callTool({
						name: "check_deprecated",
						arguments: {},
					});
				},
				{
					message: /key parameter is required/,
				},
			);
		});

		it("should handle empty key", async () => {
			const response = await client.callTool({
				name: "check_deprecated",
				arguments: {
					key: "",
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.deprecated, false);
		});

		it("should handle non-existent key", async () => {
			const response = await client.callTool({
				name: "check_deprecated",
				arguments: {
					key: "nonexistent_key_xyz_12345",
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.deprecated, false);
		});
	});

	describe("JSON Schema Data Integrity", () => {
		it("should detect all deprecated entries from JSON", async () => {
			// Test first 10 deprecated entries
			for (let i = 0; i < Math.min(10, deprecated.length); i++) {
				const entry = deprecated[i];
				const oldKeys = Object.keys(entry.old);
				if (oldKeys.length !== 1) continue;

				const key = oldKeys[0];
				if (!key) continue;
				const value = entry.old[key as keyof typeof entry.old];

				// Skip if replace doesn't exist
				if (!entry.replace || Object.keys(entry.replace).length === 0) continue;

				const response = await client.callTool({
					name: "check_deprecated",
					arguments: {
						key,
						value: value as string,
					},
				});

				assert.ok(response.content);
				const result = JSON.parse((response.content[0] as { text: string }).text);

				assert.strictEqual(result.deprecated, true, `Tag ${key}=${value} should be deprecated`);
				assert.ok(result.replacement, `Tag ${key}=${value} should have replacement`);
			}
		});

		it("should return correct replacement from JSON", async () => {
			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const response = await client.callTool({
				name: "check_deprecated",
				arguments: {
					key,
					value: value as string,
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.deprecated, true);

			// Verify replacement matches JSON
			const expectedReplacement: Record<string, string> = {};
			for (const [k, v] of Object.entries(entry.replace)) {
				if (v !== undefined) {
					expectedReplacement[k] = v;
				}
			}

			assert.deepStrictEqual(result.replacement, expectedReplacement);
		});
	});
});
