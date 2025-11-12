#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import * as checkDeprecated from "./tools/check-deprecated.js";
import * as getCategories from "./tools/get-categories.js";
import * as getCategoryTags from "./tools/get-category-tags.js";
import * as getPresetDetails from "./tools/get-preset-details.js";
import * as getPresetTags from "./tools/get-preset-tags.js";
import * as getRelatedTags from "./tools/get-related-tags.js";
import * as getSchemaStats from "./tools/get-schema-stats.js";
import * as getTagInfo from "./tools/get-tag-info.js";
import * as getTagValues from "./tools/get-tag-values.js";
import * as searchPresets from "./tools/search-presets.js";
import * as searchTags from "./tools/search-tags.js";
import * as suggestImprovements from "./tools/suggest-improvements.js";
import * as validateTag from "./tools/validate-tag.js";
import * as validateTagCollection from "./tools/validate-tag-collection.js";
import { logger } from "./utils/logger.js";
import { SchemaLoader } from "./utils/schema-loader.js";

/**
 * Create and configure the MCP server
 */
export function createServer(): McpServer {
	const mcpServer = new McpServer(
		{
			name: "osm-tagging-schema",
			version: "0.1.0",
		},
		{
			capabilities: {
				tools: {},
			},
		},
	);

	// Initialize schema loader (indexing always enabled for optimal performance)
	const schemaLoader = new SchemaLoader();

	// Register all tools using registerTool API
	// Tools are registered in alphabetical order
	const toolModules = [
		checkDeprecated,
		getCategories,
		getCategoryTags,
		getPresetDetails,
		getPresetTags,
		getRelatedTags,
		getSchemaStats,
		getTagInfo,
		getTagValues,
		searchPresets,
		searchTags,
		suggestImprovements,
		validateTag,
		validateTagCollection,
	];

	for (const toolModule of toolModules) {
		mcpServer.registerTool(
			toolModule.name,
			{
				description: toolModule.definition.description,
				// biome-ignore lint/suspicious/noExplicitAny: Dynamic tool registration requires any
				inputSchema: toolModule.definition.inputSchema as any,
			},
			// biome-ignore lint/suspicious/noExplicitAny: Callback args type determined by SDK
			async (args: any) => toolModule.handler(args, schemaLoader),
		);
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
 * Create and start HTTP server with SSE transport
 */
async function startHttpServer(
	mcpServer: McpServer,
	config: TransportConfig,
	schemaLoader: SchemaLoader,
): Promise<void> {
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
					await mcpServer.connect(transport);
				}

				// Handle the HTTP request
				await transport.handleRequest(req, res);
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
	const mcpServer = createServer();

	// Warmup: Preload schema and build indexes before accepting requests
	// This eliminates initial latency on first tool call
	logger.info("Preloading schema and building indexes...", "main");
	const schemaLoader = new SchemaLoader();
	await schemaLoader.warmup();
	logger.info("Schema preloaded successfully", "main");

	// Start appropriate transport
	if (config.type === "sse" || config.type === "http") {
		await startHttpServer(mcpServer, config, schemaLoader);
	} else {
		const transport = new StdioServerTransport();
		await mcpServer.connect(transport);
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
