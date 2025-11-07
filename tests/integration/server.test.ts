import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

describe("MCP Server Integration", () => {
	let client: Client;
	let transport: StdioClientTransport;

	before(async () => {
		// Create transport to communicate with the server via stdio
		transport = new StdioClientTransport({
			command: "node",
			args: ["./dist/index.js"],
		});

		// Create client instance
		client = new Client(
			{
				name: "test-client",
				version: "1.0.0",
			},
			{
				capabilities: {},
			},
		);

		// Connect to the server
		await client.connect(transport);
	});

	after(async () => {
		// Clean up: close the client connection
		await client.close();
	});

	describe("Server Initialization", () => {
		it("should successfully connect to the server", () => {
			// If we reached this point, connection was successful
			assert.ok(client);
		});

		it("should have correct server info", async () => {
			// The server should have name and version
			const serverInfo = client.getServerVersion();
			assert.ok(serverInfo);
		});
	});

	describe("Tools", () => {
		it("should list available tools", async () => {
			const response = await client.listTools();

			assert.ok(response);
			assert.ok(Array.isArray(response.tools));
			// Currently server returns empty tools list
			assert.strictEqual(response.tools.length, 0);
		});

		it("should throw error for unknown tool", async () => {
			await assert.rejects(
				async () => {
					await client.callTool({
						name: "unknown-tool",
						arguments: {},
					});
				},
				{
					message: /Unknown tool/,
				},
			);
		});
	});

	// Note: Resources and Prompts capabilities are not yet implemented
	// These tests will be added in future phases
});
