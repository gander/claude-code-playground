/**
 * WebSocket transport for MCP server
 * Implements bidirectional real-time communication
 */

import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "node:http";
import type { WebSocketTransportConfig } from "./types.js";
import { logger } from "../utils/logger.js";
import { McpRequestHandler } from "./request-handler.js";

export class WebSocketTransport {
	private app: Express;
	private server: HttpServer | null = null;
	private wss: WebSocketServer | null = null;
	private config: Required<WebSocketTransportConfig>;
	private requestHandler: McpRequestHandler;

	constructor(config: WebSocketTransportConfig) {
		this.config = {
			type: "websocket",
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
					allowedHeaders: ["Content-Type"],
				}),
			);
		}
	}

	private setupRoutes(): void {
		// Health check
		this.app.get("/health", (_req: Request, res: Response) => {
			res.json({ status: "ok" });
		});

		// 404 handler
		this.app.use((_req: Request, res: Response) => {
			res.status(404).json({ error: "Not Found" });
		});
	}

	private setupWebSocket(): void {
		if (!this.server) {
			return;
		}

		this.wss = new WebSocketServer({ server: this.server });

		this.wss.on("connection", (ws: WebSocket) => {
			logger.debug("WebSocket client connected", "WebSocketTransport");

			// Send welcome message
			ws.send(JSON.stringify({ type: "connected", message: "WebSocket connected" }));

			ws.on("message", async (data: Buffer) => {
				try {
					const message = JSON.parse(data.toString());

					// Validate JSON-RPC
					if (!message.jsonrpc || message.jsonrpc !== "2.0") {
						ws.send(
							JSON.stringify({
								jsonrpc: "2.0",
								id: message.id || null,
								error: {
									code: -32600,
									message: "Invalid Request: jsonrpc must be '2.0'",
								},
							}),
						);
						return;
					}

					logger.debug(`WebSocket request: ${message.method}`, "WebSocketTransport");

					const response = await this.requestHandler.handle(message);
					ws.send(JSON.stringify(response));
				} catch (error) {
					logger.error(
						"Error handling WebSocket message",
						"WebSocketTransport",
						error instanceof Error ? error : new Error(String(error)),
					);

					ws.send(
						JSON.stringify({
							jsonrpc: "2.0",
							id: null,
							error: {
								code: -32603,
								message: error instanceof Error ? error.message : "Internal error",
							},
						}),
					);
				}
			});

			ws.on("close", () => {
				logger.debug("WebSocket client disconnected", "WebSocketTransport");
			});

			ws.on("error", (error) => {
				logger.error("WebSocket error", "WebSocketTransport", error);
			});
		});

		logger.info("WebSocket server initialized", "WebSocketTransport");
	}

	public async start(): Promise<HttpServer> {
		return new Promise((resolve, reject) => {
			try {
				this.server = this.app.listen(this.config.port, this.config.host, () => {
					logger.info(
						`WebSocket transport listening on ${this.config.host}:${this.config.port}`,
						"WebSocketTransport",
					);

					// Setup WebSocket after HTTP server is ready
					this.setupWebSocket();

					if (this.server) {
						resolve(this.server);
					}
				});

				this.server.on("error", (error) => {
					logger.error("WebSocket server error", "WebSocketTransport", error);
					reject(error);
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	public async close(): Promise<void> {
		// Close WebSocket server
		if (this.wss) {
			this.wss.close(() => {
				logger.info("WebSocket server closed", "WebSocketTransport");
			});
		}

		// Close HTTP server
		if (this.server) {
			return new Promise((resolve) => {
				this.server?.close(() => {
					logger.info("WebSocket transport closed", "WebSocketTransport");
					this.server = null;
					resolve();
				});
			});
		}
	}
}
