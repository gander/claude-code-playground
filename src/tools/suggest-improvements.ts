import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { z } from "zod";
import type { SchemaLoader } from "../utils/schema-loader.js";

/**
 * Tool name
 */
export const name = "suggest_improvements";

/**
 * Tool definition
 */
export const definition = {
	description:
		"Suggest improvements for an OSM tag collection. Analyzes tags and provides suggestions for missing fields, warnings about deprecated tags, and recommendations based on matched presets.",
	inputSchema: {
		tags: z
			.record(z.string())
			.describe(
				"Object containing tag key-value pairs to analyze (e.g., { 'amenity': 'restaurant' })",
			),
	},
} as const;

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
 * Handler for suggest_improvements tool
 */
export async function handler(args: { tags: Record<string, string> }, _loader: SchemaLoader) {
	const tags = args.tags;

	const result: ImprovementResult = {
		suggestions: [],
		warnings: [],
		matchedPresets: [],
	};

	// Handle empty tag collection
	if (Object.keys(tags).length === 0) {
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

	// Check for deprecated tags (inline deprecated check logic)
	for (const [key, value] of Object.entries(tags)) {
		// Find deprecated entry
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
			// Build replacement object
			const replacement: Record<string, string> = {};
			for (const [k, v] of Object.entries(deprecatedEntry.replace)) {
				if (v !== undefined) {
					replacement[k] = v;
				}
			}
			const replaceTagsStr = Object.entries(replacement)
				.map(([k, v]) => `${k}=${v}`)
				.join(", ");
			result.warnings.push(`Tag ${key}=${value} is deprecated. Consider using: ${replaceTagsStr}`);
		}
	}

	// Find matching presets (inline findMatchingPresets logic)
	const matchedPresetIds: string[] = [];
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
			matchedPresetIds.push(presetId);
		}
	}

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
					// Inline getFieldKey logic
					let fieldKey: string | null = null;

					// Skip template references
					if (!fieldId.startsWith("{")) {
						// Handle direct field references
						const fieldPath = fieldId.replace(/:/g, "/");
						type FieldsType = typeof fields;
						const field = (fields as FieldsType)[fieldPath as keyof FieldsType];

						if (field && "key" in field && field.key) {
							fieldKey = field.key;
						} else {
							// Try to use the field ID directly as a key
							fieldKey = fieldId;
						}
					}

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
					// Inline getFieldKey logic
					let fieldKey: string | null = null;

					if (!fieldId.startsWith("{")) {
						const fieldPath = fieldId.replace(/:/g, "/");
						type FieldsType = typeof fields;
						const field = (fields as FieldsType)[fieldPath as keyof FieldsType];

						if (field && "key" in field && field.key) {
							fieldKey = field.key;
						} else {
							fieldKey = fieldId;
						}
					}

					if (fieldKey && !tags[fieldKey] && !suggestedFields.has(fieldKey)) {
						suggestedFields.add(fieldKey);
						result.suggestions.push(`Optional: Consider adding '${fieldKey}' tag`);
					}
				}
			}
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
