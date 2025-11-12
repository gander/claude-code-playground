import { logger } from "./logger.js";
import type { SchemaLoader } from "./schema-loader.js";

/**
 * Tool handler function type - accepts any args and returns any result
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic tool handler type
export type ToolHandler = (args: any, loader: SchemaLoader) => Promise<any>;

/**
 * Wraps a tool handler with logging and error handling
 *
 * @param name - Tool name for logging
 * @param handler - Original handler function
 * @returns Wrapped handler with logging
 */
export function wrapToolHandler(name: string, handler: ToolHandler): ToolHandler {
	// biome-ignore lint/suspicious/noExplicitAny: Generic wrapper preserves handler signature
	return async (args: any, loader: SchemaLoader): Promise<any> => {
		logger.debug(`Tool call: ${name}`, "MCPServer");
		try {
			return await handler(args, loader);
		} catch (error) {
			logger.error(
				`Error executing tool: ${name}`,
				"MCPServer",
				error instanceof Error ? error : new Error(String(error)),
			);
			throw error;
		}
	};
}
