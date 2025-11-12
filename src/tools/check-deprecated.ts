import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import { z } from "zod";
import type { SchemaLoader } from "../utils/schema-loader.js";

/**
 * Tool name
 */
export const name = "check_deprecated";

/**
 * Tool definition
 */
export const definition = {
	description: "Check if an OSM tag is deprecated. Accepts tag key or key-value pair.",
	inputSchema: {
		key: z.string().describe("The tag key to check (e.g., 'amenity', 'highway')"),
		value: z
			.string()
			.optional()
			.describe(
				"Optional tag value. If not provided, checks if any value for this key is deprecated",
			),
	},
} as const;

/**
 * Result of deprecation check
 */
export interface DeprecationResult {
	/** Whether the tag is deprecated */
	deprecated: boolean;
	/** Old tag(s) that are deprecated */
	oldTags?: Record<string, string>;
	/** Suggested replacement tags */
	replacement?: Record<string, string>;
	/** Human-readable message */
	message: string;
}

/**
 * Handler for check_deprecated tool
 */
export async function handler(args: { key: string; value?: string }, _loader: SchemaLoader) {
	const key = args.key;
	const value = args.value;

	// Handle empty key
	if (!key || key.trim() === "") {
		const result: DeprecationResult = {
			deprecated: false,
			oldTags: undefined,
			replacement: undefined,
			message: "Empty key cannot be deprecated",
		};
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(result, null, 2),
				},
			],
			structuredContent: result,
		};
	}

	// Find deprecated entry
	let deprecatedEntry: (typeof deprecated)[0] | undefined;

	if (value !== undefined) {
		// Check for exact key-value match
		deprecatedEntry = deprecated.find((entry) => {
			const oldKeys = Object.keys(entry.old);
			if (oldKeys.length === 1) {
				const oldKey = oldKeys[0];
				if (oldKey) {
					const oldValue = entry.old[oldKey as keyof typeof entry.old];
					return oldValue === value && oldKey === key;
				}
			}
			return false;
		});
	} else {
		// Check for any entry with this key (regardless of value)
		deprecatedEntry = deprecated.find((entry) => {
			const oldKeys = Object.keys(entry.old);
			return oldKeys.includes(key);
		});
	}

	// Not deprecated
	if (!deprecatedEntry) {
		const result: DeprecationResult =
			value !== undefined
				? {
						deprecated: false,
						oldTags: undefined,
						replacement: undefined,
						message: `Tag ${key}=${value} is not deprecated`,
					}
				: {
						deprecated: false,
						oldTags: undefined,
						replacement: undefined,
						message: `Tag key '${key}' is not deprecated`,
					};
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(result, null, 2),
				},
			],
			structuredContent: result,
		};
	}

	// Build oldTags object (filter out undefined values)
	const oldTags: Record<string, string> = {};
	for (const [k, v] of Object.entries(deprecatedEntry.old)) {
		if (v !== undefined) {
			oldTags[k] = v;
		}
	}

	// Build replacement object (filter out undefined values)
	const replacement: Record<string, string> = {};
	if (deprecatedEntry.replace) {
		for (const [k, v] of Object.entries(deprecatedEntry.replace)) {
			if (v !== undefined) {
				replacement[k] = v;
			}
		}
	}

	// Build message
	const oldTagsStr = Object.entries(oldTags)
		.map(([k, v]) => `${k}=${v}`)
		.join(", ");
	const replaceTagsStr = Object.entries(replacement)
		.map(([k, v]) => `${k}=${v}`)
		.join(", ");

	const message = `Tag ${oldTagsStr} is deprecated. Consider using: ${replaceTagsStr}`;

	const result: DeprecationResult = {
		deprecated: true,
		oldTags,
		replacement: Object.keys(replacement).length > 0 ? replacement : undefined,
		message,
	};

	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(result, null, 2),
			},
		],
		structuredContent: result,
	};
}
