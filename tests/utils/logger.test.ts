import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { Logger } from "../../src/utils/logger.js";

describe("Logger", () => {
	describe("Log Level Filtering", () => {
		it("should log error messages at ERROR level", () => {
			const output: string[] = [];
			const logger = new Logger("ERROR", (msg) => output.push(msg));

			logger.error("error message");
			logger.warn("warn message");
			logger.info("info message");
			logger.debug("debug message");

			assert.strictEqual(output.length, 1);
			assert.ok(output[0].includes("ERROR"));
			assert.ok(output[0].includes("error message"));
		});

		it("should log error and warn messages at WARN level", () => {
			const output: string[] = [];
			const logger = new Logger("WARN", (msg) => output.push(msg));

			logger.error("error message");
			logger.warn("warn message");
			logger.info("info message");
			logger.debug("debug message");

			assert.strictEqual(output.length, 2);
			assert.ok(output[0].includes("ERROR"));
			assert.ok(output[1].includes("WARN"));
		});

		it("should log error, warn, and info messages at INFO level", () => {
			const output: string[] = [];
			const logger = new Logger("INFO", (msg) => output.push(msg));

			logger.error("error message");
			logger.warn("warn message");
			logger.info("info message");
			logger.debug("debug message");

			assert.strictEqual(output.length, 3);
			assert.ok(output[0].includes("ERROR"));
			assert.ok(output[1].includes("WARN"));
			assert.ok(output[2].includes("INFO"));
		});

		it("should log all messages at DEBUG level", () => {
			const output: string[] = [];
			const logger = new Logger("DEBUG", (msg) => output.push(msg));

			logger.error("error message");
			logger.warn("warn message");
			logger.info("info message");
			logger.debug("debug message");

			assert.strictEqual(output.length, 4);
			assert.ok(output[0].includes("ERROR"));
			assert.ok(output[1].includes("WARN"));
			assert.ok(output[2].includes("INFO"));
			assert.ok(output[3].includes("DEBUG"));
		});

		it("should not log anything at SILENT level", () => {
			const output: string[] = [];
			const logger = new Logger("SILENT", (msg) => output.push(msg));

			logger.error("error message");
			logger.warn("warn message");
			logger.info("info message");
			logger.debug("debug message");

			assert.strictEqual(output.length, 0);
		});
	});

	describe("Message Formatting", () => {
		it("should include log level in message", () => {
			const output: string[] = [];
			const logger = new Logger("DEBUG", (msg) => output.push(msg));

			logger.info("test message");

			assert.ok(output[0].includes("[INFO]"));
		});

		it("should include the actual message", () => {
			const output: string[] = [];
			const logger = new Logger("DEBUG", (msg) => output.push(msg));

			logger.info("test message");

			assert.ok(output[0].includes("test message"));
		});

		it("should include context prefix if provided", () => {
			const output: string[] = [];
			const logger = new Logger("DEBUG", (msg) => output.push(msg));

			logger.info("test message", "MyContext");

			assert.ok(output[0].includes("[MyContext]"));
		});
	});

	describe("Default Behavior", () => {
		it("should default to INFO level if not specified", () => {
			const output: string[] = [];
			const logger = new Logger(undefined, (msg) => output.push(msg));

			logger.debug("debug message");
			logger.info("info message");

			// Debug should not be logged, info should be
			assert.strictEqual(output.length, 1);
			assert.ok(output[0].includes("INFO"));
		});

		it("should use console.error as default writer", () => {
			const consoleError = mock.method(console, "error", () => {});

			const logger = new Logger("ERROR");
			logger.error("test message");

			assert.strictEqual(consoleError.mock.calls.length, 1);

			consoleError.mock.restore();
		});
	});

	describe("Environment Variable Configuration", () => {
		it("should read log level from LOG_LEVEL environment variable", () => {
			const originalEnv = process.env.LOG_LEVEL;
			process.env.LOG_LEVEL = "DEBUG";

			const output: string[] = [];
			const logger = new Logger(undefined, (msg) => output.push(msg));

			logger.debug("debug message");

			assert.strictEqual(output.length, 1);
			assert.ok(output[0].includes("DEBUG"));

			// Restore
			if (originalEnv !== undefined) {
				process.env.LOG_LEVEL = originalEnv;
			} else {
				delete process.env.LOG_LEVEL;
			}
		});

		it("should handle invalid log level from environment", () => {
			const originalEnv = process.env.LOG_LEVEL;
			process.env.LOG_LEVEL = "INVALID";

			const output: string[] = [];
			const logger = new Logger(undefined, (msg) => output.push(msg));

			logger.info("info message");

			// Should default to INFO
			assert.strictEqual(output.length, 1);

			// Restore
			if (originalEnv !== undefined) {
				process.env.LOG_LEVEL = originalEnv;
			} else {
				delete process.env.LOG_LEVEL;
			}
		});
	});

	describe("Error Object Logging", () => {
		it("should log error objects with stack trace", () => {
			const output: string[] = [];
			const logger = new Logger("ERROR", (msg) => output.push(msg));

			const error = new Error("test error");
			logger.error("An error occurred", "ErrorHandler", error);

			assert.ok(output[0].includes("An error occurred"));
			assert.ok(output[0].includes("test error"));
		});
	});
});
