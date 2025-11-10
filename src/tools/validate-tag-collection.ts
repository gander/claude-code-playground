import type { SchemaLoader } from "../utils/schema-loader.js";
import { validateTag, type ValidationResult } from "./validate-tag.js";

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
 * @param loader - Schema loader instance
 * @param tags - Object containing key-value pairs to validate
 * @returns Validation result with aggregated statistics and individual tag results
 */
export async function validateTagCollection(
	loader: SchemaLoader,
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
		const tagResult = await validateTag(loader, key, value);
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
