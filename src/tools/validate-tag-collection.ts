import { type ValidationResult, validateTag } from "./validate-tag.js";

/**
 * Tool definition for validate_tag_collection
 */
export const definition = {
	name: "validate_tag_collection",
	description:
		"Validate a collection of OSM tags. Returns validation results for each tag and aggregated statistics.",
	inputSchema: {
		type: "object" as const,
		properties: {
			tags: {
				type: "object",
				description:
					"Object containing tag key-value pairs to validate (e.g., { 'amenity': 'parking', 'parking': 'surface' })",
				additionalProperties: {
					type: "string",
				},
			},
		},
		required: ["tags"],
	},
};

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
		}

		if (tagResult.deprecated) {
			result.deprecatedCount++;
		}

		if (tagResult.errors.length > 0) {
			result.errorCount += tagResult.errors.length - 1; // Already counted once above
		}

		if (tagResult.warnings.length > 0) {
			result.warningCount += tagResult.warnings.length;
		}
	}

	return result;
}

/**
 * Handler for validate_tag_collection tool
 */
export async function handler(args: unknown) {
	const { tags } = args as { tags?: Record<string, string> };
	if (!tags) {
		throw new Error("tags parameter is required");
	}
	const result = await validateTagCollection(tags);
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(result, null, 2),
			},
		],
	};
}
