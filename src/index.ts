#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
 * Main entry point
 */
async function main() {
	logger.info("Starting OSM Tagging Schema MCP Server", "main");

	// Create server and preload schema for optimal performance
	const server = createServer();

	// Warmup: Preload schema and build indexes before accepting requests
	// This eliminates initial latency on first tool call
	logger.info("Preloading schema and building indexes...", "main");
	await schemaLoader.warmup();
	logger.info("Schema preloaded successfully", "main");

	// Start stdio transport
	const transport = new StdioServerTransport();
	await server.connect(transport);
	logger.info("OSM Tagging Schema MCP Server running on stdio", "main");
	console.error("OSM Tagging Schema MCP Server running on stdio");
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
