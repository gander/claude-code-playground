import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import type { Server as HttpServer } from "node:http";
import { WebSocket } from "ws";
import { WebSocketTransport } from "../../src/transports/websocket.js";

describe("WebSocketTransport", () => {
	let transport: WebSocketTransport;
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
		it("should create WebSocket server with default config", async () => {
			transport = new WebSocketTransport({
				type: "websocket",
				port: 0, // Random port
			});

			httpServer = await transport.start();

			assert.ok(httpServer);
			assert.ok(httpServer.listening);
		});

		it("should create WebSocket server on specified port", async () => {
			const port = 13581; // Non-standard port for testing
			transport = new WebSocketTransport({
				type: "websocket",
				port,
				host: "127.0.0.1",
			});

			httpServer = await transport.start();
			const address = httpServer.address();

			assert.ok(address && typeof address === "object");
			assert.strictEqual(address.port, port);
		});

		it("should enable CORS by default", async () => {
			transport = new WebSocketTransport({
				type: "websocket",
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
			transport = new WebSocketTransport({
				type: "websocket",
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

		it("should return 404 for unknown endpoints", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const response = await fetch(`http://127.0.0.1:${port}/unknown`);

			assert.strictEqual(response.status, 404);
		});
	});

	describe("WebSocket Connection", () => {
		beforeEach(async () => {
			transport = new WebSocketTransport({
				type: "websocket",
				port: 0,
			});
			httpServer = await transport.start();
		});

		it("should accept WebSocket connections", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const ws = new WebSocket(`ws://127.0.0.1:${port}`);

			await new Promise<void>((resolve, reject) => {
				ws.on("open", () => {
					ws.close();
					resolve();
				});
				ws.on("error", reject);
			});
		});

		it("should send welcome message on connection", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const ws = new WebSocket(`ws://127.0.0.1:${port}`);

			await new Promise<void>((resolve, reject) => {
				ws.on("message", (data: Buffer) => {
					const message = JSON.parse(data.toString());
					assert.strictEqual(message.type, "connected");
					assert.ok(message.message);
					ws.close();
					resolve();
				});
				ws.on("error", reject);
			});
		});
	});

	describe("MCP Protocol over WebSocket", () => {
		beforeEach(async () => {
			transport = new WebSocketTransport({
				type: "websocket",
				port: 0,
			});
			httpServer = await transport.start();
		});

		it("should handle tools/list request", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const ws = new WebSocket(`ws://127.0.0.1:${port}`);

			await new Promise<void>((resolve, reject) => {
				let messageCount = 0;

				ws.on("open", () => {
					ws.send(
						JSON.stringify({
							jsonrpc: "2.0",
							id: 1,
							method: "tools/list",
							params: {},
						}),
					);
				});

				ws.on("message", (data: Buffer) => {
					messageCount++;

					// Skip welcome message
					if (messageCount === 1) return;

					const response = JSON.parse(data.toString());
					assert.strictEqual(response.jsonrpc, "2.0");
					assert.ok(response.result);
					assert.ok(response.result.tools);
					assert.ok(Array.isArray(response.result.tools));
					assert.ok(response.result.tools.length > 0);
					ws.close();
					resolve();
				});

				ws.on("error", reject);
			});
		});

		it("should handle tools/call request", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const ws = new WebSocket(`ws://127.0.0.1:${port}`);

			await new Promise<void>((resolve, reject) => {
				let messageCount = 0;

				ws.on("open", () => {
					ws.send(
						JSON.stringify({
							jsonrpc: "2.0",
							id: 2,
							method: "tools/call",
							params: {
								name: "get_schema_stats",
								arguments: {},
							},
						}),
					);
				});

				ws.on("message", (data: Buffer) => {
					messageCount++;

					// Skip welcome message
					if (messageCount === 1) return;

					const response = JSON.parse(data.toString());
					assert.strictEqual(response.jsonrpc, "2.0");
					assert.ok(response.result);
					assert.ok(response.result.content);
					ws.close();
					resolve();
				});

				ws.on("error", reject);
			});
		});

		it("should return error for invalid JSON-RPC request", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const ws = new WebSocket(`ws://127.0.0.1:${port}`);

			await new Promise<void>((resolve, reject) => {
				let messageCount = 0;

				ws.on("open", () => {
					ws.send(
						JSON.stringify({
							// Missing jsonrpc field
							id: 3,
							method: "tools/list",
						}),
					);
				});

				ws.on("message", (data: Buffer) => {
					messageCount++;

					// Skip welcome message
					if (messageCount === 1) return;

					const response = JSON.parse(data.toString());
					assert.ok(response.error);
					assert.strictEqual(response.error.code, -32600);
					ws.close();
					resolve();
				});

				ws.on("error", reject);
			});
		});

		it("should handle unknown tool call", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const ws = new WebSocket(`ws://127.0.0.1:${port}`);

			await new Promise<void>((resolve, reject) => {
				let messageCount = 0;

				ws.on("open", () => {
					ws.send(
						JSON.stringify({
							jsonrpc: "2.0",
							id: 4,
							method: "tools/call",
							params: {
								name: "unknown_tool",
								arguments: {},
							},
						}),
					);
				});

				ws.on("message", (data: Buffer) => {
					messageCount++;

					// Skip welcome message
					if (messageCount === 1) return;

					const response = JSON.parse(data.toString());
					assert.ok(response.error);
					ws.close();
					resolve();
				});

				ws.on("error", reject);
			});
		});

		it("should handle malformed JSON", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const ws = new WebSocket(`ws://127.0.0.1:${port}`);

			await new Promise<void>((resolve, reject) => {
				let messageCount = 0;

				ws.on("open", () => {
					ws.send("invalid json");
				});

				ws.on("message", (data: Buffer) => {
					messageCount++;

					// Skip welcome message
					if (messageCount === 1) return;

					const response = JSON.parse(data.toString());
					assert.ok(response.error);
					ws.close();
					resolve();
				});

				ws.on("error", reject);
			});
		});
	});

	describe("CORS Configuration", () => {
		it("should disable CORS when configured", async () => {
			transport = new WebSocketTransport({
				type: "websocket",
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
			transport = new WebSocketTransport({
				type: "websocket",
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

	describe("Bidirectional Communication", () => {
		beforeEach(async () => {
			transport = new WebSocketTransport({
				type: "websocket",
				port: 0,
			});
			httpServer = await transport.start();
		});

		it("should handle multiple sequential messages", async () => {
			const address = httpServer?.address();
			const port = address && typeof address === "object" ? address.port : 0;

			const ws = new WebSocket(`ws://127.0.0.1:${port}`);

			await new Promise<void>((resolve, reject) => {
				let messageCount = 0;
				let responseCount = 0;

				ws.on("open", () => {
					// Send first request
					ws.send(
						JSON.stringify({
							jsonrpc: "2.0",
							id: 1,
							method: "tools/list",
							params: {},
						}),
					);
				});

				ws.on("message", (data: Buffer) => {
					messageCount++;

					// Skip welcome message
					if (messageCount === 1) return;

					const response = JSON.parse(data.toString());

					if (response.id === 1) {
						assert.ok(response.result);
						responseCount++;

						// Send second request
						ws.send(
							JSON.stringify({
								jsonrpc: "2.0",
								id: 2,
								method: "tools/call",
								params: {
									name: "get_schema_stats",
									arguments: {},
								},
							}),
						);
					} else if (response.id === 2) {
						assert.ok(response.result);
						responseCount++;
						ws.close();
						assert.strictEqual(responseCount, 2);
						resolve();
					}
				});

				ws.on("error", reject);
			});
		});
	});
});
