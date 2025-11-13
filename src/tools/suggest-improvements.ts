import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { z } from "zod";
import type { OsmToolDefinition } from "../types/index.js";
import { checkDeprecated } from "./check-deprecated.js";

/**
 * Result of improvement suggestions
 */
export interface ImprovementResult {
	/** Suggested improvements */
	suggestions: string[];
	/** Warnings about existing tags */
	warnings: string[];
	/** Matched presets for the tag collection */
	matchedPresets: string[];
}

/**
 * Suggest improvements for an OSM tag collection
 *
 * Analyzes tags and provides suggestions for missing fields,
 * warnings about deprecated tags, and recommendations based on
 * matched presets.
 *
 * @param tags - Tag collection to analyze
 * @returns Improvement suggestions and warnings
 */
export async function suggestImprovements(
	tags: Record<string, string>,
): Promise<ImprovementResult> {
	const result: ImprovementResult = {
		suggestions: [],
		warnings: [],
		matchedPresets: [],
	};

	// Handle empty tag collection
	if (Object.keys(tags).length === 0) {
		return result;
	}

	// Check for deprecated tags
	for (const [key, value] of Object.entries(tags)) {
		const deprecationResult = await checkDeprecated(key, value);
		if (deprecationResult.deprecated) {
			result.warnings.push(`Tag ${key}=${value} is deprecated. ${deprecationResult.message}`);
		}
	}

	// Find matching presets
	const matchedPresetIds = findMatchingPresets(tags);
	result.matchedPresets = matchedPresetIds;

	// Suggest missing fields from matched presets
	if (matchedPresetIds.length > 0) {
		const suggestedFields = new Set<string>();

		for (const presetId of matchedPresetIds.slice(0, 5)) {
			// Limit to first 5 presets
			const preset = presets[presetId as keyof typeof presets];
			if (!preset) continue;

			// Check fields
			if ("fields" in preset && preset.fields) {
				for (const fieldId of preset.fields) {
					const fieldKey = getFieldKey(fieldId);
					if (fieldKey && !tags[fieldKey] && !suggestedFields.has(fieldKey)) {
						suggestedFields.add(fieldKey);
						result.suggestions.push(`Consider adding '${fieldKey}' tag (common for ${presetId})`);
					}
				}
			}

			// Check moreFields
			if ("moreFields" in preset && preset.moreFields) {
				for (const fieldId of preset.moreFields.slice(0, 3)) {
					// Limit optional fields
					const fieldKey = getFieldKey(fieldId);
					if (fieldKey && !tags[fieldKey] && !suggestedFields.has(fieldKey)) {
						suggestedFields.add(fieldKey);
						result.suggestions.push(`Optional: Consider adding '${fieldKey}' tag`);
					}
				}
			}
		}
	}

	return result;
}

/**
 * Find presets that match the given tags
 *
 * @param tags - Tags to match against
 * @returns Array of matching preset IDs
 */
function findMatchingPresets(tags: Record<string, string>): string[] {
	const matches: string[] = [];

	for (const [presetId, preset] of Object.entries(presets)) {
		if (!preset.tags || Object.keys(preset.tags).length === 0) continue;

		// Check if all preset tags are present in the input tags
		let allMatch = true;
		for (const [key, value] of Object.entries(preset.tags)) {
			if (value === "*") {
				// Wildcard - just check if key exists
				if (!tags[key]) {
					allMatch = false;
					break;
				}
			} else {
				// Exact match required
				if (tags[key] !== value) {
					allMatch = false;
					break;
				}
			}
		}

		if (allMatch) {
			matches.push(presetId);
		}
	}

	return matches;
}

/**
 * Get the actual field key from a field ID
 *
 * Field IDs can be paths (e.g., "name") or references (e.g., "{amenity}")
 *
 * @param fieldId - Field ID from preset
 * @returns Field key or null
 */
function getFieldKey(fieldId: string): string | null {
	// Skip template references
	if (fieldId.startsWith("{")) {
		return null;
	}

	// Handle direct field references
	const fieldPath = fieldId.replace(/:/g, "/");
	type FieldsType = typeof fields;
	const field = (fields as FieldsType)[fieldPath as keyof FieldsType];

	if (field && "key" in field && field.key) {
		return field.key;
	}

	// Try to use the field ID directly as a key
	return fieldId;
}

const SuggestImprovements: OsmToolDefinition<{
	tags: z.ZodRecord<z.ZodString, z.ZodString>;
}> = {
	name: "suggest_improvements" as const,
	config: () => ({
		description:
			"Suggest improvements for an OSM tag collection. Analyzes tags and provides suggestions for missing fields, warnings about deprecated tags, and recommendations based on matched presets.",
		inputSchema: {
			tags: z
				.record(z.string())
				.describe(
					"Object containing tag key-value pairs to analyze (e.g., { 'amenity': 'restaurant' })",
				),
		},
	}),
	handler: async ({ tags }, _extra) => {
		// Trim all keys and values in the tags object
		const trimmedTags: Record<string, string> = {};
		for (const [key, value] of Object.entries(tags)) {
			trimmedTags[key.trim()] = value.trim();
		}

		const result = await suggestImprovements(trimmedTags);
		return {
			content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
		};
	},
};

export default SuggestImprovements;
