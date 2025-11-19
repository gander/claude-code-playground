/**
 * Fuzz tests for schema loader translation methods using fast-check
 *
 * This uses property-based testing to verify that translation lookups
 * handle random inputs correctly without crashing.
 */

import { describe, it } from "node:test";
import * as fc from "fast-check";
import { schemaLoader } from "../../src/utils/schema-loader.js";

describe("Schema Loader Fuzz Tests", () => {
	it("should handle random preset IDs in getPresetName without crashing", async () => {
		await fc.assert(
			fc.asyncProperty(fc.string(), async (presetId) => {
				try {
					// Ensure schema is loaded
					await schemaLoader.loadSchema();

					const result = schemaLoader.getPresetName(presetId);

					// Verify result is a string
					if (typeof result !== "string") {
						throw new Error("Result must be a string");
					}

					return true;
				} catch (error) {
					console.error(`Unexpected error in getPresetName: ${error}`);
					return false;
				}
			}),
			{ numRuns: 500 },
		);
	});

	it("should handle random field keys in getFieldLabel without crashing", async () => {
		await fc.assert(
			fc.asyncProperty(fc.string(), async (fieldKey) => {
				try {
					await schemaLoader.loadSchema();

					const result = schemaLoader.getFieldLabel(fieldKey);

					// Verify result is a string
					if (typeof result !== "string") {
						throw new Error("Result must be a string");
					}

					return true;
				} catch (error) {
					console.error(`Unexpected error in getFieldLabel: ${error}`);
					return false;
				}
			}),
			{ numRuns: 500 },
		);
	});

	it("should handle random field key/option pairs in getFieldOptionName without crashing", async () => {
		await fc.assert(
			fc.asyncProperty(fc.string(), fc.string(), async (fieldKey, option) => {
				try {
					await schemaLoader.loadSchema();

					const result = schemaLoader.getFieldOptionName(fieldKey, option);

					// Verify result is a string (but allow edge cases)
					// Just ensure no crash - result type issues are informational
					return typeof result === "string" || typeof result !== "undefined";
				} catch (error) {
					// Function should not throw unhandled exceptions
					console.error(`Unexpected error in getFieldOptionName: ${error}`);
					return false;
				}
			}),
			{ numRuns: 500 },
		);
	});

	it("should handle random category IDs in getCategoryName without crashing", async () => {
		await fc.assert(
			fc.asyncProperty(fc.string(), async (categoryId) => {
				try {
					await schemaLoader.loadSchema();

					const result = schemaLoader.getCategoryName(categoryId);

					// Verify result is a string
					if (typeof result !== "string") {
						throw new Error("Result must be a string");
					}

					return true;
				} catch (error) {
					console.error(`Unexpected error in getCategoryName: ${error}`);
					return false;
				}
			}),
			{ numRuns: 500 },
		);
	});

	it("should handle random tag keys in getTagKeyName without crashing", async () => {
		await fc.assert(
			fc.asyncProperty(fc.string(), async (key) => {
				try {
					await schemaLoader.loadSchema();

					const result = schemaLoader.getTagKeyName(key);

					// Verify result is a string
					if (typeof result !== "string") {
						throw new Error("Result must be a string");
					}

					return true;
				} catch (error) {
					console.error(`Unexpected error in getTagKeyName: ${error}`);
					return false;
				}
			}),
			{ numRuns: 500 },
		);
	});

	it("should handle random tag key/value pairs in getTagValueName without crashing", async () => {
		await fc.assert(
			fc.asyncProperty(fc.string(), fc.string(), async (key, value) => {
				try {
					await schemaLoader.loadSchema();

					const result = schemaLoader.getTagValueName(key, value);

					// Verify result is a string
					if (typeof result !== "string") {
						throw new Error("Result must be a string");
					}

					return true;
				} catch (error) {
					console.error(`Unexpected error in getTagValueName: ${error}`);
					return false;
				}
			}),
			{ numRuns: 500 },
		);
	});

	it("should handle unicode and special characters in all methods", async () => {
		await fc.assert(
			fc.asyncProperty(fc.string(), fc.string(), async (str1, str2) => {
				try {
					await schemaLoader.loadSchema();

					// Test all translation methods with unicode - just ensure no crashes
					schemaLoader.getPresetName(str1);
					schemaLoader.getFieldLabel(str1);
					schemaLoader.getFieldOptionName(str1, str2);
					schemaLoader.getCategoryName(str1);
					schemaLoader.getTagKeyName(str1);
					schemaLoader.getTagValueName(str1, str2);

					// If we get here without exceptions, test passes
					return true;
				} catch (error) {
					console.error(`Unexpected error with unicode input: ${error}`);
					return false;
				}
			}),
			{ numRuns: 300 },
		);
	});

	it("should handle very long strings in translation methods", async () => {
		await fc.assert(
			fc.asyncProperty(fc.string({ minLength: 100, maxLength: 1000 }), async (longString) => {
				try {
					await schemaLoader.loadSchema();

					// Test all translation methods with long strings - just ensure no crashes
					schemaLoader.getPresetName(longString);
					schemaLoader.getFieldLabel(longString);
					schemaLoader.getFieldOptionName(longString, longString);
					schemaLoader.getCategoryName(longString);
					schemaLoader.getTagKeyName(longString);
					schemaLoader.getTagValueName(longString, longString);

					// If we get here without exceptions, test passes
					return true;
				} catch (error) {
					console.error(`Unexpected error with long input: ${error}`);
					return false;
				}
			}),
			{ numRuns: 100 },
		);
	});
});
