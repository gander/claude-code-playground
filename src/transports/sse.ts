/**
 * Server-Sent Events (SSE) transport for MCP server
 * Implements one-way server-to-client streaming
 */

import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import type { Server as HttpServer } from "node:http";
import type { SseTransportConfig } from "./types.js";
import { logger } from "../utils/logger.js";
import { McpRequestHandler } from "./request-handler.js";

export class SseTransport {
	private app: Express;
	private server: HttpServer | null = null;
	private config: Required<SseTransportConfig>;
	private requestHandler: McpRequestHandler;
	private clients: Set<Response> = new Set();

	constructor(config: SseTransportConfig) {
		this.config = {
			type: "sse",
			port: config.port ?? 3000,
			host: config.host ?? "0.0.0.0",
			cors: {
				enabled: config.cors?.enabled ?? true,
				origin: config.cors?.origin ?? "*",
			},
		};

		this.app = express();
		this.requestHandler = new McpRequestHandler();
		this.setupMiddleware();
		this.setupRoutes();
	}

	private setupMiddleware(): void {
		this.app.use(express.json());

		if (this.config.cors.enabled) {
			this.app.use(
				cors({
					origin: this.config.cors.origin,
					methods: ["GET", "POST", "OPTIONS"],
					allowedHeaders: ["Content-Type", "Cache-Control"],
				}),
			);
		}
	}

	private setupRoutes(): void {
		// Health check
		this.app.get("/health", (_req: Request, res: Response) => {
			res.json({ status: "ok" });
		});

		// SSE endpoint - clients connect here for event stream
		this.app.get("/events", (req: Request, res: Response) => {
			// Set SSE headers
			res.setHeader("Content-Type", "text/event-stream");
			res.setHeader("Cache-Control", "no-cache");
			res.setHeader("Connection", "keep-alive");

			// Add client to set
			this.clients.add(res);

			logger.debug("SSE client connected", "SseTransport");

			// Send initial connection message
			res.write("data: {\"type\":\"connected\"}\n\n");

			// Remove client on disconnect
			req.on("close", () => {
				this.clients.delete(res);
				logger.debug("SSE client disconnected", "SseTransport");
			});
		});

		// Message endpoint - clients send requests here
		this.app.post("/message", async (req: Request, res: Response) => {
			try {
				const request = req.body;

				if (!request.jsonrpc || request.jsonrpc !== "2.0") {
					return res.status(400).json({
						jsonrpc: "2.0",
						id: request.id || null,
						error: {
							code: -32600,
							message: "Invalid Request: jsonrpc must be '2.0'",
						},
					});
				}

				logger.debug(`SSE request: ${request.method}`, "SseTransport");

				const response = await this.requestHandler.handle(request);

			// Also broadcast to all SSE clients
			this.broadcast(JSON.stringify({ type: "response", data: response }));

			// Send response via HTTP for immediate response
			return res.json(response);
			} catch (error) {
				logger.error(
					"Error handling SSE request",
					"SseTransport",
					error instanceof Error ? error : new Error(String(error)),
				);

				return res.status(200).json({
					jsonrpc: "2.0",
					id: req.body?.id || null,
					error: {
						code: -32603,
						message: error instanceof Error ? error.message : "Internal error",
					},
				});
			}
		});

		// Method not allowed for GET on /message
		this.app.get("/message", (_req: Request, res: Response) => {
			res.status(405).json({
				error: "Method Not Allowed",
				message: "Use POST for /message endpoint",
			});
		});

		// 404 handler
		this.app.use((_req: Request, res: Response) => {
			res.status(404).json({ error: "Not Found" });
		});

		// Error handler
		this.app.use((err: Error, _req: Request, res: Response, _next: unknown) => {
			logger.error("Express error", "SseTransport", err);
			res.status(400).json({ error: "Bad Request", message: err.message });
		});
	}

	private broadcast(data: string): void {
		for (const client of this.clients) {
			client.write(`data: ${data}\n\n`);
		}
	}

	public async start(): Promise<HttpServer> {
		return new Promise((resolve, reject) => {
			try {
				this.server = this.app.listen(this.config.port, this.config.host, () => {
					logger.info(
						`SSE transport listening on ${this.config.host}:${this.config.port}`,
						"SseTransport",
					);
					if (this.server) {
						resolve(this.server);
					}
				});

				this.server.on("error", (error) => {
					logger.error("SSE server error", "SseTransport", error);
					reject(error);
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	public async close(): Promise<void> {
		// Close all SSE connections
		for (const client of this.clients) {
			client.end();
		}
		this.clients.clear();

		if (this.server) {
			return new Promise((resolve) => {
				this.server?.close(() => {
					logger.info("SSE transport closed", "SseTransport");
					this.server = null;
					resolve();
				});
			});
		}
	}
}
