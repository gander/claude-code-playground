/**
 * Tool definition types for MCP SDK v1.21.1 McpServer API
 *
 * This module defines the interface structure for MCP tools following
 * the new registerTool() pattern with McpServer.
 */

import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShape, z } from "zod";

// Re-export types from MCP SDK for convenience
export type { ToolAnnotations, ToolCallback };

/**
 * Tool configuration returned by config() function
 *
 * Defines tool metadata, input/output schemas, and annotations.
 * Input schema uses MCP-specific format: object with Zod validators.
 */
export interface ToolConfig<
	TInputSchema = Record<string, z.ZodType>,
	TOutputSchema = Record<string, z.ZodType>,
> {
	/** Tool display title (optional) */
	title?: string;

	/** Human-readable tool description */
	description?: string;

	/**
	 * Input validation schema using Zod v3
	 *
	 * MCP-specific format: object with Zod field validators
	 * Example:
	 * ```typescript
	 * inputSchema: {
	 *   tagKey: z.string().describe('OSM tag key to query'),
	 *   limit: z.number().int().positive().optional().describe('Maximum results')
	 * }
	 * ```
	 */
	inputSchema?: TInputSchema;

	/**
	 * Output validation schema using Zod v3 (optional)
	 *
	 * Same format as inputSchema
	 */
	outputSchema?: TOutputSchema;

	/** Tool annotations for metadata and hints */
	annotations?: ToolAnnotations;

	/** Additional metadata (extensible) */
	_meta?: Record<string, unknown>;
}

/**
 * Tool definition interface for MCP tools
 *
 * Each MCP tool must conform to this structure:
 * - name: Unique tool identifier
 * - config(): Function returning tool configuration
 * - handler: Async callback implementing tool logic (from MCP SDK)
 *
 * Example:
 * ```typescript
 * const GetTagInfo = {
 *   name: 'get_tag_info',
 *   config: () => ({
 *     description: 'Get comprehensive information about an OSM tag',
 *     inputSchema: {
 *       tagKey: z.string().describe('Tag key to query')
 *     }
 *   }),
 *   handler: async ({ tagKey }, extra) => {
 *     // Implementation with pre-validated tagKey
 *     return {
 *       content: [{ type: 'text', text: JSON.stringify(result) }]
 *     };
 *   }
 * } as const satisfies ToolDefinition;
 * ```
 */
export interface ToolDefinition<
	TInputSchema extends ZodRawShape | undefined = undefined,
	TOutputSchema extends ZodRawShape | undefined = undefined,
> {
	/**
	 * Tool identifier (e.g., "get_tag_info")
	 *
	 * Must be unique across all tools in the server.
	 */
	name: string;

	/**
	 * Configuration function returning tool metadata and schemas
	 *
	 * Must be a function (not static object) to allow dynamic generation.
	 * Returns tool description, input/output schemas, and annotations.
	 */
	config: () => ToolConfig<TInputSchema, TOutputSchema>;

	/**
	 * Tool implementation handler
	 *
	 * Handler from MCP SDK that receives pre-validated arguments from Zod.
	 * Signature depends on whether inputSchema is defined:
	 * - With inputSchema: (args, extra) => CallToolResult | Promise<CallToolResult>
	 * - Without inputSchema: (extra) => CallToolResult | Promise<CallToolResult>
	 */
	handler: ToolCallback<TInputSchema>;
}
