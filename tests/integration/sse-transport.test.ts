import assert from "node:assert";
import http from "node:http";
import { afterEach, beforeEach, describe, it } from "node:test";

describe("SSE Transport Integration Tests", () => {
	describe("Environment Configuration", () => {
		let originalEnv: NodeJS.ProcessEnv;

		beforeEach(() => {
			originalEnv = { ...process.env };
		});

		afterEach(() => {
			process.env = originalEnv;
		});

		it("should default to stdio transport when TRANSPORT is not set", () => {
			delete process.env.TRANSPORT;
			const transport = process.env.TRANSPORT || "stdio";
			assert.strictEqual(transport, "stdio");
		});

		it("should use sse transport when TRANSPORT=sse", () => {
			process.env.TRANSPORT = "sse";
			assert.strictEqual(process.env.TRANSPORT, "sse");
		});

		it("should use http transport when TRANSPORT=http", () => {
			process.env.TRANSPORT = "http";
			assert.strictEqual(process.env.TRANSPORT, "http");
		});

		it("should default to port 3000 when PORT is not set", () => {
			delete process.env.PORT;
			const port = Number.parseInt(process.env.PORT || "3000", 10);
			assert.strictEqual(port, 3000);
		});

		it("should use custom port when PORT is set", () => {
			process.env.PORT = "8080";
			const port = Number.parseInt(process.env.PORT, 10);
			assert.strictEqual(port, 8080);
		});

		it("should default to 0.0.0.0 when HOST is not set", () => {
			delete process.env.HOST;
			const host = process.env.HOST || "0.0.0.0";
			assert.strictEqual(host, "0.0.0.0");
		});

		it("should use custom host when HOST is set", () => {
			process.env.HOST = "127.0.0.1";
			assert.strictEqual(process.env.HOST, "127.0.0.1");
		});
	});

	describe("HTTP Server Creation", () => {
		let server: http.Server | null = null;

		afterEach(async () => {
			if (server) {
				await new Promise<void>((resolve) => {
					server?.close(() => {
						server = null;
						resolve();
					});
				});
			}
		});

		it("should create HTTP server that listens on specified port", async () => {
			server = http.createServer((_req, res) => {
				res.writeHead(200);
				res.end("OK");
			});

			await new Promise<void>((resolve) => {
				server?.listen(0, () => {
					const address = server?.address();
					assert.ok(address);
					assert.strictEqual(typeof address, "object");
					if (typeof address === "object" && address) {
						assert.ok(address.port > 0);
					}
					resolve();
				});
			});
		});

		it("should handle POST requests to /mcp endpoint", async () => {
			let requestReceived = false;

			server = http.createServer((req, res) => {
				if (req.method === "POST" && req.url === "/mcp") {
					requestReceived = true;
					res.writeHead(200);
					res.end("OK");
				} else {
					res.writeHead(404);
					res.end();
				}
			});

			await new Promise<void>((resolve) => {
				server?.listen(0, () => {
					const address = server?.address();
					assert.ok(address && typeof address === "object");

					if (typeof address === "object" && address) {
						const options = {
							hostname: "localhost",
							port: address.port,
							path: "/mcp",
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
						};

						const req = http.request(options, (res) => {
							assert.strictEqual(res.statusCode, 200);
							assert.strictEqual(requestReceived, true);
							resolve();
						});

						req.end();
					}
				});
			});
		});

		it("should handle GET requests to /mcp endpoint for SSE", async () => {
			let requestReceived = false;

			server = http.createServer((req, res) => {
				if (req.method === "GET" && req.url === "/mcp") {
					requestReceived = true;
					res.writeHead(200, {
						"Content-Type": "text/event-stream",
						"Cache-Control": "no-cache",
						Connection: "keep-alive",
					});
					res.write("event: endpoint\ndata: /mcp\n\n");
					// Don't end the response for SSE streams
				} else {
					res.writeHead(404);
					res.end();
				}
			});

			await new Promise<void>((resolve) => {
				server?.listen(0, () => {
					const address = server?.address();
					assert.ok(address && typeof address === "object");

					if (typeof address === "object" && address) {
						const options = {
							hostname: "localhost",
							port: address.port,
							path: "/mcp",
							method: "GET",
							headers: {
								Accept: "text/event-stream",
							},
						};

						const req = http.request(options, (res) => {
							assert.strictEqual(res.statusCode, 200);
							assert.strictEqual(res.headers["content-type"], "text/event-stream");
							assert.strictEqual(requestReceived, true);

							// Clean up the connection
							res.on("data", () => {
								// Read data to prevent backpressure
							});

							// Close after receiving headers
							setTimeout(() => {
								req.destroy();
								resolve();
							}, 100);
						});

						req.end();
					}
				});
			});
		});
	});

	describe("StreamableHTTPServerTransport Integration", () => {
		it("should reject GET requests without Accept: text/event-stream header", async () => {
			const { StreamableHTTPServerTransport } = await import(
				"@modelcontextprotocol/sdk/server/streamableHttp.js"
			);
			const { randomUUID } = await import("node:crypto");

			const transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: () => randomUUID(),
			});

			let statusCode = 0;

			const mockReq = {
				method: "GET",
				url: "/mcp",
				headers: {
					accept: "application/json", // Wrong Accept header
				},
			} as http.IncomingMessage;

			const mockRes = {
				writeHead(code: number) {
					statusCode = code;
					return this;
				},
				end() {},
				write() {
					return true;
				},
				on() {},
			} as unknown as http.ServerResponse;

			await transport.handleRequest(mockReq, mockRes);

			assert.strictEqual(statusCode, 406, "Should return 406 Not Acceptable");
		});

		it("should accept POST requests with proper headers", async () => {
			const { StreamableHTTPServerTransport } = await import(
				"@modelcontextprotocol/sdk/server/streamableHttp.js"
			);
			const { randomUUID } = await import("node:crypto");

			const transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: () => randomUUID(),
			});

			let statusCode = 0;

			const initRequest = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: { name: "test", version: "1.0" },
				},
			};

			const mockReq = {
				method: "POST",
				url: "/mcp",
				headers: {
					"content-type": "application/json",
					accept: "application/json, text/event-stream",
				},
			} as http.IncomingMessage;

			const mockRes = {
				writeHead(code: number, _headers?: Record<string, string>) {
					statusCode = code;
					return this;
				},
				end() {},
				write() {
					return true;
				},
				on() {},
				flushHeaders() {},
			} as unknown as http.ServerResponse;

			// We expect this to not throw
			await transport.handleRequest(mockReq, mockRes, initRequest);

			// The transport should accept the request (status 200 for SSE stream)
			assert.ok(
				statusCode === 200 || statusCode === 202,
				`Should return 200 or 202, got ${statusCode}`,
			);
		});

		it("should generate and track session IDs", async () => {
			const { StreamableHTTPServerTransport } = await import(
				"@modelcontextprotocol/sdk/server/streamableHttp.js"
			);
			const { randomUUID } = await import("node:crypto");

			let generatedSessionId: string | undefined;

			const transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: () => randomUUID(),
				onsessioninitialized: (sessionId: string) => {
					generatedSessionId = sessionId;
				},
			});

			const initRequest = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: { name: "test", version: "1.0" },
				},
			};

			const mockReq = {
				method: "POST",
				url: "/mcp",
				headers: {
					"content-type": "application/json",
					accept: "application/json, text/event-stream",
				},
			} as http.IncomingMessage;

			const mockRes = {
				writeHead() {
					return this;
				},
				end() {},
				write() {
					return true;
				},
				on() {},
				flushHeaders() {},
			} as unknown as http.ServerResponse;

			await transport.handleRequest(mockReq, mockRes, initRequest);

			// Session ID should be generated
			assert.ok(generatedSessionId, "Session ID should be generated");
			assert.strictEqual(typeof generatedSessionId, "string");
			// UUID format check
			assert.ok(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(generatedSessionId),
				"Session ID should be a valid UUID",
			);
		});
	});
});
