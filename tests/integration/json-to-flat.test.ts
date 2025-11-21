/**
 * Integration tests for json_to_flat tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setupClientServer, type TestServer, teardownClientServer } from "./helpers.js";

describe("Integration: json_to_flat", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Tool Registration", () => {
		it("should register json_to_flat tool", async () => {
			const response = await client.listTools();

			assert.ok(response.tools);
			const tool = response.tools.find((t) => t.name === "json_to_flat");

			assert.ok(tool, "json_to_flat tool should be registered");
			assert.strictEqual(tool.name, "json_to_flat");
			assert.ok(tool.description);
			assert.match(tool.description, /JSON.*flat text/i);
			assert.ok(tool.inputSchema);
		});
	});

	describe("Basic Conversion", () => {
		it("should convert JSON object to flat text format", async () => {
			const response = await client.callTool({
				name: "json_to_flat",
				arguments: {
					tags: { amenity: "restaurant", name: "Test Restaurant" },
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = (response.content[0] as { text: string }).text;

			assert.ok(result.includes("amenity=restaurant"));
			assert.ok(result.includes("name=Test Restaurant"));

			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 2);
		});

		it("should convert JSON string to flat text format", async () => {
			const response = await client.callTool({
				name: "json_to_flat",
				arguments: {
					tags: '{"highway":"primary","name":"Main Street"}',
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = (response.content[0] as { text: string }).text;

			assert.ok(result.includes("highway=primary"));
			assert.ok(result.includes("name=Main Street"));

			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 2);
		});

		it("should handle empty object", async () => {
			const response = await client.callTool({
				name: "json_to_flat",
				arguments: {
					tags: {},
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = (response.content[0] as { text: string }).text;

			assert.strictEqual(result.trim(), "");
		});
	});

	describe("Special Characters", () => {
		it("should handle tags with colons and special characters", async () => {
			const response = await client.callTool({
				name: "json_to_flat",
				arguments: {
					tags: {
						"addr:street": "Main Street",
						"contact:phone": "+1234567890",
						website: "https://example.com",
					},
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = (response.content[0] as { text: string }).text;

			assert.ok(result.includes("addr:street=Main Street"));
			assert.ok(result.includes("contact:phone=+1234567890"));
			assert.ok(result.includes("website=https://example.com"));
		});

		it("should handle equals signs in values", async () => {
			const response = await client.callTool({
				name: "json_to_flat",
				arguments: {
					tags: { note: "height=5m" },
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = (response.content[0] as { text: string }).text;

			assert.ok(result.includes("note=height=5m"));
		});
	});

	describe("Error Handling", () => {
		it("should return error for invalid JSON string", async () => {
			const response = await client.callTool({
				name: "json_to_flat",
				arguments: {
					tags: "{invalid json}",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.error);
			assert.match(result.error, /Invalid JSON/i);
		});

		it("should return error for JSON array", async () => {
			const response = await client.callTool({
				name: "json_to_flat",
				arguments: {
					tags: '["amenity", "restaurant"]',
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.error);
			assert.match(result.error, /must be an object/i);
		});
	});

	describe("Real World Examples", () => {
		it("should convert restaurant tags", async () => {
			const response = await client.callTool({
				name: "json_to_flat",
				arguments: {
					tags: {
						amenity: "restaurant",
						name: "Pizza House",
						cuisine: "pizza",
						opening_hours: "Mo-Su 10:00-22:00",
						wheelchair: "yes",
					},
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = (response.content[0] as { text: string }).text;

			assert.ok(result.includes("amenity=restaurant"));
			assert.ok(result.includes("name=Pizza House"));
			assert.ok(result.includes("cuisine=pizza"));
			assert.ok(result.includes("opening_hours=Mo-Su 10:00-22:00"));
			assert.ok(result.includes("wheelchair=yes"));
		});

		it("should convert building with address tags", async () => {
			const response = await client.callTool({
				name: "json_to_flat",
				arguments: {
					tags: {
						building: "residential",
						"addr:housenumber": "123",
						"addr:street": "Main Street",
						"addr:city": "Springfield",
						"addr:postcode": "12345",
					},
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = (response.content[0] as { text: string }).text;

			assert.ok(result.includes("building=residential"));
			assert.ok(result.includes("addr:housenumber=123"));
			assert.ok(result.includes("addr:street=Main Street"));
			assert.ok(result.includes("addr:city=Springfield"));
			assert.ok(result.includes("addr:postcode=12345"));
		});
	});
});
