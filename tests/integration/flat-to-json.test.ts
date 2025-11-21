/**
 * Integration tests for flat_to_json tool
 */

import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { setupClientServer, type TestServer, teardownClientServer } from "./helpers.js";

describe("Integration: flat_to_json", () => {
	let client: Client;
	let server: TestServer;

	beforeEach(async () => {
		({ client, server } = await setupClientServer());
	});

	afterEach(async () => {
		await teardownClientServer(client, server);
	});

	describe("Tool Registration", () => {
		it("should register flat_to_json tool", async () => {
			const response = await client.listTools();

			assert.ok(response.tools);
			const tool = response.tools.find((t) => t.name === "flat_to_json");

			assert.ok(tool, "flat_to_json tool should be registered");
			assert.strictEqual(tool.name, "flat_to_json");
			assert.ok(tool.description);
			assert.match(tool.description, /flat text.*JSON/i);
			assert.ok(tool.inputSchema);
		});
	});

	describe("Basic Conversion", () => {
		it("should convert flat text to JSON object", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: "amenity=restaurant\nname=Test Restaurant",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				name: "Test Restaurant",
			});
		});

		it("should handle single tag", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: "building=yes",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.deepStrictEqual(result, { building: "yes" });
		});

		it("should handle empty input", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: "",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.deepStrictEqual(result, {});
		});
	});

	describe("Line Endings", () => {
		it("should handle Windows line endings (CRLF)", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: "highway=primary\r\nname=Main Street",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.deepStrictEqual(result, {
				highway: "primary",
				name: "Main Street",
			});
		});

		it("should handle mixed line endings", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: "amenity=restaurant\r\nname=Test\nhighway=primary",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				name: "Test",
				highway: "primary",
			});
		});
	});

	describe("Comments and Empty Lines", () => {
		it("should skip comment lines", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: "# This is a comment\namenity=restaurant\n# Another comment\nname=Test",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				name: "Test",
			});
		});

		it("should skip empty lines", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: "amenity=restaurant\n\n\nname=Test\n\n",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				name: "Test",
			});
		});
	});

	describe("Special Characters", () => {
		it("should handle equals signs in values", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: "note=height=5m",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.deepStrictEqual(result, { note: "height=5m" });
		});

		it("should handle colons in keys", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: "addr:street=Main Street\ncontact:phone=+1234567890",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.deepStrictEqual(result, {
				"addr:street": "Main Street",
				"contact:phone": "+1234567890",
			});
		});

		it("should handle Unicode characters", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: "name=Café René\nname:ja=カフェ",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.deepStrictEqual(result, {
				name: "Café René",
				"name:ja": "カフェ",
			});
		});
	});

	describe("Error Handling", () => {
		it("should return error for lines without equals sign", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: "amenity=restaurant\ninvalid line without equals",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.error);
			assert.match(result.error, /missing '=' separator/i);
		});

		it("should return error for empty key", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: "=value",
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.ok(result.error);
			assert.match(result.error, /empty key/i);
		});
	});

	describe("Real World Examples", () => {
		it("should convert restaurant tags", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: `amenity=restaurant
name=Pizza House
cuisine=pizza
opening_hours=Mo-Su 10:00-22:00
wheelchair=yes`,
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				name: "Pizza House",
				cuisine: "pizza",
				opening_hours: "Mo-Su 10:00-22:00",
				wheelchair: "yes",
			});
		});

		it("should convert building with address tags", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: `building=residential
addr:housenumber=123
addr:street=Main Street
addr:city=Springfield
addr:postcode=12345`,
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.deepStrictEqual(result, {
				building: "residential",
				"addr:housenumber": "123",
				"addr:street": "Main Street",
				"addr:city": "Springfield",
				"addr:postcode": "12345",
			});
		});

		it("should handle complex example with comments", async () => {
			const response = await client.callTool({
				name: "flat_to_json",
				arguments: {
					tags: `# Restaurant in downtown
amenity=restaurant
name=Bella Italia
cuisine=italian
# Contact information
contact:phone=+1-555-0123
contact:website=https://bella-italia.example.com`,
				},
			});

			assert.ok(response.content);
			assert.ok(response.content[0]);
			const result = JSON.parse((response.content[0] as { text: string }).text);

			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				name: "Bella Italia",
				cuisine: "italian",
				"contact:phone": "+1-555-0123",
				"contact:website": "https://bella-italia.example.com",
			});
		});
	});
});
