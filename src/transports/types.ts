/**
 * Transport types for MCP server
 */

export type TransportType = "stdio" | "http" | "sse" | "websocket";

/**
 * Base configuration for all transports
 */
export interface TransportConfig {
	type: TransportType;
}

/**
 * Configuration for stdio transport (default)
 */
export interface StdioTransportConfig extends TransportConfig {
	type: "stdio";
}

/**
 * Configuration for HTTP/REST transport
 */
export interface HttpTransportConfig extends TransportConfig {
	type: "http";
	port?: number; // Default: 3000
	host?: string; // Default: "0.0.0.0"
	cors?: {
		enabled?: boolean; // Default: true
		origin?: string | string[]; // Default: "*"
	};
}

/**
 * Configuration for Server-Sent Events transport
 */
export interface SseTransportConfig extends TransportConfig {
	type: "sse";
	port?: number; // Default: 3000
	host?: string; // Default: "0.0.0.0"
	cors?: {
		enabled?: boolean; // Default: true
		origin?: string | string[]; // Default: "*"
	};
}

/**
 * Configuration for WebSocket transport
 */
export interface WebSocketTransportConfig extends TransportConfig {
	type: "websocket";
	port?: number; // Default: 3000
	host?: string; // Default: "0.0.0.0"
	cors?: {
		enabled?: boolean; // Default: true
		origin?: string | string[]; // Default: "*"
	};
}

/**
 * Union type for all transport configurations
 */
export type AnyTransportConfig =
	| StdioTransportConfig
	| HttpTransportConfig
	| SseTransportConfig
	| WebSocketTransportConfig;

/**
 * Parse transport configuration from environment variables
 */
export function parseTransportConfig(): AnyTransportConfig {
	const transport = (process.env.TRANSPORT || "stdio").toLowerCase() as TransportType;

	const baseHttpConfig = {
		port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000,
		host: process.env.HOST || "0.0.0.0",
		cors: {
			enabled: process.env.CORS_ENABLED !== "false",
			origin: process.env.CORS_ORIGIN || "*",
		},
	};

	switch (transport) {
		case "stdio":
			return { type: "stdio" };

		case "http":
			return {
				type: "http",
				...baseHttpConfig,
			};

		case "sse":
			return {
				type: "sse",
				...baseHttpConfig,
			};

		case "websocket":
			return {
				type: "websocket",
				...baseHttpConfig,
			};

		default:
			// Fallback to stdio if invalid transport specified
			return { type: "stdio" };
	}
}
