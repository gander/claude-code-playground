import assert from "node:assert";
import { describe, it } from "node:test";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { handler } from "../../src/tools/get-related-tags.ts";
import { SchemaLoader } from "../../src/utils/schema-loader.ts";

describe("get_related_tags", () => {
	describe("Basic Functionality", () => {
		it("should return related tags for a tag key", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ tag: "amenity" }, loader);
			const results = handlerResult.structuredContent.relatedTags;

			assert.ok(Array.isArray(results), "Should return an array");
			assert.ok(results.length > 0, "Should find related tags");
		});

		it("should return related tags for a key=value pair", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ tag: "amenity=restaurant" }, loader);
			const results = handlerResult.structuredContent.relatedTags;

			assert.ok(Array.isArray(results), "Should return an array");
			assert.ok(results.length > 0, "Should find related tags");
		});

		it("should return tags with required properties", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ tag: "amenity=cafe" }, loader);
			const results = handlerResult.structuredContent.relatedTags;

			assert.ok(results.length > 0, "Should have results");
			const first = results[0];
			assert.ok(first, "Should have first result");
			assert.ok(typeof first.key === "string", "Should have key property");
			assert.ok(typeof first.frequency === "number", "Should have frequency property");
			assert.ok(first.frequency > 0, "Frequency should be positive");
		});

		it("should sort results by frequency (descending)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ tag: "amenity=parking" }, loader);
			const results = handlerResult.structuredContent.relatedTags;

			assert.ok(results.length > 1, "Should have multiple results");
			for (let i = 1; i < results.length; i++) {
				assert.ok(
					results[i - 1].frequency >= results[i].frequency,
					"Results should be sorted by frequency descending",
				);
			}
		});

		it("should limit results when limit parameter is provided", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const limit = 5;
			const handlerResult = await handler({ tag: "amenity", limit }, loader);
			const results = handlerResult.structuredContent.relatedTags;

			assert.ok(results.length <= limit, `Should return at most ${limit} results`);
		});

		it("should exclude the input tag itself from results", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ tag: "amenity=restaurant" }, loader);
			const results = handlerResult.structuredContent.relatedTags;

			// Should not include amenity=restaurant in the results
			const hasSelf = results.some((r) => r.key === "amenity" && r.value === "restaurant");
			assert.ok(!hasSelf, "Should not include the input tag in results");
		});

		it("should return empty array for non-existent tag", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ tag: "nonexistent=fakeval12345xyz" }, loader);
			const results = handlerResult.structuredContent.relatedTags;

			assert.ok(Array.isArray(results), "Should return an array");
			assert.strictEqual(results.length, 0, "Should return empty array");
		});

		it("should use cached data on subsequent calls", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const handlerResult1 = await handler({ tag: "amenity=hospital" }, loader);
			const results1 = handlerResult1.structuredContent;
			const handlerResult2 = await handler({ tag: "amenity=hospital" }, loader);
			const results2 = handlerResult2.structuredContent;

			assert.deepStrictEqual(results1, results2, "Results should be identical from cache");
		});

		it("should handle tag key without specific value", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ tag: "building" }, loader);
			const results = handlerResult.structuredContent.relatedTags;

			assert.ok(Array.isArray(results), "Should return an array");
			// When searching for just "building" key, should find tags that appear
			// with any building=* presets
			assert.ok(results.length > 0, "Should find related tags for key");
		});
	});

	describe("JSON Schema Validation", () => {
		/**
		 * Provider pattern: Generates tag combinations DYNAMICALLY from JSON presets
		 * CRITICAL: NO hardcoded tags - all tags extracted from actual JSON
		 * Selects a representative sample of presets with their tags for systematic testing
		 */
		function* tagCombinationProvider() {
			const presetEntries = Object.entries(presets);

			// Sample presets systematically (every 50th preset for performance)
			const step = Math.max(1, Math.floor(presetEntries.length / 50));
			for (let i = 0; i < presetEntries.length; i += step) {
				const [presetId, preset] = presetEntries[i];

				// Only test presets that have tags
				if (!preset.tags || Object.keys(preset.tags).length === 0) continue;

				// Get first tag from preset as test input
				const firstKey = Object.keys(preset.tags)[0];
				const firstValue = preset.tags[firstKey];

				// Skip wildcards and complex values
				if (!firstValue || firstValue === "*" || firstValue.includes("|")) continue;
				if (typeof firstValue !== "string") continue;

				yield {
					presetId,
					tag: `${firstKey}=${firstValue}`,
					key: firstKey,
					value: firstValue,
				};
			}
		}

		it("should return related tags that exist in JSON presets", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ tag: "amenity=restaurant", limit: 20 }, loader);
			const results = handlerResult.structuredContent.relatedTags;

			// Verify each related tag exists in JSON presets
			for (const result of results) {
				let found = false;

				// Check if this tag exists in any preset
				for (const preset of Object.values(presets)) {
					if (preset.tags?.[result.key] === result.value) {
						found = true;
						break;
					}
					if (preset.addTags?.[result.key] === result.value) {
						found = true;
						break;
					}
					// Also check for key-only matches (when value is undefined)
					if (result.value === undefined && preset.tags?.[result.key]) {
						found = true;
						break;
					}
				}

				assert.ok(
					found,
					`Related tag ${result.key}${result.value ? `=${result.value}` : ""} should exist in JSON presets`,
				);
			}
		});

		it("should systematically test related tags for dynamic preset samples (100% data-driven)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// CRITICAL: Test dynamically sampled tags from JSON - NO hardcoded values
			let testedCount = 0;
			for (const testCase of tagCombinationProvider()) {
				const handlerResult = await handler({ tag: testCase.tag, limit: 10 }, loader);
				const results = handlerResult.structuredContent.relatedTags;

				// Verify each related tag exists in JSON presets
				for (const result of results) {
					let found = false;

					// Check if this tag exists in any preset
					for (const preset of Object.values(presets)) {
						if (preset.tags?.[result.key] === result.value) {
							found = true;
							break;
						}
						if (preset.addTags?.[result.key] === result.value) {
							found = true;
							break;
						}
						// Also check for key-only matches (when value is undefined)
						if (result.value === undefined && preset.tags?.[result.key]) {
							found = true;
							break;
						}
					}

					assert.ok(
						found,
						`Related tag ${result.key}${result.value ? `=${result.value}` : ""} for input ${testCase.tag} should exist in JSON presets`,
					);
				}

				testedCount++;
			}

			// Verify we tested a reasonable sample
			assert.ok(testedCount > 0, "Should have tested at least some tag combinations from JSON");
		});

		it("should verify frequency counts match actual preset occurrences", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const tag = "amenity=cafe";
			const handlerResult = await handler({ tag: tag, limit: 10 }, loader);
			const results = handlerResult.structuredContent.relatedTags;

			// For each related tag, verify frequency matches actual count in presets
			for (const result of results) {
				let actualCount = 0;

				// Count presets that have BOTH the input tag AND the related tag
				for (const preset of Object.values(presets)) {
					const hasInputTag = preset.tags?.amenity === "cafe" || preset.addTags?.amenity === "cafe";

					if (hasInputTag) {
						const hasRelatedTag =
							preset.tags?.[result.key] === result.value ||
							preset.addTags?.[result.key] === result.value ||
							(result.value === undefined &&
								(preset.tags?.[result.key] || preset.addTags?.[result.key]));

						if (hasRelatedTag) {
							actualCount++;
						}
					}
				}

				assert.strictEqual(
					result.frequency,
					actualCount,
					`Frequency for ${result.key}${result.value ? `=${result.value}` : ""} should match actual count`,
				);
			}
		});

		it("should find related tags that co-occur in presets", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const handlerResult = await handler({ tag: "amenity=parking" }, loader);
			const results = handlerResult.structuredContent.relatedTags;

			// Check that results are tags that actually appear with amenity=parking
			// in the JSON data
			for (const result of results) {
				let foundCoOccurrence = false;

				for (const preset of Object.values(presets)) {
					const hasParkingTag =
						preset.tags?.amenity === "parking" || preset.addTags?.amenity === "parking";

					if (hasParkingTag) {
						const hasRelatedTag =
							preset.tags?.[result.key] === result.value ||
							preset.addTags?.[result.key] === result.value ||
							(result.value === undefined &&
								(preset.tags?.[result.key] || preset.addTags?.[result.key]));

						if (hasRelatedTag) {
							foundCoOccurrence = true;
							break;
						}
					}
				}

				assert.ok(
					foundCoOccurrence,
					`Related tag ${result.key}${result.value ? `=${result.value}` : ""} should co-occur with amenity=parking in JSON`,
				);
			}
		});
	});
});
