import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import { z } from "zod";
import type { OsmToolDefinition } from "../types/index.js";

/**
 * Single deprecation case
 */
export interface DeprecationCase {
	/** Old tag(s) that are deprecated */
	oldTags: Record<string, string>;
	/** Suggested replacement tags */
	replacement?: Record<string, string>;
	/** Type of deprecation: 'key' (any value) or 'value' (specific value) */
	deprecationType: "key" | "value";
}

/**
 * Result of deprecation check
 */
export interface DeprecationResult {
	/** Whether the tag is deprecated */
	deprecated: boolean;
	/** Collection of all deprecated cases found (undefined if not deprecated) */
	cases?: DeprecationCase[];
	/** Human-readable message */
	message: string;
}

/**
 * Check if an OSM tag is deprecated
 *
 * @param key - Tag key to check
 * @param value - Optional tag value. If not provided, returns ALL deprecated values for this key
 * @returns Deprecation result with ALL matching cases and replacement suggestions
 */
export async function checkDeprecated(key: string, value?: string): Promise<DeprecationResult> {
	// Handle empty key
	if (!key || key.trim() === "") {
		return {
			deprecated: false,
			cases: undefined,
			message: "Empty key cannot be deprecated",
		};
	}

	// Find ALL deprecated entries for this key
	const deprecatedEntries: (typeof deprecated)[0][] = [];

	if (value !== undefined) {
		// Find exact key-value match (should be only one, but collect all matches)
		for (const entry of deprecated) {
			const oldKeys = Object.keys(entry.old);
			if (oldKeys.length === 1) {
				const oldKey = oldKeys[0];
				if (oldKey === key) {
					const oldValue = entry.old[oldKey as keyof typeof entry.old];
					if (oldValue === value || oldValue === "*") {
						deprecatedEntries.push(entry);
					}
				}
			}
		}
	} else {
		// Find ALL entries with this key (regardless of value)
		for (const entry of deprecated) {
			const oldKeys = Object.keys(entry.old);
			if (oldKeys.includes(key)) {
				deprecatedEntries.push(entry);
			}
		}
	}

	// Not deprecated
	if (deprecatedEntries.length === 0) {
		if (value !== undefined) {
			return {
				deprecated: false,
				cases: undefined,
				message: `Tag ${key}=${value} is not deprecated`,
			};
		}
		return {
			deprecated: false,
			cases: undefined,
			message: `Tag key '${key}' is not deprecated`,
		};
	}

	// Build cases array
	const cases: DeprecationCase[] = [];

	for (const entry of deprecatedEntries) {
		// Build oldTags object (filter out undefined values)
		const oldTags: Record<string, string> = {};
		for (const [k, v] of Object.entries(entry.old)) {
			if (v !== undefined) {
				oldTags[k] = v;
			}
		}

		// Build replacement object (filter out undefined values)
		const replacement: Record<string, string> = {};
		if (entry.replace) {
			for (const [k, v] of Object.entries(entry.replace)) {
				if (v !== undefined) {
					replacement[k] = v;
				}
			}
		}

		// Determine deprecation type
		const deprecationType: "key" | "value" = oldTags[key] === "*" ? "key" : "value";

		cases.push({
			oldTags,
			replacement: Object.keys(replacement).length > 0 ? replacement : undefined,
			deprecationType,
		});
	}

	// Build message
	let message: string;
	if (cases.length === 1 && cases[0]) {
		const case_ = cases[0];
		const oldTagsStr = Object.entries(case_.oldTags)
			.map(([k, v]) => `${k}=${v}`)
			.join(", ");
		const replaceTagsStr = case_.replacement
			? Object.entries(case_.replacement)
					.map(([k, v]) => `${k}=${v}`)
					.join(", ")
			: "no replacement";

		if (case_.deprecationType === "key") {
			message = `Tag key '${key}' is deprecated (any value). Consider using: ${replaceTagsStr}`;
		} else {
			message = `Tag ${oldTagsStr} is deprecated. Consider using: ${replaceTagsStr}`;
		}
	} else {
		message = `Found ${cases.length} deprecated cases for '${key}'. Check individual cases for details.`;
	}

	return {
		deprecated: true,
		cases,
		message,
	};
}

const CheckDeprecated: OsmToolDefinition<{
	key: z.ZodString;
	value: z.ZodOptional<z.ZodString>;
}> = {
	name: "check_deprecated" as const,
	config: () => ({
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
	}),
	handler: async ({ key, value }, _extra) => {
		const result = await checkDeprecated(key.trim(), value ? value.trim() : undefined);
		return {
			content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
		};
	},
};

export default CheckDeprecated;
