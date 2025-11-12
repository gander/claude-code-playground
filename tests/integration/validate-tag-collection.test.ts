/**
 * Integration tests for validate_tag_collection tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import { setupClientServer, type TestServer, teardownClientServer } from "./helpers.js";

describe("Integration: validate_tag_collection", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Tool Registration", () => {
		it("should register validate_tag_collection tool", async () => {
			const response = await client.listTools();

			assert.ok(response.tools);
			const tool = response.tools.find((t) => t.name === "validate_tag_collection");

			assert.ok(tool, "validate_tag_collection tool should be registered");
			assert.strictEqual(tool.name, "validate_tag_collection");
			assert.ok(tool.description);
			assert.ok(tool.inputSchema);
			assert.deepStrictEqual(tool.inputSchema.required, ["tags"]);
		});
	});

	describe("Basic Validation", () => {
		it("should validate a collection of valid tags", async () => {
			const response = await client.callTool({
				name: "validate_tag_collection",
				arguments: {
					tags: {
						amenity: "parking",
						parking: "surface",
						capacity: "50",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errorCount, 0);
			assert.ok(result.tagResults);
			assert.strictEqual(Object.keys(result.tagResults).length, 3);
		});

		it("should detect errors in individual tags", async () => {
			const response = await client.callTool({
				name: "validate_tag_collection",
				arguments: {
					tags: {
						amenity: "",
						parking: "surface",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errorCount > 0);
			assert.ok(result.tagResults.amenity);
			assert.strictEqual(result.tagResults.amenity.valid, false);
		});

		it("should detect deprecated tags in collection", async () => {
			// Use first deprecated entry
			const deprecatedEntry = deprecated[0];
			const oldKey = Object.keys(deprecatedEntry.old)[0];
			if (!oldKey) return;
			const oldValue = deprecatedEntry.old[oldKey as keyof typeof deprecatedEntry.old];

			const response = await client.callTool({
				name: "validate_tag_collection",
				arguments: {
					tags: {
						[oldKey]: oldValue as string,
						name: "Test",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.deprecatedCount, 1);
			assert.ok(result.tagResults[oldKey]);
			assert.strictEqual(result.tagResults[oldKey].deprecated, true);
		});

		it("should handle empty tag collection", async () => {
			const response = await client.callTool({
				name: "validate_tag_collection",
				arguments: {
					tags: {},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errorCount, 0);
			assert.strictEqual(result.warningCount, 0);
			assert.strictEqual(Object.keys(result.tagResults).length, 0);
		});
	});

	describe("Result Structure", () => {
		it("should return correct result structure", async () => {
			const response = await client.callTool({
				name: "validate_tag_collection",
				arguments: {
					tags: {
						amenity: "parking",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok("valid" in result);
			assert.ok("tagResults" in result);
			assert.ok("errors" in result);
			assert.ok("warnings" in result);
			assert.ok("deprecatedCount" in result);
			assert.ok("errorCount" in result);
			assert.ok("warningCount" in result);
		});

		it("should include individual tag validation results", async () => {
			const response = await client.callTool({
				name: "validate_tag_collection",
				arguments: {
					tags: {
						amenity: "parking",
						access: "yes",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.tagResults.amenity);
			assert.ok(result.tagResults.access);
			assert.ok("valid" in result.tagResults.amenity);
			assert.ok("deprecated" in result.tagResults.amenity);
		});
	});

	describe("Error Handling", () => {
		// REMOVED: Parameter validation now handled by Zod SDK

		it("should handle tags with empty values", async () => {
			const response = await client.callTool({
				name: "validate_tag_collection",
				arguments: {
					tags: {
						amenity: "",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errorCount > 0);
		});
	});

	describe("JSON Schema Data Integrity", () => {
		it("should validate collections with deprecated tags from JSON", async () => {
			// Test first 5 deprecated entries
			for (let i = 0; i < Math.min(5, deprecated.length); i++) {
				const entry = deprecated[i];
				const oldKeys = Object.keys(entry.old);
				if (oldKeys.length !== 1) continue;

				const oldKey = oldKeys[0];
				if (!oldKey) continue;
				const oldValue = entry.old[oldKey as keyof typeof entry.old];

				// Skip if replace doesn't exist or is empty
				if (!entry.replace || Object.keys(entry.replace).length === 0) continue;

				const tags: Record<string, string> = {
					[oldKey]: oldValue as string,
					name: "Test",
				};

				const response = await client.callTool({
					name: "validate_tag_collection",
					arguments: { tags },
				});

				assert.ok(response.content);
				const result = JSON.parse((response.content[0] as { text: string }).text);

				assert.strictEqual(
					result.deprecatedCount,
					1,
					`Should detect deprecated tag ${oldKey}=${oldValue}`,
				);
			}
		});

		it("should aggregate statistics correctly", async () => {
			const response = await client.callTool({
				name: "validate_tag_collection",
				arguments: {
					tags: {
						amenity: "parking",
						unknown_key_1: "value1",
						unknown_key_2: "value2",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.valid, true);
			assert.ok(result.warningCount >= 2);
			assert.strictEqual(Object.keys(result.tagResults).length, 3);
		});
	});
});
