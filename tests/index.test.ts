import assert from "node:assert";
import { describe, it } from "node:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createServer } from "../src/index.ts";

describe("MCP Server", () => {
	it("should create a server instance", () => {
		const server = createServer();
		assert.ok(server instanceof McpServer);
	});
});
