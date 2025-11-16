#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import pkg from "../package.json" with { type: "json" };
import { tools } from "./tools/index.js";
import { logger } from "./utils/logger.js";
import { schemaLoader } from "./utils/schema-loader.js";

/**
 * Create and configure the MCP server
 */
export function createServer(): McpServer {
	const mcpServer = new McpServer(
		{
			name: "osm-tagging-schema",
			version: pkg.version,
		},
		{
			capabilities: {
				tools: {},
			},
		},
	);

	// Register all tools using McpServer.registerTool() in a loop
	for (const tool of tools) {
		mcpServer.registerTool(tool.name, tool.config(), tool.handler);
	}

	return mcpServer;
}

/**
 * Configuration for transport selection
 */
interface TransportConfig {
	type: "stdio" | "sse" | "http";
	port: number;
	host: string;
}

/**
 * Parse transport configuration from environment variables
 */
function getTransportConfig(): TransportConfig {
	const transportEnv = process.env.TRANSPORT?.toLowerCase() || "stdio";
	// Support both 'sse' and 'http' for StreamableHTTPServerTransport
	// 'sse' is kept for backward compatibility
	const type = (transportEnv === "sse" || transportEnv === "http" ? transportEnv : "stdio") as
		| "stdio"
		| "sse"
		| "http";
	const port = Number.parseInt(process.env.PORT || "3000", 10);
	const host = process.env.HOST || "0.0.0.0";

	return { type, port, host };
}

/**
 * Wraps a ServerResponse to add SSE keep-alive functionality
 * When the response becomes an SSE stream, automatically sends ping messages every 15 seconds
 * @param res - The HTTP server response to wrap
 * @param req - The HTTP incoming request
 * @param keepAliveIntervalMs - Keep-alive ping interval in milliseconds (default: 15000ms = 15s)
 * @internal - Exported for testing purposes
 */
export function wrapResponseWithKeepAlive(
	res: http.ServerResponse,
	req: http.IncomingMessage,
	keepAliveIntervalMs = 15000,
): http.ServerResponse {
	let keepAliveInterval: NodeJS.Timeout | undefined;

	// Store original methods
	const originalWriteHead = res.writeHead.bind(res);
	const originalEnd = res.end.bind(res);

	// Override writeHead to detect SSE streams
	res.writeHead = ((
		statusCode: number,
		statusMessage?: string | http.OutgoingHttpHeaders,
		headers?: http.OutgoingHttpHeaders,
	): http.ServerResponse => {
		// Handle overloaded writeHead signature
		let finalHeaders: http.OutgoingHttpHeaders = {};

		if (typeof statusMessage === "object") {
			finalHeaders = statusMessage;
		} else if (headers) {
			finalHeaders = headers;
		}

		// Check if this is an SSE stream
		const contentType = finalHeaders["Content-Type"] || finalHeaders["content-type"];
		if (contentType === "text/event-stream") {
			logger.debug("SSE stream detected, enabling keep-alive", "KeepAlive");

			// Start keep-alive ping interval
			keepAliveInterval = setInterval(() => {
				try {
					if (!res.writableEnded) {
						res.write(":ping\n\n");
						logger.debug("Keep-alive ping sent", "KeepAlive");
					} else {
						// Stream ended, clear interval
						if (keepAliveInterval) {
							clearInterval(keepAliveInterval);
							keepAliveInterval = undefined;
						}
					}
				} catch (error) {
					logger.error(
						"Error sending keep-alive ping",
						"KeepAlive",
						error instanceof Error ? error : new Error(String(error)),
					);
					if (keepAliveInterval) {
						clearInterval(keepAliveInterval);
						keepAliveInterval = undefined;
					}
				}
			}, keepAliveIntervalMs);

			logger.info(`Keep-alive interval started (${keepAliveIntervalMs}ms)`, "KeepAlive");
		}

		// Call original writeHead
		if (typeof statusMessage === "string") {
			return originalWriteHead(statusCode, statusMessage, finalHeaders);
		}
		return originalWriteHead(statusCode, finalHeaders);
	}) as typeof res.writeHead;

	// Override end to clean up interval
	res.end = ((...args: Parameters<typeof originalEnd>): http.ServerResponse => {
		if (keepAliveInterval) {
			clearInterval(keepAliveInterval);
			keepAliveInterval = undefined;
			logger.info("Keep-alive interval stopped (response ended)", "KeepAlive");
		}
		return originalEnd(...args);
	}) as typeof res.end;

	// Clean up on connection close
	req.on("close", () => {
		if (keepAliveInterval) {
			clearInterval(keepAliveInterval);
			keepAliveInterval = undefined;
			logger.info("Keep-alive interval stopped (connection closed)", "KeepAlive");
		}
	});

	return res;
}

/**
 * Create and start HTTP server with SSE transport
 */
async function startHttpServer(server: McpServer, config: TransportConfig): Promise<void> {
	return new Promise((resolve, reject) => {
		// Session management: track transports by session ID
		const transports = new Map<string, StreamableHTTPServerTransport>();

		const httpServer = http.createServer(async (req, res) => {
			try {
				// Health check endpoints
				if (req.url === "/health" && req.method === "GET") {
					// Liveness probe - is the server running?
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(
						JSON.stringify({
							status: "ok",
							service: "osm-tagging-schema-mcp",
							timestamp: new Date().toISOString(),
						}),
					);
					return;
				}

				if (req.url === "/ready" && req.method === "GET") {
					// Readiness probe - is the server ready to handle requests?
					try {
						// Check if schema is loaded by attempting a quick operation
						const schema = await schemaLoader.loadSchema();
						res.writeHead(200, { "Content-Type": "application/json" });
						res.end(
							JSON.stringify({
								status: "ready",
								service: "osm-tagging-schema-mcp",
								schema: {
									presets: Object.keys(schema.presets).length,
									fields: Object.keys(schema.fields).length,
									categories: Object.keys(schema.categories).length,
									version: schema.metadata?.version,
								},
								timestamp: new Date().toISOString(),
							}),
						);
					} catch (_error) {
						res.writeHead(503, { "Content-Type": "application/json" });
						res.end(
							JSON.stringify({
								status: "not_ready",
								error: "Schema not loaded",
								timestamp: new Date().toISOString(),
							}),
						);
					}
					return;
				}

				// Wrap response with keep-alive functionality for SSE streams
				const wrappedRes = wrapResponseWithKeepAlive(res, req);

				// Get session ID from header if present
				const sessionId =
					typeof req.headers["mcp-session-id"] === "string"
						? req.headers["mcp-session-id"]
						: undefined;

				let transport: StreamableHTTPServerTransport;

				// Check if this is an existing session
				if (sessionId && transports.has(sessionId)) {
					const existingTransport = transports.get(sessionId);
					if (!existingTransport) {
						throw new Error(`Transport not found for session: ${sessionId}`);
					}
					transport = existingTransport;
				} else {
					// Create new transport for new session (stateful mode)
					transport = new StreamableHTTPServerTransport({
						sessionIdGenerator: () => randomUUID(),
						onsessioninitialized: (newSessionId: string) => {
							logger.info(`Session initialized: ${newSessionId}`, "HttpServer");
							transports.set(newSessionId, transport);
						},
						onsessionclosed: (closedSessionId: string) => {
							logger.info(`Session closed: ${closedSessionId}`, "HttpServer");
							transports.delete(closedSessionId);
						},
					});

					// Connect the MCP server to this transport (only once per transport)
					await server.connect(transport);
				}

				// Handle the HTTP request with wrapped response
				await transport.handleRequest(req, wrappedRes);
			} catch (error) {
				logger.error(
					"Error handling HTTP request",
					"HttpServer",
					error instanceof Error ? error : new Error(String(error)),
				);
				if (!res.headersSent) {
					res.writeHead(500);
					res.end(JSON.stringify({ error: "Internal server error" }));
				}
			}
		});

		httpServer.on("error", (error) => {
			logger.error("HTTP server error", "HttpServer", error);
			reject(error);
		});

		httpServer.listen(config.port, config.host, () => {
			logger.info(
				`OSM Tagging Schema MCP Server running on http://${config.host}:${config.port}`,
				"main",
			);
			console.error(
				`OSM Tagging Schema MCP Server running on http://${config.host}:${config.port}`,
			);
			resolve();
		});
	});
}

/**
 * Main entry point
 */
async function main() {
	const config = getTransportConfig();

	logger.info("Starting OSM Tagging Schema MCP Server", "main");
	logger.info(`Transport: ${config.type}`, "main");

	// Create server and preload schema for optimal performance
	const server = createServer();

	// Warmup: Preload schema and build indexes before accepting requests
	// This eliminates initial latency on first tool call
	logger.info("Preloading schema and building indexes...", "main");
	await schemaLoader.warmup();
	logger.info("Schema preloaded successfully", "main");

	// Start appropriate transport
	if (config.type === "sse" || config.type === "http") {
		await startHttpServer(server, config);
	} else {
		const transport = new StdioServerTransport();
		await server.connect(transport);
		logger.info("OSM Tagging Schema MCP Server running on stdio", "main");
		console.error("OSM Tagging Schema MCP Server running on stdio");
	}
}

// Run if this is the main module
// Check if the file is being run directly (not imported as a module)
const isMainModule =
	process.argv[1] &&
	(import.meta.url === `file://${process.argv[1]}` ||
		import.meta.url.endsWith(process.argv[1]) ||
		process.argv[1].endsWith("index.js"));

if (isMainModule) {
	main().catch((error) => {
		logger.error(
			"Fatal server error",
			"main",
			error instanceof Error ? error : new Error(String(error)),
		);
		console.error("Server error:", error);
		process.exit(1);
	});
}
