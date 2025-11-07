import assert from "node:assert";
import { describe, it } from "node:test";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { createServer } from "../src/index.ts";

describe("MCP Server", () => {
	it("should create a server instance", () => {
		const server = createServer();
		assert.ok(server instanceof Server);
	});
});
