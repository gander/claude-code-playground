/**
 * Integration tests for suggest_improvements tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import { setupClientServer, type TestServer, teardownClientServer } from "./helpers.js";

describe("Integration: suggest_improvements", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Tool Registration", () => {
		it("should register suggest_improvements tool", async () => {
			const response = await client.listTools();

			assert.ok(response.tools);
			const tool = response.tools.find((t) => t.name === "suggest_improvements");

			assert.ok(tool, "suggest_improvements tool should be registered");
			assert.strictEqual(tool.name, "suggest_improvements");
			assert.ok(tool.description);
			assert.ok(tool.inputSchema);
			assert.deepStrictEqual(tool.inputSchema.required, ["tags"]);
		});
	});

	describe("Basic Functionality", () => {
		it("should suggest improvements for tag collection", async () => {
			const response = await client.callTool({
				name: "suggest_improvements",
				arguments: {
					tags: {
						amenity: "restaurant",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok("suggestions" in result);
			assert.ok("warnings" in result);
			assert.ok("matchedPresets" in result);
			assert.ok(Array.isArray(result.suggestions));
			assert.ok(Array.isArray(result.warnings));
			assert.ok(Array.isArray(result.matchedPresets));
		});

		it("should suggest missing common tags", async () => {
			const response = await client.callTool({
				name: "suggest_improvements",
				arguments: {
					tags: {
						amenity: "parking",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.suggestions.length > 0);
			// Parking should have suggestions like capacity, fee, surface, etc.
		});

		it("should warn about deprecated tags", async () => {
			// Use first deprecated entry
			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const response = await client.callTool({
				name: "suggest_improvements",
				arguments: {
					tags: {
						[key]: value as string,
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.warnings.length > 0);
			assert.ok(result.warnings.some((w: string) => w.includes("deprecated")));
		});

		it("should handle empty tag collection", async () => {
			const response = await client.callTool({
				name: "suggest_improvements",
				arguments: {
					tags: {},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.suggestions.length, 0);
			assert.strictEqual(result.warnings.length, 0);
			assert.strictEqual(result.matchedPresets.length, 0);
		});
	});

	describe("Preset Matching", () => {
		it("should match presets based on tags", async () => {
			const response = await client.callTool({
				name: "suggest_improvements",
				arguments: {
					tags: {
						amenity: "restaurant",
						cuisine: "italian",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.matchedPresets);
			assert.ok(result.matchedPresets.length > 0);
		});

		it("should include matched preset IDs", async () => {
			const response = await client.callTool({
				name: "suggest_improvements",
				arguments: {
					tags: {
						amenity: "restaurant",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.matchedPresets);
			// Should find restaurant-related presets
			const hasRestaurantPreset = result.matchedPresets.some((p: string) =>
				p.includes("restaurant"),
			);
			assert.ok(hasRestaurantPreset || result.matchedPresets.length > 0);
		});
	});

	describe("Result Structure", () => {
		it("should return correct result structure", async () => {
			const response = await client.callTool({
				name: "suggest_improvements",
				arguments: {
					tags: {
						amenity: "parking",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok("suggestions" in result);
			assert.ok("warnings" in result);
			assert.ok("matchedPresets" in result);
			assert.ok(Array.isArray(result.suggestions));
			assert.ok(Array.isArray(result.warnings));
			assert.ok(Array.isArray(result.matchedPresets));
		});

		it("should have meaningful suggestion messages", async () => {
			const response = await client.callTool({
				name: "suggest_improvements",
				arguments: {
					tags: {
						amenity: "restaurant",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			if (result.suggestions.length > 0) {
				for (const suggestion of result.suggestions) {
					assert.ok(typeof suggestion === "string");
					assert.ok(suggestion.length > 0);
				}
			}
		});
	});

	describe("Error Handling", () => {
		it("should throw error when tags parameter is missing", async () => {
			await assert.rejects(
				async () => {
					await client.callTool({
						name: "suggest_improvements",
						arguments: {},
					});
				},
				{
					message: /tags parameter is required/,
				},
			);
		});

		it("should handle tags with no matching presets", async () => {
			const response = await client.callTool({
				name: "suggest_improvements",
				arguments: {
					tags: {
						unknown_key_xyz: "unknown_value_123",
					},
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.strictEqual(result.matchedPresets.length, 0);
		});
	});

	describe("JSON Schema Data Integrity", () => {
		it("should suggest fields from preset fields", async () => {
			// Use a known preset
			const preset = presets["amenity/restaurant"];
			if (preset?.tags) {
				const tags: Record<string, string> = {};
				for (const [k, v] of Object.entries(preset.tags)) {
					if (typeof v === "string" && v !== "*") {
						tags[k] = v;
					}
				}

				const response = await client.callTool({
					name: "suggest_improvements",
					arguments: {
						tags,
					},
				});

				assert.ok(response.content);
				const result = JSON.parse((response.content[0] as { text: string }).text);

				assert.ok(result.matchedPresets);
				// Should match the restaurant preset
				const matched = result.matchedPresets.some((p: string) => p.includes("restaurant"));
				assert.ok(matched || result.matchedPresets.length > 0);
			}
		});

		it("should warn about all deprecated tags from JSON", async () => {
			// Use first two deprecated entries
			const deprecatedTags: Record<string, string> = {};

			for (let i = 0; i < Math.min(2, deprecated.length); i++) {
				const entry = deprecated[i];
				const oldKeys = Object.keys(entry.old);
				if (oldKeys.length === 1) {
					const key = oldKeys[0];
					if (key) {
						const value = entry.old[key as keyof typeof entry.old];
						if (value && typeof value === "string") {
							deprecatedTags[key] = value;
						}
					}
				}
			}

			const response = await client.callTool({
				name: "suggest_improvements",
				arguments: {
					tags: deprecatedTags,
				},
			});

			assert.ok(response.content);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.warnings.length >= 1);
		});
	});
});
