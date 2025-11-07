#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

/**
 * Create and configure the MCP server
 */
export function createServer(): Server {
	const server = new Server(
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

	// Register tool handlers
	server.setRequestHandler(ListToolsRequestSchema, async () => ({
		tools: [],
	}));

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		throw new Error(`Unknown tool: ${request.params.name}`);
	});

	return server;
}

/**
 * Main entry point
 */
async function main() {
	const server = createServer();
	const transport = new StdioServerTransport();

	await server.connect(transport);

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
		console.error("Server error:", error);
		process.exit(1);
	});
}
