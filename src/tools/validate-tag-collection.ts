import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import { z } from "zod";
import type { SchemaLoader } from "../utils/schema-loader.js";

/**
 * Tool name
 */
export const name = "validate_tag_collection";

/**
 * Tool definition
 */
export const definition = {
	description:
		"Validate a collection of OSM tags. Returns validation results for each tag and aggregated statistics.",
	inputSchema: {
		tags: z
			.record(z.string())
			.describe(
				"Object containing tag key-value pairs to validate (e.g., { 'amenity': 'parking', 'parking': 'surface' })",
			),
	},
} as const;

/**
 * Result of tag validation
 */
export interface ValidationResult {
	/** Whether the tag is valid */
	valid: boolean;
	/** Whether the tag is deprecated */
	deprecated: boolean;
	/** Validation errors (critical issues) */
	errors: string[];
	/** Validation warnings (non-critical issues) */
	warnings: string[];
	/** Suggested replacement if deprecated */
	replacement?: Record<string, string>;
}

/**
 * Result of tag collection validation
 */
export interface CollectionValidationResult {
	/** Whether the entire collection is valid (no errors) */
	valid: boolean;
	/** Validation results for each individual tag */
	tagResults: Record<string, ValidationResult>;
	/** Collection-level errors */
	errors: string[];
	/** Collection-level warnings */
	warnings: string[];
	/** Count of deprecated tags */
	deprecatedCount: number;
	/** Count of tags with errors */
	errorCount: number;
	/** Count of tags with warnings */
	warningCount: number;
}

/**
 * Handler for validate_tag_collection tool
 */
export async function handler(args: { tags: Record<string, string> }, _loader: SchemaLoader) {
	const tags = args.tags;

	const result: CollectionValidationResult = {
		valid: true,
		tagResults: {},
		errors: [],
		warnings: [],
		deprecatedCount: 0,
		errorCount: 0,
		warningCount: 0,
	};

	// Validate each tag individually (inline validation logic)
	for (const [key, value] of Object.entries(tags)) {
		const tagResult: ValidationResult = {
			valid: true,
			deprecated: false,
			errors: [],
			warnings: [],
		};

		// Check for empty key or value
		if (!key || key.trim() === "") {
			tagResult.valid = false;
			tagResult.errors.push("Tag key cannot be empty");
		} else if (!value || value.trim() === "") {
			tagResult.valid = false;
			tagResult.errors.push("Tag value cannot be empty");
		} else {
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

			if (deprecatedEntry?.replace) {
				tagResult.deprecated = true;
				const replacement: Record<string, string> = {};
				for (const [k, v] of Object.entries(deprecatedEntry.replace)) {
					if (v !== undefined) {
						replacement[k] = v;
					}
				}
				tagResult.replacement = replacement;
				tagResult.warnings.push(
					`Tag ${key}=${value} is deprecated. Consider using: ${JSON.stringify(replacement)}`,
				);
			}

			// Find field definition
			const fieldPath = key.replace(/:/g, "/");
			type FieldsType = typeof fields;
			let fieldDef = (fields as FieldsType)[fieldPath as keyof FieldsType];

			if (!fieldDef) {
				const matchingField = Object.entries(fields).find(
					([_, field]) => "key" in field && field.key === key,
				);
				if (matchingField) {
					fieldDef = matchingField[1];
				}
			}

			if (!fieldDef) {
				tagResult.warnings.push(
					`Tag key '${key}' not found in schema (custom tags are allowed in OpenStreetMap)`,
				);
			} else if ("options" in fieldDef && fieldDef.options && Array.isArray(fieldDef.options)) {
				if (!fieldDef.options.includes(value)) {
					if ("type" in fieldDef && fieldDef.type === "combo") {
						tagResult.warnings.push(
							`Value '${value}' is not in the standard options for '${key}', but custom values are allowed`,
						);
					} else {
						tagResult.warnings.push(
							`Value '${value}' is not in the standard options for '${key}'. Expected one of: ${fieldDef.options.join(", ")}`,
						);
					}
				}
			}
		}

		result.tagResults[key] = tagResult;

		// Aggregate statistics
		if (!tagResult.valid) {
			result.valid = false;
			result.errorCount++;
		}

		if (tagResult.deprecated) {
			result.deprecatedCount++;
		}

		if (tagResult.errors.length > 0) {
			result.errorCount += tagResult.errors.length - 1;
		}

		if (tagResult.warnings.length > 0) {
			result.warningCount += tagResult.warnings.length;
		}
	}

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
