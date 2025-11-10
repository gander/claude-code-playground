import type { SchemaLoader } from "../utils/schema-loader.js";
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};

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
 * Validate a single OSM tag (key-value pair)
 *
 * @param _loader - Schema loader instance (reserved for future use)
 * @param key - Tag key to validate
 * @param value - Tag value to validate
 * @returns Validation result with errors, warnings, and deprecation info
 */
export async function validateTag(
	_loader: SchemaLoader,
	key: string,
	value: string,
): Promise<ValidationResult> {
	const result: ValidationResult = {
		valid: true,
		deprecated: false,
		errors: [],
		warnings: [],
	};

	// Check for empty key or value
	if (!key || key.trim() === "") {
		result.valid = false;
		result.errors.push("Tag key cannot be empty");
		return result;
	}

	if (!value || value.trim() === "") {
		result.valid = false;
		result.errors.push("Tag value cannot be empty");
		return result;
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

	if (deprecatedEntry?.replace) {
		result.deprecated = true;
		// Filter out undefined values from replace object
		const replacement: Record<string, string> = {};
		for (const [k, v] of Object.entries(deprecatedEntry.replace)) {
			if (v !== undefined) {
				replacement[k] = v;
			}
		}
		result.replacement = replacement;
		result.warnings.push(
			`Tag ${key}=${value} is deprecated. Consider using: ${JSON.stringify(replacement)}`,
		);
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
		result.warnings.push(
			`Tag key '${key}' not found in schema (custom tags are allowed in OpenStreetMap)`,
		);
		return result;
	}

	// If field has options, check if value is in the list
	if ("options" in fieldDef && fieldDef.options && Array.isArray(fieldDef.options)) {
		if (!fieldDef.options.includes(value)) {
			// For combo type fields, custom values are allowed
			if ("type" in fieldDef && fieldDef.type === "combo") {
				result.warnings.push(
					`Value '${value}' is not in the standard options for '${key}', but custom values are allowed`,
				);
			} else {
				result.warnings.push(
					`Value '${value}' is not in the standard options for '${key}'. Expected one of: ${fieldDef.options.join(", ")}`,
				);
			}
		}
	}

	return result;
}
