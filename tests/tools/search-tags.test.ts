import assert from "node:assert";
import { describe, it } from "node:test";
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { searchTags } from "../../src/tools/search-tags.ts";
import { SchemaLoader } from "../../src/utils/schema-loader.ts";

describe("search_tags", () => {
	describe("Basic Functionality", () => {
		it("should return tags matching the keyword", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const results = await searchTags(loader, "restaurant");

			assert.ok(Array.isArray(results), "Should return an array");
			assert.ok(results.length > 0, "Should find matching tags");
		});

		it("should return tags with key and value properties", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const results = await searchTags(loader, "cafe");

			assert.ok(results.length > 0, "Should have results");
			const first = results[0];
			assert.ok(first, "Should have first result");
			assert.ok(typeof first.key === "string", "Should have key property");
			assert.ok(typeof first.value === "string", "Should have value property");
		});

		it("should perform case-insensitive search", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const resultsLower = await searchTags(loader, "park");
			const resultsUpper = await searchTags(loader, "PARK");

			assert.ok(resultsLower.length > 0, "Should find results with lowercase");
			assert.ok(resultsUpper.length > 0, "Should find results with uppercase");
			assert.deepStrictEqual(resultsLower, resultsUpper, "Case should not matter");
		});

		it("should return empty array for no matches", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const results = await searchTags(loader, "nonexistentkeywordinosm12345xyz");

			assert.ok(Array.isArray(results), "Should return an array");
			assert.strictEqual(results.length, 0, "Should return empty array");
		});

		it("should limit results to prevent overwhelming output", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const results = await searchTags(loader, "building");

			assert.ok(Array.isArray(results), "Should return an array");
			// Should have reasonable limit, not thousands of results
			assert.ok(results.length <= 100, "Should limit results to reasonable number");
		});

		it("should use cached data on subsequent calls", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const results1 = await searchTags(loader, "school");
			const results2 = await searchTags(loader, "school");

			assert.deepStrictEqual(results1, results2, "Results should be identical from cache");
		});

		it("should find tag keys from fields.json (BUG FIX TEST)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const results = await searchTags(loader, "wheelchair");

			// wheelchair exists in fields.json with options: yes, limited, no
			// This test fails before the bug fix
			assert.ok(results.length > 0, "Should find wheelchair tag from fields.json");

			// Should return results like wheelchair=yes, wheelchair=limited, wheelchair=no
			const hasWheelchairKey = results.some((r) => r.key === "wheelchair");
			assert.ok(hasWheelchairKey, "Should have results with wheelchair as key");

			// Verify all returned values exist in fields.json options
			const wheelchairField = fields.wheelchair;
			assert.ok(wheelchairField, "wheelchair should exist in fields.json");

			const wheelchairResults = results.filter((r) => r.key === "wheelchair");
			for (const result of wheelchairResults) {
				assert.ok(
					wheelchairField.options?.includes(result.value),
					`Value "${result.value}" should be in wheelchair field options`,
				);
			}
		});

		it("should return keys with colon separator, not slash (BUG FIX TEST)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			// Search for "toilets" to find nested keys like toilets:wheelchair
			const results = await searchTags(loader, "toilets");

			assert.ok(results.length > 0, "Should find toilets-related tags");

			// Check that no keys contain slash separator
			for (const result of results) {
				assert.ok(
					!result.key.includes("/"),
					`Key "${result.key}" should not contain slash separator`,
				);
			}

			// Specifically check for toilets:wheelchair (not toilets/wheelchair)
			// This field is defined in data/fields/toilets/wheelchair.json
			// but should be returned as "toilets:wheelchair"
			const toiletsWheelchairField = fields["toilets/wheelchair"];
			if (toiletsWheelchairField) {
				// Field exists in schema, so we should find it
				const toiletsWheelchairResults = results.filter((r) => r.key === "toilets:wheelchair");
				assert.ok(
					toiletsWheelchairResults.length > 0,
					"Should find toilets:wheelchair (with colon, not slash)",
				);
			}
		});
	});

	describe("JSON Schema Validation", () => {
		/**
		 * Provider pattern: Generates search keywords with expected result validation
		 * Tests incremental collection of search results
		 */
		function* searchKeywordProvider() {
			const keywords = ["parking", "restaurant", "school", "park", "hospital"];

			for (const keyword of keywords) {
				// Build expected results from JSON
				const expectedTags = new Set<string>();

				for (const preset of Object.values(presets)) {
					const presetName = (preset.name || "").toLowerCase();
					const keywordLower = keyword.toLowerCase();

					// Check tags
					for (const [key, value] of Object.entries(preset.tags)) {
						const keyMatch = key.toLowerCase().includes(keywordLower);
						const valueMatch =
							typeof value === "string" && value.toLowerCase().includes(keywordLower);

						if (keyMatch || valueMatch || presetName.includes(keywordLower)) {
							if (value && value !== "*" && !value.includes("|")) {
								expectedTags.add(`${key}=${value}`);
							}
						}
					}

					// Check addTags
					if (preset.addTags) {
						for (const [key, value] of Object.entries(preset.addTags)) {
							const keyMatch = key.toLowerCase().includes(keywordLower);
							const valueMatch =
								typeof value === "string" && value.toLowerCase().includes(keywordLower);

							if (keyMatch || valueMatch || presetName.includes(keywordLower)) {
								if (value && value !== "*" && !value.includes("|")) {
									expectedTags.add(`${key}=${value}`);
								}
							}
						}
					}
				}

				yield {
					keyword,
					expectedTagCount: expectedTags.size,
					expectedTags,
				};
			}
		}

		it("should return search results matching JSON data (presets + fields)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const results = await searchTags(loader, "parking");

			// Verify each result corresponds to actual JSON data (presets OR fields)
			for (const result of results) {
				let found = false;

				// Check in fields.json
				// Note: field.key might not be a simple conversion from map key
				// (e.g., "parking/side/parking" → "parking:both"), so we need to search by field.key
				for (const field of Object.values(fields)) {
					if (field.key === result.key && field.options && Array.isArray(field.options)) {
						if (field.options.includes(result.value)) {
							found = true;
							break;
						}
					}
				}

				// Check in presets
				if (!found) {
					for (const preset of Object.values(presets)) {
						// Check in tags
						if (preset.tags?.[result.key] === result.value) {
							found = true;
							break;
						}
						// Check in addTags
						if (preset.addTags?.[result.key] === result.value) {
							found = true;
							break;
						}
					}
				}

				assert.ok(
					found,
					`Result ${result.key}=${result.value} should exist in JSON (fields or presets)`,
				);
			}
		});

		it("should validate search results for multiple keywords using provider pattern", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Test each keyword from provider
			for (const testCase of searchKeywordProvider()) {
				// Get limited results (default limit: 100)
				const results = await searchTags(loader, testCase.keyword);

				// Verify all returned results exist in JSON (fields OR presets)
				for (const result of results) {
					let found = false;

					// Check in fields.json
					// Note: field.key might not be a simple conversion from map key
					// (e.g., "parking/side/parking" → "parking:both"), so we need to search by field.key
					for (const field of Object.values(fields)) {
						if (field.key === result.key && field.options && Array.isArray(field.options)) {
							if (field.options.includes(result.value)) {
								found = true;
								break;
							}
						}
					}

					// Check in presets (from provider)
					const tagId = `${result.key}=${result.value}`;
					if (!found && testCase.expectedTags.has(tagId)) {
						found = true;
					}

					assert.ok(
						found,
						`Search result "${tagId}" for keyword "${testCase.keyword}" should exist in JSON (fields or presets)`,
					);
				}

				// Note: We cannot verify that ALL expected tags are returned due to limit
				// But we verify that returned results are valid and within limit
				assert.ok(
					results.length <= 100,
					`Search for "${testCase.keyword}" should respect limit of 100`,
				);
			}
		});
	});
});
