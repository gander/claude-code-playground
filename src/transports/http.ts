/**
 * HTTP/REST transport for MCP server
 * Implements request/response pattern over HTTP
 */

import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import type { Server as HttpServer } from "node:http";
import type { HttpTransportConfig } from "./types.js";
import { logger } from "../utils/logger.js";
import { McpRequestHandler } from "./request-handler.js";

export class HttpTransport {
	private app: Express;
	private server: HttpServer | null = null;
	private config: Required<HttpTransportConfig>;
	private requestHandler: McpRequestHandler;

	constructor(config: HttpTransportConfig) {
		// Set defaults
		this.config = {
			type: "http",
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
	}

	private setupMiddleware(): void {
		// JSON body parser
		this.app.use(express.json());

		// CORS middleware
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
		// Health check endpoint
		this.app.get("/health", (_req: Request, res: Response) => {
			res.json({ status: "ok" });
		});

		// MCP message endpoint
		this.app.post("/message", async (req: Request, res: Response) => {
			try {
				const request = req.body;

				// Validate JSON-RPC request
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

				logger.debug(`HTTP request: ${request.method}`, "HttpTransport");

				// Handle request through request handler
				const response = await this.requestHandler.handle(request);

				// Return MCP response
				return res.json(response);
			} catch (error) {
				logger.error(
					"Error handling HTTP request",
					"HttpTransport",
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
			res.status(404).json({
				error: "Not Found",
				message: "Endpoint not found",
			});
		});

		// Error handler
		this.app.use((err: Error, _req: Request, res: Response, _next: unknown) => {
			logger.error("Express error", "HttpTransport", err);
			res.status(400).json({
				error: "Bad Request",
				message: err.message,
			});
		});
	}

	public async start(): Promise<HttpServer> {
		this.setupRoutes();

		return new Promise((resolve, reject) => {
			try {
				this.server = this.app.listen(this.config.port, this.config.host, () => {
					logger.info(
						`HTTP transport listening on ${this.config.host}:${this.config.port}`,
						"HttpTransport",
					);
					if (this.server) {
						resolve(this.server);
					}
				});

				this.server.on("error", (error) => {
					logger.error("HTTP server error", "HttpTransport", error);
					reject(error);
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	public async close(): Promise<void> {
		if (this.server) {
			return new Promise((resolve) => {
				this.server?.close(() => {
					logger.info("HTTP transport closed", "HttpTransport");
					this.server = null;
					resolve();
				});
			});
		}
	}
}
