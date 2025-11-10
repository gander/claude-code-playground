import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import type { Server as HttpServer } from "node:http";
import { SseTransport } from "../../src/transports/sse.js";

describe("SseTransport", () => {
	let transport: SseTransport;
	let httpServer: HttpServer | null = null;

	afterEach(async () => {
		if (transport) {
			await transport.close();
		}
		if (httpServer) {
			await new Promise((resolve) => httpServer?.close(resolve));
		}
	});

	describe("Server Initialization", () => {
		it("should create SSE server with default config", async () => {
			transport = new SseTransport({
				type: "sse",
				port: 0, // Random port
			});

			httpServer = await transport.start();

			assert.ok(httpServer);
			assert.ok(httpServer.listening);
		});

		it("should create SSE server on specified port", async () => {
			const port = 13580; // Non-standard port for testing
			transport = new SseTransport({
				type: "sse",
				port,
				host: "127.0.0.1",
			});

			httpServer = await transport.start();
			const address = httpServer.address();

			assert.ok(address && typeof address === "object");
			assert.strictEqual(address.port, port);
		});

		it("should enable CORS by default", async () => {
			transport = new SseTransport({
				type: "sse",
				port: 0,
			});

			httpServer = await transport.start();
			const address = httpServer.address();
			const port = address && typeof address === "object" ? address.port : 0;

			// Test CORS headers
			const response = await fetch(`http://127.0.0.1:${port}/health`, {
				method: "OPTIONS",
			});

			assert.ok(response.headers.get("access-control-allow-origin"));
		});
	});

	describe("Endpoints", () => {
		beforeEach(async () => {
			transport = new SseTransport({
				type: "sse",
				port: 0,
			});
			httpServer = await transport.start();
		});

		it("should have /health endpoint", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/health`);

			assert.strictEqual(response.status, 200);
			const data = await response.json();
			assert.strictEqual(data.status, "ok");
		});

		it("should have /events endpoint for SSE connections", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/events`);

			assert.strictEqual(response.status, 200);
			assert.strictEqual(response.headers.get("content-type"), "text/event-stream");
			assert.strictEqual(response.headers.get("cache-control"), "no-cache");
			assert.strictEqual(response.headers.get("connection"), "keep-alive");
		});

		it("should have /message endpoint for MCP requests", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jsonrpc: "2.0",
					id: 1,
					method: "tools/list",
					params: {},
				}),
			});

			assert.strictEqual(response.status, 200);
			const data = await response.json();
			assert.strictEqual(data.jsonrpc, "2.0");
			assert.ok(data.result);
		});

		it("should return 404 for unknown endpoints", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/unknown`);

			assert.strictEqual(response.status, 404);
		});

		it("should return 405 for invalid methods on /message", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/message`, {
				method: "GET",
			});

			assert.strictEqual(response.status, 405);
		});
	});

	describe("MCP Protocol", () => {
		beforeEach(async () => {
			transport = new SseTransport({
				type: "sse",
				port: 0,
			});
			httpServer = await transport.start();
		});

		it("should handle tools/list request", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jsonrpc: "2.0",
					id: 1,
					method: "tools/list",
					params: {},
				}),
			});

			const data = await response.json();
			assert.strictEqual(data.jsonrpc, "2.0");
			assert.ok(data.result.tools);
			assert.ok(Array.isArray(data.result.tools));
			assert.ok(data.result.tools.length > 0);
		});

		it("should handle tools/call request", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jsonrpc: "2.0",
					id: 2,
					method: "tools/call",
					params: {
						name: "get_schema_stats",
						arguments: {},
					},
				}),
			});

			const data = await response.json();
			assert.strictEqual(data.jsonrpc, "2.0");
			assert.ok(data.result);
			assert.ok(data.result.content);
		});

		it("should return error for invalid JSON-RPC request", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					// Missing jsonrpc field
					id: 3,
					method: "tools/list",
				}),
			});

			const data = await response.json();
			assert.ok(data.error);
		});
	});

	describe("Error Handling", () => {
		beforeEach(async () => {
			transport = new SseTransport({
				type: "sse",
				port: 0,
			});
			httpServer = await transport.start();
		});

		it("should handle malformed JSON", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: "invalid json",
			});

			assert.strictEqual(response.status, 400);
		});

		it("should handle unknown tool call", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jsonrpc: "2.0",
					id: 4,
					method: "tools/call",
					params: {
						name: "unknown_tool",
						arguments: {},
					},
				}),
			});

			const data = await response.json();
			assert.strictEqual(data.jsonrpc, "2.0");
			assert.ok(data.error);
		});
	});

	describe("CORS Configuration", () => {
		it("should disable CORS when configured", async () => {
			transport = new SseTransport({
				type: "sse",
				port: 0,
				cors: {
					enabled: false,
				},
			});

			httpServer = await transport.start();
			const address = httpServer.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/health`, {
				method: "OPTIONS",
			});

			// CORS headers should not be present
			assert.strictEqual(response.headers.get("access-control-allow-origin"), null);
		});

		it("should use custom CORS origin when configured", async () => {
			const customOrigin = "https://example.com";
			transport = new SseTransport({
				type: "sse",
				port: 0,
				cors: {
					enabled: true,
					origin: customOrigin,
				},
			});

			httpServer = await transport.start();
			const address = httpServer.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/health`, {
				method: "OPTIONS",
				headers: {
					Origin: customOrigin,
				},
			});

			const corsHeader = response.headers.get("access-control-allow-origin");
			assert.ok(corsHeader);
		});
	});

	describe("SSE Streaming", () => {
		beforeEach(async () => {
			transport = new SseTransport({
				type: "sse",
				port: 0,
			});
			httpServer = await transport.start();
		});

		it("should send connected event on SSE connection", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/events`);
			const reader = response.body?.getReader();
			assert.ok(reader);

			const { value } = await reader.read();
			const text = new TextDecoder().decode(value);

			assert.ok(text.includes("data:"));
			assert.ok(text.includes("connected"));

			// Cleanup
			reader.cancel();
		});
	});
});
