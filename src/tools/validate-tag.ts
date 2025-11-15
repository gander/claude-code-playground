import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import { z } from "zod";
import type { OsmToolDefinition } from "../types/index.js";

/**
 * Result of tag validation
 */
export interface ValidationResult {
	/** Whether the tag is valid */
	valid: boolean;
	/** Whether the tag is deprecated */
	deprecated: boolean;
	/** Human-readable validation message */
	message: string;
	/** Suggested replacement if deprecated */
	replacement?: Record<string, string>;
}

/**
 * Validate a single OSM tag (key-value pair)
 *
 * @param key - Tag key to validate
 * @param value - Tag value to validate
 * @returns Validation result with errors, warnings, and deprecation info
 */
export async function validateTag(key: string, value: string): Promise<ValidationResult> {
	const messages: string[] = [];

	// Check for empty key or value
	if (!key || key.trim() === "") {
		return {
			valid: false,
			deprecated: false,
			message: "Tag key cannot be empty",
		};
	}

	if (!value || value.trim() === "") {
		return {
			valid: false,
			deprecated: false,
			message: "Tag value cannot be empty",
		};
	}

	// Check if tag is deprecated
	const deprecatedEntry = deprecated.find((entry) => {
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

	let replacement: Record<string, string> | undefined;
	let isDeprecated = false;

	if (deprecatedEntry?.replace) {
		isDeprecated = true;
		// Filter out undefined values from replace object
		const replacementTags: Record<string, string> = {};
		for (const [k, v] of Object.entries(deprecatedEntry.replace)) {
			if (v !== undefined) {
				replacementTags[k] = v;
			}
		}
		replacement = replacementTags;
		const replacementStr = Object.entries(replacementTags)
			.map(([k, v]) => `${k}=${v}`)
			.join(", ");
		messages.push(`Tag ${key}=${value} is deprecated. Consider using: ${replacementStr}`);
	}

	// Find field definition by looking for field.key === key
	const fieldPath = key.replace(/:/g, "/"); // Convert colon to slash for field lookup
	type FieldsType = typeof fields;
	let fieldDef = (fields as FieldsType)[fieldPath as keyof FieldsType];

	// If not found with slash conversion, try direct lookup
	if (!fieldDef) {
		// Search through all fields for matching key
		const matchingField = Object.entries(fields).find(
			([_, field]) => "key" in field && field.key === key,
		);
		if (matchingField) {
			fieldDef = matchingField[1];
		}
	}

	if (!fieldDef) {
		// Key not found in schema - this is allowed in OSM but we warn about it
		messages.push(
			`Tag key '${key}' not found in schema (custom tags are allowed in OpenStreetMap)`,
		);
		return {
			valid: true,
			deprecated: isDeprecated,
			message: messages.join(". "),
			replacement,
		};
	}

	// If field has options, check if value is in the list
	if ("options" in fieldDef && fieldDef.options && Array.isArray(fieldDef.options)) {
		if (!fieldDef.options.includes(value)) {
			// For combo type fields, custom values are allowed
			if ("type" in fieldDef && fieldDef.type === "combo") {
				messages.push(
					`Value '${value}' is not in the standard options for '${key}', but custom values are allowed`,
				);
			} else {
				messages.push(
					`Value '${value}' is not in the standard options for '${key}'. Expected one of: ${fieldDef.options.join(", ")}`,
				);
			}
		}
	}

	// Build final message
	const finalMessage = messages.length > 0 ? messages.join(". ") : `Tag ${key}=${value} is valid`;

	return {
		valid: true,
		deprecated: isDeprecated,
		message: finalMessage,
		replacement,
	};
}

const ValidateTag: OsmToolDefinition<{
	key: z.ZodString;
	value: z.ZodString;
}> = {
	name: "validate_tag" as const,
	config: () => ({
		description:
			"Validate a single OSM tag key-value pair. Checks for deprecated tags, unknown keys, and validates against field options.",
		inputSchema: {
			key: z.string().describe("The tag key to validate (e.g., 'amenity', 'building')"),
			value: z.string().describe("The tag value to validate (e.g., 'restaurant', 'yes')"),
		},
	}),
	handler: async ({ key, value }, _extra) => {
		const result = await validateTag(key.trim(), value.trim());
		return {
			content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
		};
	},
};

export default ValidateTag;
