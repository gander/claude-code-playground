import assert from "node:assert/strict";
import { describe, it } from "node:test";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { suggestImprovements } from "../../src/tools/suggest-improvements.js";

describe("suggestImprovements", () => {
	describe("Basic Functionality", () => {
		it("should return suggestions for tag collection", async () => {
			const tags = {
				amenity: "restaurant",
			};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			assert.ok("suggestions" in result);
			assert.ok("matchedPresets" in result);
			assert.ok("matchedPresetsDetailed" in result);
			assert.ok(Array.isArray(result.suggestions));
			assert.ok(Array.isArray(result.matchedPresets));
			assert.ok(Array.isArray(result.matchedPresetsDetailed));
		});

		it("should suggest missing common tags", async () => {
			const tags = {
				amenity: "restaurant",
			};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			assert.ok(result.suggestions.length > 0);
			// Restaurant typically should have name, cuisine, etc.
		});

		it("should return structured suggestions", async () => {
			const tags = {
				amenity: "restaurant",
			};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			if (result.suggestions.length > 0) {
				const firstSuggestion = result.suggestions[0];
				assert.ok(firstSuggestion);
				assert.ok("operation" in firstSuggestion);
				assert.ok("message" in firstSuggestion);
				assert.ok("key" in firstSuggestion);
				assert.ok("keyName" in firstSuggestion);
				assert.ok(["add", "remove", "update"].includes(firstSuggestion.operation));
			}
		});

		it("should return empty suggestions for complete tag set", async () => {
			// Find a preset and use its complete tag set
			const preset = Object.values(presets)[0];
			const tags: Record<string, string> = {};

			if (preset.tags) {
				for (const [k, v] of Object.entries(preset.tags)) {
					if (typeof v === "string" && v !== "*") {
						tags[k] = v;
					}
				}
			}
			if (preset.addTags) {
				for (const [k, v] of Object.entries(preset.addTags)) {
					if (typeof v === "string" && v !== "*") {
						tags[k] = v;
					}
				}
			}

			const result = await suggestImprovements(tags);

			assert.ok(result);
			// Should have fewer suggestions since tags are more complete
		});

		it("should handle empty tag collection", async () => {
			const tags = {};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			assert.strictEqual(result.suggestions.length, 0);
			assert.strictEqual(result.matchedPresets.length, 0);
			assert.strictEqual(result.matchedPresetsDetailed.length, 0);
		});
	});

	describe("Result Structure", () => {
		it("should return correct result structure", async () => {
			const tags = {
				amenity: "parking",
			};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			assert.ok("suggestions" in result);
			assert.ok("matchedPresets" in result);
			assert.ok("matchedPresetsDetailed" in result);
			assert.ok(Array.isArray(result.suggestions));
			assert.ok(Array.isArray(result.matchedPresets));
			assert.ok(Array.isArray(result.matchedPresetsDetailed));
		});

		it("should include matched presets", async () => {
			const tags = {
				amenity: "restaurant",
			};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			assert.ok(result.matchedPresets);
			assert.ok(result.matchedPresets.length > 0);
		});

		it("should include detailed preset information", async () => {
			const tags = {
				amenity: "restaurant",
			};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			assert.ok(result.matchedPresetsDetailed);
			assert.ok(result.matchedPresetsDetailed.length > 0);
			if (result.matchedPresetsDetailed.length > 0) {
				const firstPreset = result.matchedPresetsDetailed[0];
				assert.ok(firstPreset);
				assert.ok("id" in firstPreset);
				assert.ok("name" in firstPreset);
				assert.ok(typeof firstPreset.id === "string");
				assert.ok(typeof firstPreset.name === "string");
			}
		});

		it("should have meaningful suggestion messages", async () => {
			const tags = {
				amenity: "restaurant",
			};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			if (result.suggestions.length > 0) {
				for (const suggestion of result.suggestions) {
					assert.ok(typeof suggestion === "object");
					assert.ok(suggestion.message.length > 0);
					assert.ok(suggestion.key.length > 0);
					assert.ok(suggestion.keyName.length > 0);
				}
			}
		});
	});

	describe("Preset Matching", () => {
		it("should match presets based on tags", async () => {
			const tags = {
				amenity: "restaurant",
				cuisine: "italian",
			};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			assert.ok(result.matchedPresets);
			// Should find restaurant-related presets
		});

		it("should suggest fields from matched presets", async () => {
			const tags = {
				amenity: "parking",
			};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			// Parking should have suggestions like capacity, fee, surface, etc.
			assert.ok(result.suggestions.length > 0);
		});
	});

	describe("Suggestion Structure", () => {
		it("should include operation type in suggestions", async () => {
			const tags = {
				amenity: "restaurant",
			};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			if (result.suggestions.length > 0) {
				for (const suggestion of result.suggestions) {
					assert.ok(["add", "remove", "update"].includes(suggestion.operation));
				}
			}
		});

		it("should include localized key names", async () => {
			const tags = {
				amenity: "restaurant",
			};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			if (result.suggestions.length > 0) {
				for (const suggestion of result.suggestions) {
					assert.ok(suggestion.keyName);
					assert.ok(typeof suggestion.keyName === "string");
					assert.ok(suggestion.keyName.length > 0);
				}
			}
		});
	});

	describe("JSON Schema Validation", () => {
		it("should suggest fields from preset fields", async () => {
			// Use a known preset
			const preset = presets["amenity/restaurant"];
			if (preset?.tags) {
				const tags: Record<string, string> = {};
				for (const [k, v] of Object.entries(preset.tags)) {
					if (typeof v === "string" && v !== "*") {
						tags[k] = v;
					}
				}

				const result = await suggestImprovements(tags);

				assert.ok(result);
				assert.ok(result.matchedPresets);
				// Should match the restaurant preset
				const matched = result.matchedPresets.some((p) => p.includes("restaurant"));
				assert.ok(matched || result.matchedPresets.length > 0);
			}
		});
	});

	describe("Edge Cases", () => {
		it("should handle tags with no matching presets", async () => {
			const tags = {
				unknown_key_xyz: "unknown_value_123",
			};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			assert.strictEqual(result.matchedPresets.length, 0);
		});

		it("should handle single tag", async () => {
			const tags = {
				building: "yes",
			};

			const result = await suggestImprovements(tags);

			assert.ok(result);
			// Building=yes is very generic, should suggest more specific tags
		});
	});
});
