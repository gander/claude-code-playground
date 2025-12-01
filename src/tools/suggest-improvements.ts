import fieldsRaw from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import presetsRaw from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { z } from "zod";
import type { Field, OsmToolDefinition, Preset } from "../types/index.js";
import { schemaLoader } from "../utils/schema-loader.js";
import { parseTagInput } from "../utils/tag-parser.js";

const fields = fieldsRaw as unknown as Record<string, Field>;
const presets = presetsRaw as unknown as Record<string, Preset>;

/**
 * Structured suggestion with operation type and details
 */
export interface Suggestion {
	/** Type of operation: add, remove, or update */
	operation: "add" | "remove" | "update";
	/** Human-readable explanation with reason */
	message: string;
	/** Tag key being suggested */
	key: string;
	/** Localized key name */
	keyName: string;
}

/**
 * Detailed preset information
 */
export interface PresetDetailed {
	/** Preset ID (e.g., "amenity/restaurant") */
	id: string;
	/** Localized preset name */
	name: string;
}

/**
 * Result of improvement suggestions
 */
export interface ImprovementResult {
	/** Structured suggestions for improvements */
	suggestions: Suggestion[];
	/** Matched presets (backward compatibility) */
	matchedPresets: string[];
	/** Detailed preset information */
	matchedPresetsDetailed: PresetDetailed[];
}

/**
 * Suggest improvements for an OSM tag collection
 *
 * Analyzes tags and provides structured suggestions for missing fields
 * and recommendations based on matched presets.
 *
 * @param tags - Tag collection to analyze
 * @returns Improvement suggestions with operations and localized names
 */
export async function suggestImprovements(
	tags: Record<string, string>,
): Promise<ImprovementResult> {
	const result: ImprovementResult = {
		suggestions: [],
		matchedPresets: [],
		matchedPresetsDetailed: [],
	};

	// Handle empty tag collection
	if (Object.keys(tags).length === 0) {
		return result;
	}

	// Load schema for translation lookups
	await schemaLoader.loadSchema();

	// Find matching presets
	const matchedPresetIds = findMatchingPresets(tags);
	result.matchedPresets = matchedPresetIds;

	// Build detailed preset information
	for (const presetId of matchedPresetIds) {
		const presetName = schemaLoader.getPresetName(presetId);
		result.matchedPresetsDetailed.push({
			id: presetId,
			name: presetName,
		});
	}

	// Suggest missing fields from matched presets
	if (matchedPresetIds.length > 0) {
		const suggestedFields = new Set<string>();

		for (const presetId of matchedPresetIds.slice(0, 5)) {
			// Limit to first 5 presets
			const preset = presets[presetId as keyof typeof presets];
			if (!preset) continue;

			// Get preset name for context
			const presetName = schemaLoader.getPresetName(presetId);

			// Check fields
			if ("fields" in preset && preset.fields) {
				for (const fieldId of preset.fields) {
					const fieldKey = getFieldKey(fieldId);
					if (fieldKey && !tags[fieldKey] && !suggestedFields.has(fieldKey)) {
						suggestedFields.add(fieldKey);

						// Get localized field name
						const fieldPath = fieldKey.replace(/:/g, "/");
						const keyName = schemaLoader.getFieldLabel(fieldPath);

						result.suggestions.push({
							operation: "add",
							message: `Add '${fieldKey}' to provide more information about this ${presetName}`,
							key: fieldKey,
							keyName,
						});
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

						// Get localized field name
						const fieldPath = fieldKey.replace(/:/g, "/");
						const keyName = schemaLoader.getFieldLabel(fieldPath);

						result.suggestions.push({
							operation: "add",
							message: `Optional: Add '${fieldKey}' for additional details about this ${presetName}`,
							key: fieldKey,
							keyName,
						});
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
	tags: z.ZodUnion<readonly [z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>]>;
}> = {
	name: "suggest_improvements" as const,
	config: () => ({
		description:
			"Analyze an OpenStreetMap tag collection and suggest improvements to make it more complete and informative. This tool identifies which OSM presets match your tags, then suggests missing fields that would enhance the feature's documentation. Returns structured suggestions categorized by operation type (add, remove, update) with human-readable explanations. Suggestions include both required fields (core attributes for the matched preset) and optional fields (additional details that would be helpful). Each suggestion includes localized field names and explains why the field would improve the data. Use this for improving incomplete OSM data, learning what additional tags are recommended for a feature type, or ensuring comprehensive tagging before data upload. Accepts input in three flexible formats: JSON object, JSON string, or flat text format (key=value per line).",
		inputSchema: {
			tags: z
				.union([z.string(), z.record(z.string(), z.string())])
				.describe(
					'Collection of existing OpenStreetMap tags to analyze in one of three formats: 1) JSON object (e.g., {"amenity": "restaurant", "name": "Test Cafe"}), 2) JSON string (e.g., \'{"amenity":"parking"}\'), or 3) flat text format with one tag per line (e.g., "amenity=restaurant\\nname=Test"). The tool will identify matching presets and suggest additional fields that would make this feature more complete. Minimum one tag required.',
				),
		},
	}),
	handler: async ({ tags }, _extra) => {
		// Parse tags using the shared parser (handles string, JSON, and object formats)
		const parsedTags = typeof tags === "string" ? parseTagInput(tags) : parseTagInput(tags);

		const result = await suggestImprovements(parsedTags);
		return {
			content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
		};
	},
};

export default SuggestImprovements;
