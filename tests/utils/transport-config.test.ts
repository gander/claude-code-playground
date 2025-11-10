import assert from "node:assert";
import { describe, it, beforeEach, afterEach } from "node:test";
import { getTransportConfig, type TransportConfig } from "../../src/utils/transport-config.js";

describe("Transport Configuration", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		// Save original environment
		originalEnv = { ...process.env };
	});

	afterEach(() => {
		// Restore original environment
		process.env = originalEnv;
	});

	describe("Default Configuration", () => {
		it("should return stdio as default transport", () => {
			delete process.env.TRANSPORT;
			const config = getTransportConfig();
			assert.strictEqual(config.transport, "stdio");
		});

		it("should return default HTTP configuration", () => {
			delete process.env.TRANSPORT;
			delete process.env.HTTP_PORT;
			delete process.env.HTTP_HOST;
			delete process.env.HTTP_SESSION_MODE;
			delete process.env.HTTP_CORS_ENABLED;
			delete process.env.HTTP_CORS_ORIGIN;

			const config = getTransportConfig();
			assert.strictEqual(config.http.port, 3000);
			assert.strictEqual(config.http.host, "0.0.0.0");
			assert.strictEqual(config.http.sessionMode, "stateful");
			assert.strictEqual(config.http.corsEnabled, true);
			assert.strictEqual(config.http.corsOrigin, "*");
		});
	});

	describe("Environment Variable Parsing", () => {
		it("should parse TRANSPORT=stdio", () => {
			process.env.TRANSPORT = "stdio";
			const config = getTransportConfig();
			assert.strictEqual(config.transport, "stdio");
		});

		it("should parse TRANSPORT=http", () => {
			process.env.TRANSPORT = "http";
			const config = getTransportConfig();
			assert.strictEqual(config.transport, "http");
		});

		it("should throw error for invalid transport", () => {
			process.env.TRANSPORT = "invalid";
			assert.throws(
				() => getTransportConfig(),
				/Invalid TRANSPORT value/,
			);
		});

		it("should parse HTTP_PORT as number", () => {
			process.env.HTTP_PORT = "8080";
			const config = getTransportConfig();
			assert.strictEqual(config.http.port, 8080);
			assert.strictEqual(typeof config.http.port, "number");
		});

		it("should throw error for invalid HTTP_PORT", () => {
			process.env.HTTP_PORT = "invalid";
			assert.throws(
				() => getTransportConfig(),
				/Invalid HTTP_PORT value/,
			);
		});

		it("should throw error for HTTP_PORT out of range (low)", () => {
			process.env.HTTP_PORT = "0";
			assert.throws(
				() => getTransportConfig(),
				/HTTP_PORT must be between 1 and 65535/,
			);
		});

		it("should throw error for HTTP_PORT out of range (high)", () => {
			process.env.HTTP_PORT = "70000";
			assert.throws(
				() => getTransportConfig(),
				/HTTP_PORT must be between 1 and 65535/,
			);
		});

		it("should parse HTTP_HOST", () => {
			process.env.HTTP_HOST = "127.0.0.1";
			const config = getTransportConfig();
			assert.strictEqual(config.http.host, "127.0.0.1");
		});

		it("should parse HTTP_SESSION_MODE=stateful", () => {
			process.env.HTTP_SESSION_MODE = "stateful";
			const config = getTransportConfig();
			assert.strictEqual(config.http.sessionMode, "stateful");
		});

		it("should parse HTTP_SESSION_MODE=stateless", () => {
			process.env.HTTP_SESSION_MODE = "stateless";
			const config = getTransportConfig();
			assert.strictEqual(config.http.sessionMode, "stateless");
		});

		it("should throw error for invalid HTTP_SESSION_MODE", () => {
			process.env.HTTP_SESSION_MODE = "invalid";
			assert.throws(
				() => getTransportConfig(),
				/Invalid HTTP_SESSION_MODE value/,
			);
		});

		it("should parse HTTP_CORS_ENABLED=true", () => {
			process.env.HTTP_CORS_ENABLED = "true";
			const config = getTransportConfig();
			assert.strictEqual(config.http.corsEnabled, true);
		});

		it("should parse HTTP_CORS_ENABLED=false", () => {
			process.env.HTTP_CORS_ENABLED = "false";
			const config = getTransportConfig();
			assert.strictEqual(config.http.corsEnabled, false);
		});

		it("should parse HTTP_CORS_ENABLED=1 as true", () => {
			process.env.HTTP_CORS_ENABLED = "1";
			const config = getTransportConfig();
			assert.strictEqual(config.http.corsEnabled, true);
		});

		it("should parse HTTP_CORS_ENABLED=0 as false", () => {
			process.env.HTTP_CORS_ENABLED = "0";
			const config = getTransportConfig();
			assert.strictEqual(config.http.corsEnabled, false);
		});

		it("should throw error for invalid HTTP_CORS_ENABLED", () => {
			process.env.HTTP_CORS_ENABLED = "invalid";
			assert.throws(
				() => getTransportConfig(),
				/Invalid HTTP_CORS_ENABLED value/,
			);
		});

		it("should parse HTTP_CORS_ORIGIN", () => {
			process.env.HTTP_CORS_ORIGIN = "https://example.com";
			const config = getTransportConfig();
			assert.strictEqual(config.http.corsOrigin, "https://example.com");
		});
	});

	describe("Full Configuration", () => {
		it("should parse all HTTP environment variables together", () => {
			process.env.TRANSPORT = "http";
			process.env.HTTP_PORT = "8080";
			process.env.HTTP_HOST = "localhost";
			process.env.HTTP_SESSION_MODE = "stateless";
			process.env.HTTP_CORS_ENABLED = "false";
			process.env.HTTP_CORS_ORIGIN = "https://example.com";

			const config = getTransportConfig();
			assert.strictEqual(config.transport, "http");
			assert.strictEqual(config.http.port, 8080);
			assert.strictEqual(config.http.host, "localhost");
			assert.strictEqual(config.http.sessionMode, "stateless");
			assert.strictEqual(config.http.corsEnabled, false);
			assert.strictEqual(config.http.corsOrigin, "https://example.com");
		});
	});

	describe("Type Safety", () => {
		it("should return TransportConfig type", () => {
			const config = getTransportConfig();
			// Type assertions - will fail at compile time if types are wrong
			const transport: "stdio" | "http" = config.transport;
			const port: number = config.http.port;
			const host: string = config.http.host;
			const sessionMode: "stateful" | "stateless" = config.http.sessionMode;
			const corsEnabled: boolean = config.http.corsEnabled;
			const corsOrigin: string = config.http.corsOrigin;

			assert.ok(transport !== undefined);
			assert.ok(typeof port === "number");
			assert.ok(typeof host === "string");
			assert.ok(sessionMode !== undefined);
			assert.ok(typeof corsEnabled === "boolean");
			assert.ok(typeof corsOrigin === "string");
		});
	});

	describe("Case Insensitivity", () => {
		it("should handle TRANSPORT in uppercase", () => {
			process.env.TRANSPORT = "HTTP";
			const config = getTransportConfig();
			assert.strictEqual(config.transport, "http");
		});

		it("should handle TRANSPORT in mixed case", () => {
			process.env.TRANSPORT = "StDiO";
			const config = getTransportConfig();
			assert.strictEqual(config.transport, "stdio");
		});

		it("should handle HTTP_SESSION_MODE in uppercase", () => {
			process.env.HTTP_SESSION_MODE = "STATEFUL";
			const config = getTransportConfig();
			assert.strictEqual(config.http.sessionMode, "stateful");
		});

		it("should handle HTTP_CORS_ENABLED in uppercase", () => {
			process.env.HTTP_CORS_ENABLED = "TRUE";
			const config = getTransportConfig();
			assert.strictEqual(config.http.corsEnabled, true);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty string for TRANSPORT (use default)", () => {
			process.env.TRANSPORT = "";
			const config = getTransportConfig();
			assert.strictEqual(config.transport, "stdio");
		});

		it("should handle whitespace in TRANSPORT", () => {
			process.env.TRANSPORT = "  http  ";
			const config = getTransportConfig();
			assert.strictEqual(config.transport, "http");
		});

		it("should handle minimum valid port (1)", () => {
			process.env.HTTP_PORT = "1";
			const config = getTransportConfig();
			assert.strictEqual(config.http.port, 1);
		});

		it("should handle maximum valid port (65535)", () => {
			process.env.HTTP_PORT = "65535";
			const config = getTransportConfig();
			assert.strictEqual(config.http.port, 65535);
		});

		it("should handle IPv6 host", () => {
			process.env.HTTP_HOST = "::1";
			const config = getTransportConfig();
			assert.strictEqual(config.http.host, "::1");
		});
	});
});
