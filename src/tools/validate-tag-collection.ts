import { z } from "zod";
import type { OsmToolDefinition } from "../types/index.js";
import { parseTagInput } from "../utils/tag-parser.js";
import { type ValidationResult, validateTag } from "./validate-tag.js";

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
 * Validate a collection of OSM tags
 *
 * @param tags - Object containing key-value pairs to validate
 * @returns Validation result with aggregated statistics and individual tag results
 */
export async function validateTagCollection(
	tags: Record<string, string>,
): Promise<CollectionValidationResult> {
	const result: CollectionValidationResult = {
		valid: true,
		tagResults: {},
		errors: [],
		warnings: [],
		deprecatedCount: 0,
		errorCount: 0,
		warningCount: 0,
	};

	// Validate each tag individually
	for (const [key, value] of Object.entries(tags)) {
		const tagResult = await validateTag(key, value);
		result.tagResults[key] = tagResult;

		// Aggregate statistics
		if (!tagResult.valid) {
			result.valid = false;
			result.errorCount++;
			result.errors.push(`${key}: ${tagResult.message}`);
		} else if (tagResult.deprecated) {
			// Deprecated tags that are still valid get a warning
			result.deprecatedCount++;
			result.warningCount++;
			result.warnings.push(`${key}=${value}: ${tagResult.message}`);
		} else if (tagResult.message && !tagResult.message.includes("is valid")) {
			// Other warnings (e.g., unknown keys, value not in options)
			result.warningCount++;
			result.warnings.push(`${key}=${value}: ${tagResult.message}`);
		}
	}

	return result;
}

const ValidateTagCollection: OsmToolDefinition<{
	tags: z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>]>;
}> = {
	name: "validate_tag_collection" as const,
	config: () => ({
		description:
			"Validate a collection of OSM tags. Returns validation results for each tag and aggregated statistics. Accepts tags in JSON format, text format (key=value lines), or as an object.",
		inputSchema: {
			tags: z
				.union([z.string(), z.record(z.string())])
				.describe(
					'Tags as object (e.g., {"amenity": "parking"}), JSON string, or text format (one per line: key=value)',
				),
		},
	}),
	handler: async ({ tags }, _extra) => {
		// Parse tags using the shared parser (handles string, JSON, and object formats)
		const parsedTags = typeof tags === "string" ? parseTagInput(tags) : parseTagInput(tags);

		const result = await validateTagCollection(parsedTags);
		return {
			content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
		};
	},
};

export default ValidateTagCollection;
