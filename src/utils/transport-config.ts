/**
 * Transport configuration module
 * Parses and validates environment variables for transport configuration
 */

export type TransportType = "stdio" | "http";
export type SessionMode = "stateful" | "stateless";

export interface HTTPConfig {
	port: number;
	host: string;
	sessionMode: SessionMode;
	corsEnabled: boolean;
	corsOrigin: string;
}

export interface TransportConfig {
	transport: TransportType;
	http: HTTPConfig;
}

/**
 * Parse a boolean environment variable
 * Accepts: true, false, 1, 0 (case insensitive)
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
	if (value === undefined || value.trim() === "") {
		return defaultValue;
	}

	const normalized = value.toLowerCase().trim();
	if (normalized === "true" || normalized === "1") {
		return true;
	}
	if (normalized === "false" || normalized === "0") {
		return false;
	}

	throw new Error(
		`Invalid HTTP_CORS_ENABLED value: "${value}". Expected: true, false, 1, or 0`,
	);
}

/**
 * Parse a port number environment variable
 */
function parsePort(value: string | undefined, defaultValue: number): number {
	if (value === undefined || value.trim() === "") {
		return defaultValue;
	}

	const port = Number.parseInt(value.trim(), 10);
	if (Number.isNaN(port)) {
		throw new Error(
			`Invalid HTTP_PORT value: "${value}". Expected: number between 1 and 65535`,
		);
	}

	if (port < 1 || port > 65535) {
		throw new Error(`HTTP_PORT must be between 1 and 65535, got: ${port}`);
	}

	return port;
}

/**
 * Parse transport type environment variable
 */
function parseTransportType(value: string | undefined): TransportType {
	if (value === undefined || value.trim() === "") {
		return "stdio";
	}

	const normalized = value.toLowerCase().trim() as TransportType;
	if (normalized !== "stdio" && normalized !== "http") {
		throw new Error(
			`Invalid TRANSPORT value: "${value}". Expected: stdio or http`,
		);
	}

	return normalized;
}

/**
 * Parse session mode environment variable
 */
function parseSessionMode(value: string | undefined): SessionMode {
	if (value === undefined || value.trim() === "") {
		return "stateful";
	}

	const normalized = value.toLowerCase().trim() as SessionMode;
	if (normalized !== "stateful" && normalized !== "stateless") {
		throw new Error(
			`Invalid HTTP_SESSION_MODE value: "${value}". Expected: stateful or stateless`,
		);
	}

	return normalized;
}

/**
 * Get transport configuration from environment variables
 * Validates all values and provides sensible defaults
 */
export function getTransportConfig(): TransportConfig {
	return {
		transport: parseTransportType(process.env.TRANSPORT),
		http: {
			port: parsePort(process.env.HTTP_PORT, 3000),
			host: process.env.HTTP_HOST?.trim() || "0.0.0.0",
			sessionMode: parseSessionMode(process.env.HTTP_SESSION_MODE),
			corsEnabled: parseBoolean(process.env.HTTP_CORS_ENABLED, true),
			corsOrigin: process.env.HTTP_CORS_ORIGIN?.trim() || "*",
		},
	};
}
