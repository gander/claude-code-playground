/**
 * Fuzz tests for tag validation using fast-check
 *
 * This uses property-based testing to generate random tag key-value pairs
 * and verify the validator handles them correctly without crashing.
 */

import { describe, it } from "node:test";
import * as fc from "fast-check";
import { validateTag } from "../../src/tools/validate-tag.js";

describe("Tag Validation Fuzz Tests", () => {
	it("should handle random key-value pairs without crashing", () => {
		fc.assert(
			fc.asyncProperty(fc.string(), fc.string(), async (key, value) => {
				try {
					const result = await validateTag(key, value);

					// Verify result structure
					if (typeof result !== "object" || result === null) {
						throw new Error("Result must be an object");
					}

					// Verify required fields exist
					if (typeof result.key !== "string") {
						throw new Error("Result must have string 'key' field");
					}
					if (typeof result.keyName !== "string") {
						throw new Error("Result must have string 'keyName' field");
					}
					if (typeof result.value !== "string") {
						throw new Error("Result must have string 'value' field");
					}
					if (typeof result.valueName !== "string") {
						throw new Error("Result must have string 'valueName' field");
					}
					if (typeof result.valid !== "boolean") {
						throw new Error("Result must have boolean 'valid' field");
					}
					if (typeof result.deprecated !== "boolean") {
						throw new Error("Result must have boolean 'deprecated' field");
					}
					if (typeof result.message !== "string") {
						throw new Error("Result must have string 'message' field");
					}

					return true;
				} catch (error) {
					// Validator should not throw errors - it should return validation results
					console.error(`Unexpected error in validateTag: ${error}`);
					return false;
				}
			}),
			{ numRuns: 500 }, // Reduced runs due to async nature
		);
	});

	it("should handle OSM-like tag keys without crashing", () => {
		// Generate realistic OSM tag keys
		const osmKeyGen = fc.oneof(
			fc.constantFrom("amenity", "building", "highway", "name", "shop", "leisure"),
			fc.string({ minLength: 1, maxLength: 30 }),
		);

		fc.assert(
			fc.asyncProperty(osmKeyGen, fc.string(), async (key, value) => {
				try {
					const result = await validateTag(key, value);

					// Verify result structure
					if (typeof result !== "object" || result === null) {
						throw new Error("Result must be an object");
					}

					return true;
				} catch (error) {
					console.error(`Unexpected error in validateTag: ${error}`);
					return false;
				}
			}),
			{ numRuns: 500 },
		);
	});

	it("should handle empty and whitespace inputs", () => {
		fc.assert(
			fc.asyncProperty(
				fc.string({ maxLength: 10 }),
				fc.string({ maxLength: 10 }),
				async (key, value) => {
					try {
						const result = await validateTag(key, value);

						// Empty keys/values should return valid=false
						if ((key.trim() === "" || value.trim() === "") && result.valid === true) {
							console.error("Empty key/value should return valid=false");
							return false;
						}

						return true;
					} catch (error) {
						console.error(`Unexpected error in validateTag: ${error}`);
						return false;
					}
				},
			),
			{ numRuns: 100 },
		);
	});

	it("should handle special characters and unicode", () => {
		fc.assert(
			fc.asyncProperty(fc.string(), fc.string(), async (key, value) => {
				try {
					const result = await validateTag(key, value);

					// Verify result structure
					if (typeof result !== "object" || result === null) {
						throw new Error("Result must be an object");
					}

					return true;
				} catch (error) {
					console.error(`Unexpected error in validateTag: ${error}`);
					return false;
				}
			}),
			{ numRuns: 500 },
		);
	});

	it("should handle very long keys and values", () => {
		fc.assert(
			fc.asyncProperty(
				fc.string({ minLength: 100, maxLength: 1000 }),
				fc.string({ minLength: 100, maxLength: 1000 }),
				async (key, value) => {
					try {
						const result = await validateTag(key, value);

						// Verify result structure
						if (typeof result !== "object" || result === null) {
							throw new Error("Result must be an object");
						}

						return true;
					} catch (error) {
						console.error(`Unexpected error in validateTag: ${error}`);
						return false;
					}
				},
			),
			{ numRuns: 100 }, // Fewer runs for large inputs
		);
	});

	it("should handle known deprecated tags", () => {
		// Test with some known deprecated tag patterns
		const deprecatedPatterns = fc.oneof(
			fc.tuple(fc.constant("amenity"), fc.constant("ev_charging")),
			fc.tuple(fc.constant("highway"), fc.constant("ford")),
			fc.tuple(fc.string(), fc.string()),
		);

		fc.assert(
			fc.asyncProperty(deprecatedPatterns, async ([key, value]) => {
				try {
					const result = await validateTag(key, value);

					// If deprecated flag is true, replacement should be provided
					if (result.deprecated && !result.replacement) {
						console.error("Deprecated tag should have replacement");
						return false;
					}

					return true;
				} catch (error) {
					console.error(`Unexpected error in validateTag: ${error}`);
					return false;
				}
			}),
			{ numRuns: 500 },
		);
	});

	it("should handle common OSM tag patterns", () => {
		// Generate common OSM tag patterns
		const osmKeys = fc.constantFrom(
			"amenity",
			"building",
			"highway",
			"natural",
			"shop",
			"leisure",
			"name",
			"addr:street",
			"opening_hours",
		);
		const osmValues = fc.oneof(
			fc.constantFrom("yes", "no"),
			fc.string({ minLength: 1, maxLength: 50 }),
		);

		fc.assert(
			fc.asyncProperty(osmKeys, osmValues, async (key, value) => {
				try {
					const result = await validateTag(key, value);

					// Verify result structure
					if (typeof result !== "object" || result === null) {
						throw new Error("Result must be an object");
					}

					// For known keys, valid should be true (even if value is custom)
					if (key.trim() !== "" && value.trim() !== "" && result.valid === false) {
						// Only fail if it's not due to empty input
						console.error(`Known key '${key}' should not return valid=false`);
						return false;
					}

					return true;
				} catch (error) {
					console.error(`Unexpected error in validateTag: ${error}`);
					return false;
				}
			}),
			{ numRuns: 500 },
		);
	});
});
