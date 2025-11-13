/**
 * Tool definition types for MCP SDK v1.21.1 McpServer API
 *
 * This module defines the interface structure for MCP tools following
 * the new registerTool() pattern with McpServer.
 */

import type { z } from "zod";

/**
 * Tool annotations for metadata and hints
 */
export interface ToolAnnotations {
	/** Audience designation for the tool */
	audience?: Array<"user" | "assistant">;
	/** Progress tracking support */
	progress?: boolean;
	/** Cost tier information */
	costTier?: "low" | "medium" | "high";
	[key: string]: unknown;
}

/**
 * MCP tool callback function type
 *
 * Handler receives pre-validated arguments from Zod and returns tool result.
 * Arguments are fully typed based on the inputSchema.
 */
export type ToolCallback<TInput> = (args: TInput) => Promise<{
	content: Array<{
		type: "text" | "image" | "resource";
		text?: string;
		data?: string;
		mimeType?: string;
		[key: string]: unknown;
	}>;
	structuredContent?: unknown;
	isError?: boolean;
}>;

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
 * - handler: Async callback implementing tool logic
 *
 * Example:
 * ```typescript
 * const GetTagInfo: ToolDefinition = {
 *   name: 'get_tag_info',
 *   config: () => ({
 *     description: 'Get comprehensive information about an OSM tag',
 *     inputSchema: {
 *       tagKey: z.string().describe('Tag key to query')
 *     }
 *   }),
 *   handler: async ({ tagKey }) => {
 *     // Implementation with pre-validated tagKey
 *     return {
 *       content: [{ type: 'text', text: JSON.stringify(result) }],
 *       structuredContent: result
 *     };
 *   }
 * };
 * ```
 */
export interface ToolDefinition<
	TInputSchema = Record<string, z.ZodType>,
	TOutputSchema = Record<string, z.ZodType>,
	TInput = unknown,
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
	 * Async function receiving pre-validated arguments from Zod.
	 * Arguments are typed based on inputSchema.
	 *
	 * @param args - Validated input arguments (typed object)
	 * @returns Tool result with content array and optional structured data
	 *
	 * Example:
	 * ```typescript
	 * handler: async ({ tagKey, limit = 10 }) => {
	 *   // tagKey is validated as string by Zod
	 *   // limit is validated as optional number with default
	 *
	 *   const result = await queryTag(tagKey, limit);
	 *
	 *   return {
	 *     content: [{ type: 'text', text: JSON.stringify(result) }],
	 *     structuredContent: result
	 *   };
	 * }
	 * ```
	 */
	handler: ToolCallback<TInput>;
}
