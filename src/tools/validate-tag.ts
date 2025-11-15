import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import { z } from "zod";
import type { OsmToolDefinition } from "../types/index.js";
import { schemaLoader } from "../utils/schema-loader.js";

/**
 * Detailed tag information with localized names
 */
export interface TagDetailed {
	/** Tag key */
	key: string;
	/** Localized key name */
	keyName: string;
	/** Tag value */
	value: string;
	/** Localized value name */
	valueName: string;
}

/**
 * Result of tag validation
 */
export interface ValidationResult {
	/** Original tag key */
	key: string;
	/** Localized key name (e.g., "Amenity" for "amenity") */
	keyName: string;
	/** Original tag value */
	value: string;
	/** Localized value name (e.g., "Restaurant" for "restaurant") */
	valueName: string;
	/** Whether the tag is valid */
	valid: boolean;
	/** Whether the tag is deprecated */
	deprecated: boolean;
	/** Human-readable validation message */
	message: string;
	/** Whether this key has predefined options */
	hasOptions: boolean;
	/** Whether the value is in the predefined options */
	valueInOptions: boolean;
	/** Suggested replacement if deprecated (backward compatibility) */
	replacement?: Record<string, string>;
	/** Detailed replacement with localized names */
	replacementDetailed?: TagDetailed[];
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

	// Load schema for translation lookups
	await schemaLoader.loadSchema();

	// Check for empty key or value
	if (!key || key.trim() === "") {
		return {
			key: key || "",
			keyName: "",
			value: value || "",
			valueName: "",
			valid: false,
			deprecated: false,
			message: "Tag key cannot be empty",
			hasOptions: false,
			valueInOptions: false,
		};
	}

	if (!value || value.trim() === "") {
		const keyName = schemaLoader.getFieldLabel(key);
		return {
			key,
			keyName,
			value: value || "",
			valueName: "",
			valid: false,
			deprecated: false,
			message: "Tag value cannot be empty",
			hasOptions: false,
			valueInOptions: false,
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
	let replacementDetailed: TagDetailed[] | undefined;
	let isDeprecated = false;

	if (deprecatedEntry?.replace) {
		isDeprecated = true;
		// Filter out undefined values from replace object
		const replacementTags: Record<string, string> = {};
		const replacementDetails: TagDetailed[] = [];

		for (const [k, v] of Object.entries(deprecatedEntry.replace)) {
			if (v !== undefined && typeof v === "string") {
				replacementTags[k] = v;

				// Get localized names for replacement tags
				// Convert key to field path for translation lookup
				const replFieldPath = k.replace(/:/g, "/");
				const replKeyName = schemaLoader.getFieldLabel(replFieldPath);
				const replValueName = schemaLoader.getFieldOptionName(replFieldPath, v).title;

				replacementDetails.push({
					key: k,
					keyName: replKeyName,
					value: v,
					valueName: replValueName,
				});
			}
		}

		replacement = replacementTags;
		replacementDetailed = replacementDetails;

		const replacementStr = Object.entries(replacementTags)
			.map(([k, v]) => `${k}=${v}`)
			.join(", ");
		messages.push(`Tag ${key}=${value} is deprecated. Consider using: ${replacementStr}`);
	}

	// Find field definition by looking for field.key === key
	const fieldPath = key.replace(/:/g, "/"); // Convert colon to slash for field lookup
	type FieldsType = typeof fields;
	let fieldDef: (typeof fields)[keyof typeof fields] | undefined;
	let actualFieldPath = fieldPath; // Track the actual field path for translations

	// Try direct path lookup first (most common case)
	fieldDef = (fields as FieldsType)[fieldPath as keyof FieldsType];
	actualFieldPath = fieldPath;

	// If not found, search for field by matching field.key
	if (!fieldDef) {
		const matchingField = Object.entries(fields).find(
			([_, field]) => "key" in field && field.key === key,
		);
		if (matchingField) {
			fieldDef = matchingField[1];
			actualFieldPath = matchingField[0]; // Use the found field path for translations
		}
	}

	// Get localized names for key and value using the field path (not the OSM key)
	let keyName = "";
	let valueName = "";

	try {
		keyName = schemaLoader.getFieldLabel(actualFieldPath);
	} catch (_error) {
		// Fallback if translation lookup fails
		keyName = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
	}

	try {
		const optionName = schemaLoader.getFieldOptionName(actualFieldPath, value);
		valueName = optionName?.title || "";
		// Ensure we always have a valueName, use fallback if empty
		if (!valueName) {
			valueName = value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
		}
	} catch (_error) {
		// Fallback if translation lookup fails
		valueName = value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
	}

	if (!fieldDef) {
		// Key not found in schema - this is allowed in OSM but we warn about it
		messages.push(
			`Tag key '${key}' not found in schema (custom tags are allowed in OpenStreetMap)`,
		);
		return {
			key,
			keyName,
			value,
			valueName,
			valid: true,
			deprecated: isDeprecated,
			message: messages.join(". "),
			hasOptions: false,
			valueInOptions: false,
			replacement,
			replacementDetailed,
		};
	}

	// Track if field has options and if value is in options
	let hasOptions = false;
	let valueInOptions = false;

	// If field has options, check if value is in the list
	if ("options" in fieldDef && fieldDef.options && Array.isArray(fieldDef.options)) {
		hasOptions = true;
		valueInOptions = fieldDef.options.includes(value);

		if (!valueInOptions) {
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
		key,
		keyName,
		value,
		valueName,
		valid: true,
		deprecated: isDeprecated,
		message: finalMessage,
		hasOptions,
		valueInOptions,
		replacement,
		replacementDetailed,
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
