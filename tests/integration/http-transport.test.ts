import assert from "node:assert";
import { describe, it, before, after } from "node:test";
import type { Server as HTTPServer } from "node:http";

describe("HTTP Transport Integration", () => {
	let server: HTTPServer;
	let baseUrl: string;
	const TEST_PORT = 3099; // Use non-standard port for testing

	before(async () => {
		// Dynamic import to avoid loading before test setup
		const { startHttpServer } = await import("../../src/transport/http.js");
		const { createServer } = await import("../../src/index.js");

		// Create MCP server
		const mcpServer = createServer();

		// Start HTTP server
		server = await startHttpServer(mcpServer, {
			port: TEST_PORT,
			host: "127.0.0.1",
			sessionMode: "stateful",
			corsEnabled: true,
			corsOrigin: "*",
		});

		baseUrl = `http://127.0.0.1:${TEST_PORT}`;
	});

	after(async () => {
		if (server) {
			await new Promise<void>((resolve) => {
				server.close(() => resolve());
			});
		}
	});

	describe("Health Check", () => {
		it("should respond to health check endpoint", async () => {
			const response = await fetch(`${baseUrl}/health`);
			assert.strictEqual(response.status, 200);

			const data = await response.json();
			assert.strictEqual(data.status, "ok");
			assert.ok(data.timestamp);
		});
	});

	describe("CORS Headers", () => {
		it("should include CORS headers when enabled", async () => {
			const response = await fetch(`${baseUrl}/health`);
			const corsHeader = response.headers.get("access-control-allow-origin");
			assert.strictEqual(corsHeader, "*");
		});

		it("should handle OPTIONS preflight request", async () => {
			const response = await fetch(`${baseUrl}/mcp`, {
				method: "OPTIONS",
			});
			assert.strictEqual(response.status, 204);
		});
	});

	describe("MCP Initialization", () => {
		it("should handle initialization request", async () => {
			const initRequest = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2025-03-26",
					capabilities: {},
					clientInfo: {
						name: "test-client",
						version: "1.0.0",
					},
				},
			};

			const response = await fetch(`${baseUrl}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Mcp-Protocol-Version": "2025-03-26",
					Accept: "application/json, text/event-stream",
				},
				body: JSON.stringify(initRequest),
			});

			assert.strictEqual(response.status, 200);
			const sessionId = response.headers.get("mcp-session-id");
			assert.ok(sessionId, "Session ID should be present in response headers");

			const data = await response.json();
			assert.strictEqual(data.jsonrpc, "2.0");
			assert.strictEqual(data.id, 1);
			assert.ok(data.result);
			assert.strictEqual(data.result.protocolVersion, "2025-03-26");
			assert.strictEqual(data.result.serverInfo.name, "osm-tagging-schema");
		});
	});

	describe("MCP Tool Calls", () => {
		let sessionId: string;

		before(async () => {
			// Initialize session first
			const initRequest = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2025-03-26",
					capabilities: {},
					clientInfo: {
						name: "test-client",
						version: "1.0.0",
					},
				},
			};

			const initResponse = await fetch(`${baseUrl}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(initRequest),
			});

			sessionId = initResponse.headers.get("mcp-session-id") || "";
			assert.ok(sessionId);

			// Send initialized notification
			const initializedNotification = {
				jsonrpc: "2.0",
				method: "notifications/initialized",
			};

			await fetch(`${baseUrl}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Mcp-Session-Id": sessionId,
				},
				body: JSON.stringify(initializedNotification),
			});
		});

		it("should list available tools", async () => {
			const listToolsRequest = {
				jsonrpc: "2.0",
				id: 2,
				method: "tools/list",
			};

			const response = await fetch(`${baseUrl}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Mcp-Session-Id": sessionId,
				},
				body: JSON.stringify(listToolsRequest),
			});

			assert.strictEqual(response.status, 200);
			const data = await response.json();
			assert.strictEqual(data.jsonrpc, "2.0");
			assert.strictEqual(data.id, 2);
			assert.ok(data.result);
			assert.ok(Array.isArray(data.result.tools));
			assert.ok(data.result.tools.length > 0);

			// Check for expected tools
			const toolNames = data.result.tools.map((t: { name: string }) => t.name);
			assert.ok(toolNames.includes("get_schema_stats"));
			assert.ok(toolNames.includes("get_tag_info"));
			assert.ok(toolNames.includes("search_tags"));
		});

		it("should call get_schema_stats tool", async () => {
			const toolCallRequest = {
				jsonrpc: "2.0",
				id: 3,
				method: "tools/call",
				params: {
					name: "get_schema_stats",
					arguments: {},
				},
			};

			const response = await fetch(`${baseUrl}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Mcp-Session-Id": sessionId,
				},
				body: JSON.stringify(toolCallRequest),
			});

			assert.strictEqual(response.status, 200);
			const data = await response.json();
			assert.strictEqual(data.jsonrpc, "2.0");
			assert.strictEqual(data.id, 3);
			assert.ok(data.result);
			assert.ok(Array.isArray(data.result.content));
			assert.ok(data.result.content.length > 0);

			const content = JSON.parse(data.result.content[0].text);
			assert.ok(content.presets);
			assert.ok(content.fields);
			assert.ok(content.categories);
		});

		it("should handle invalid session ID", async () => {
			const toolCallRequest = {
				jsonrpc: "2.0",
				id: 4,
				method: "tools/call",
				params: {
					name: "get_schema_stats",
					arguments: {},
				},
			};

			const response = await fetch(`${baseUrl}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Mcp-Session-Id": "invalid-session-id",
				},
				body: JSON.stringify(toolCallRequest),
			});

			assert.strictEqual(response.status, 404);
		});

		it("should handle missing session ID for non-init request", async () => {
			const toolCallRequest = {
				jsonrpc: "2.0",
				id: 5,
				method: "tools/call",
				params: {
					name: "get_schema_stats",
					arguments: {},
				},
			};

			const response = await fetch(`${baseUrl}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(toolCallRequest),
			});

			assert.strictEqual(response.status, 400);
		});
	});

	describe("Session Management", () => {
		it("should maintain separate sessions for multiple clients", async () => {
			// Initialize first session
			const initRequest1 = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2025-03-26",
					capabilities: {},
					clientInfo: {
						name: "test-client-1",
						version: "1.0.0",
					},
				},
			};

			const response1 = await fetch(`${baseUrl}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(initRequest1),
			});

			const sessionId1 = response1.headers.get("mcp-session-id");
			assert.ok(sessionId1);

			// Initialize second session
			const initRequest2 = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2025-03-26",
					capabilities: {},
					clientInfo: {
						name: "test-client-2",
						version: "1.0.0",
					},
				},
			};

			const response2 = await fetch(`${baseUrl}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(initRequest2),
			});

			const sessionId2 = response2.headers.get("mcp-session-id");
			assert.ok(sessionId2);

			// Sessions should be different
			assert.notStrictEqual(sessionId1, sessionId2);
		});

		it("should handle session termination via DELETE", async () => {
			// Initialize session
			const initRequest = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2025-03-26",
					capabilities: {},
					clientInfo: {
						name: "test-client",
						version: "1.0.0",
					},
				},
			};

			const initResponse = await fetch(`${baseUrl}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(initRequest),
			});

			const sessionId = initResponse.headers.get("mcp-session-id");
			assert.ok(sessionId);

			// Terminate session
			const deleteResponse = await fetch(`${baseUrl}/mcp`, {
				method: "DELETE",
				headers: {
					"Mcp-Session-Id": sessionId,
				},
			});

			assert.strictEqual(deleteResponse.status, 200);

			// Try to use terminated session
			const toolCallRequest = {
				jsonrpc: "2.0",
				id: 2,
				method: "tools/list",
			};

			const response = await fetch(`${baseUrl}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Mcp-Session-Id": sessionId,
				},
				body: JSON.stringify(toolCallRequest),
			});

			// Should fail with 404 after session termination
			assert.strictEqual(response.status, 404);
		});
	});

	describe("Error Handling", () => {
		it("should handle malformed JSON", async () => {
			const response = await fetch(`${baseUrl}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: "invalid json{",
			});

			assert.strictEqual(response.status, 400);
		});

		it("should handle unsupported HTTP methods", async () => {
			const response = await fetch(`${baseUrl}/mcp`, {
				method: "PUT",
			});

			assert.strictEqual(response.status, 405);
		});
	});
});
