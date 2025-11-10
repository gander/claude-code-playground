/**
 * HTTP Transport for MCP Server
 * Provides Streamable HTTP with SSE support using Express
 */

import express, { type Request, type Response } from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import type { Server as NodeServer } from "node:http";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../utils/logger.js";
import type { HTTPConfig } from "../utils/transport-config.js";

/**
 * Map to store active transports by session ID
 */
const transports = new Map<string, StreamableHTTPServerTransport>();

/**
 * Health check response interface
 */
interface HealthCheckResponse {
	status: "ok";
	timestamp: string;
	version: string;
}

/**
 * Start HTTP server with MCP support
 * @param mcpServer The MCP server instance
 * @param config HTTP configuration
 * @returns Promise<NodeServer> The HTTP server instance
 */
export async function startHttpServer(
	mcpServer: Server,
	config: HTTPConfig,
): Promise<NodeServer> {
	const app = express();

	// Middleware
	app.use(express.json());

	// CORS configuration
	if (config.corsEnabled) {
		app.use(
			cors({
				origin: config.corsOrigin,
				exposedHeaders: ["Mcp-Session-Id"],
			}),
		);
	}

	// Health check endpoint
	app.get("/health", (_req: Request, res: Response) => {
		const health: HealthCheckResponse = {
			status: "ok",
			timestamp: new Date().toISOString(),
			version: "0.1.0",
		};
		res.json(health);
	});

	// MCP POST endpoint - handle JSON-RPC requests
	app.post("/mcp", async (req: Request, res: Response) => {
		const sessionId = req.headers["mcp-session-id"] as string | undefined;

		logger.debug(
			sessionId ? `Request for session: ${sessionId}` : "New request without session ID",
			"HTTPTransport",
		);

		try {
			let transport: StreamableHTTPServerTransport;

			if (sessionId && transports.has(sessionId)) {
				// Reuse existing transport
				transport = transports.get(sessionId)!;
			} else if (!sessionId && isInitializeRequest(req.body)) {
				// New initialization request
				const sessionIdGenerator =
					config.sessionMode === "stateful" ? () => randomUUID() : undefined;

				transport = new StreamableHTTPServerTransport({
					sessionIdGenerator,
					enableJsonResponse: true, // Use JSON responses instead of SSE
					onsessioninitialized: (sid: string) => {
						logger.debug(`Session initialized: ${sid}`, "HTTPTransport");
						transports.set(sid, transport);
					},
					onsessionclosed: (sid: string) => {
						logger.debug(`Session closed: ${sid}`, "HTTPTransport");
						transports.delete(sid);
					},
				});

				// Set up onclose handler
				transport.onclose = () => {
					const sid = transport.sessionId;
					if (sid && transports.has(sid)) {
						logger.debug(`Transport closed for session ${sid}`, "HTTPTransport");
						transports.delete(sid);
					}
				};

				// Connect transport to MCP server
				await mcpServer.connect(transport);
				await transport.handleRequest(req, res, req.body);
				return;
			} else {
				// Invalid request
				res.status(400).json({
					jsonrpc: "2.0",
					error: {
						code: -32000,
						message: "Bad Request: No valid session ID provided",
					},
					id: null,
				});
				return;
			}

			// Handle request with existing transport
			await transport.handleRequest(req, res, req.body);
		} catch (error) {
			logger.error(
				"Error handling MCP request",
				"HTTPTransport",
				error instanceof Error ? error : new Error(String(error)),
			);

			if (!res.headersSent) {
				res.status(500).json({
					jsonrpc: "2.0",
					error: {
						code: -32603,
						message: "Internal server error",
					},
					id: null,
				});
			}
		}
	});

	// MCP GET endpoint - SSE streams
	app.get("/mcp", async (req: Request, res: Response) => {
		const sessionId = req.headers["mcp-session-id"] as string | undefined;

		if (!sessionId || !transports.has(sessionId)) {
			res.status(400).send("Invalid or missing session ID");
			return;
		}

		const lastEventId = req.headers["last-event-id"] as string | undefined;
		if (lastEventId) {
			logger.debug(
				`Client reconnecting with Last-Event-ID: ${lastEventId}`,
				"HTTPTransport",
			);
		} else {
			logger.debug(`Establishing SSE stream for session ${sessionId}`, "HTTPTransport");
		}

		const transport = transports.get(sessionId)!;
		await transport.handleRequest(req, res);
	});

	// MCP DELETE endpoint - session termination
	app.delete("/mcp", async (req: Request, res: Response) => {
		const sessionId = req.headers["mcp-session-id"] as string | undefined;

		if (!sessionId || !transports.has(sessionId)) {
			res.status(400).send("Invalid or missing session ID");
			return;
		}

		logger.debug(`Session termination request for ${sessionId}`, "HTTPTransport");

		try {
			const transport = transports.get(sessionId)!;
			await transport.handleRequest(req, res);
		} catch (error) {
			logger.error(
				"Error handling session termination",
				"HTTPTransport",
				error instanceof Error ? error : new Error(String(error)),
			);

			if (!res.headersSent) {
				res.status(500).send("Error processing session termination");
			}
		}
	});

	// Handle unsupported HTTP methods
	app.all("/mcp", (_req: Request, res: Response) => {
		res.status(405).json({
			error: "Method Not Allowed",
			message: "Only GET, POST, and DELETE methods are supported",
		});
	});

	// Return promise that resolves when server is listening
	return new Promise((resolve, reject) => {
		const server = app.listen(config.port, config.host, () => {
			logger.info(
				`HTTP server listening on ${config.host}:${config.port}`,
				"HTTPTransport",
			);
			logger.info(`Session mode: ${config.sessionMode}`, "HTTPTransport");
			logger.info(`CORS enabled: ${config.corsEnabled}`, "HTTPTransport");
			resolve(server);
		});

		server.on("error", (error) => {
			logger.error(
				"HTTP server error",
				"HTTPTransport",
				error instanceof Error ? error : new Error(String(error)),
			);
			reject(error);
		});
	});
}

/**
 * Clean up all active transports and sessions
 * Called during server shutdown
 */
export async function closeAllTransports(): Promise<void> {
	logger.info(`Closing ${transports.size} active transports`, "HTTPTransport");

	const closePromises: Promise<void>[] = [];
	for (const [sessionId, transport] of transports.entries()) {
		logger.debug(`Closing transport for session ${sessionId}`, "HTTPTransport");
		closePromises.push(transport.close());
	}

	await Promise.all(closePromises);
	transports.clear();

	logger.info("All transports closed", "HTTPTransport");
}
