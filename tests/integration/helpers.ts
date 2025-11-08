/**
 * Integration test helpers
 *
 * Shared utilities for MCP server integration tests
 */

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Client as ClientImpl } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/index.js";

export type TestServer = ReturnType<typeof createServer>;

/**
 * Set up client-server connection for integration tests
 *
 * @returns Object containing connected client and server instances
 */
export async function setupClientServer(): Promise<{
	client: Client;
	server: TestServer;
}> {
	// Create server instance
	const server = createServer();

	// Create linked in-memory transports for client-server communication
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

	// Connect server to its transport
	await server.connect(serverTransport);

	// Create and connect client
	const client = new ClientImpl(
		{
			name: "test-client",
			version: "1.0.0",
		},
		{
			capabilities: {},
		},
	);

	await client.connect(clientTransport);

	return { client, server };
}

/**
 * Clean up client-server connection after tests
 *
 * @param client - Client instance to close
 * @param server - Server instance to close
 */
export async function teardownClientServer(client: Client, server: TestServer): Promise<void> {
	await client.close();
	await server.close();
}
