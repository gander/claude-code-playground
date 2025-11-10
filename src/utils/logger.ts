/**
 * Log levels ordered by severity (lower number = more severe)
 */
export type LogLevel = "SILENT" | "ERROR" | "WARN" | "INFO" | "DEBUG";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
	SILENT: 0,
	ERROR: 1,
	WARN: 2,
	INFO: 3,
	DEBUG: 4,
};

/**
 * Sanitize user input for safe logging
 * Prevents log injection attacks by removing control characters and newlines
 */
function sanitizeForLog(value: unknown): string {
	if (value === null || value === undefined) {
		return String(value);
	}

	// Convert to string and remove control characters, newlines, and tabs
	// Using Unicode property escapes to match control characters (biome-ignore lint/suspicious/noControlCharactersInRegex: security sanitization)
	return String(value)
		.replace(/[\r\n\t]/g, " ")  // Replace newlines and tabs with spaces
		// biome-ignore lint/suspicious/noControlCharactersInRegex: removing control characters for log injection prevention
		.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");  // Remove control characters
}

/**
 * Simple logger with configurable log levels
 * Supports filtering by severity and custom output writers
 */
export class Logger {
	private level: LogLevel;
	private writer: (message: string) => void;

	constructor(
		level?: LogLevel | string,
		writer: (message: string) => void = (msg) => console.error(msg),
	) {
		// Read from environment variable if not specified
		const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
		const configuredLevel = (level || envLevel || "INFO") as string;

		// Validate log level
		if (this.isValidLogLevel(configuredLevel.toUpperCase())) {
			this.level = configuredLevel.toUpperCase() as LogLevel;
		} else {
			this.level = "INFO";
		}

		this.writer = writer;
	}

	private isValidLogLevel(level: string): level is LogLevel {
		return level in LOG_LEVEL_PRIORITY;
	}

	private shouldLog(messageLevel: LogLevel): boolean {
		const currentPriority = LOG_LEVEL_PRIORITY[this.level];
		const messagePriority = LOG_LEVEL_PRIORITY[messageLevel];
		return messagePriority <= currentPriority;
	}

	private formatMessage(level: LogLevel, message: string, context?: string, error?: Error): string {
		const parts: string[] = [];

		// Timestamp
		parts.push(new Date().toISOString());

		// Log level
		parts.push(`[${level}]`);

		// Context (if provided) - sanitize to prevent log injection
		if (context) {
			parts.push(`[${sanitizeForLog(context)}]`);
		}

		// Message - sanitize to prevent log injection
		parts.push(sanitizeForLog(message));

		// Error details (if provided)
		if (error) {
			parts.push(`\nError: ${sanitizeForLog(error.message)}`);
			if (error.stack) {
				parts.push(`\nStack: ${sanitizeForLog(error.stack)}`);
			}
		}

		return parts.join(" ");
	}

	private log(level: LogLevel, message: string, context?: string, error?: Error): void {
		if (!this.shouldLog(level)) {
			return;
		}

		const formatted = this.formatMessage(level, message, context, error);
		this.writer(formatted);
	}

	public error(message: string, context?: string, error?: Error): void {
		this.log("ERROR", message, context, error);
	}

	public warn(message: string, context?: string): void {
		this.log("WARN", message, context);
	}

	public info(message: string, context?: string): void {
		this.log("INFO", message, context);
	}

	public debug(message: string, context?: string): void {
		this.log("DEBUG", message, context);
	}
}

/**
 * Global logger instance
 * Can be configured via LOG_LEVEL environment variable
 */
export const logger = new Logger();
