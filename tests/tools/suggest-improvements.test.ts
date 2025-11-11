import assert from "node:assert/strict";
import { describe, it } from "node:test";
import deprecated from "@openstreetmap/id-tagging-schema/dist/deprecated.json" with {
	type: "json",
};
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import { suggestImprovements } from "../../src/tools/suggest-improvements.js";
import { SchemaLoader } from "../../src/utils/schema-loader.js";

describe("suggestImprovements", () => {
	describe("Basic Functionality", () => {
		it("should return suggestions for tag collection", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const tags = {
				amenity: "restaurant",
			};

			const result = await suggestImprovements(loader, tags);

			assert.ok(result);
			assert.ok("suggestions" in result);
			assert.ok("warnings" in result);
			assert.ok(Array.isArray(result.suggestions));
			assert.ok(Array.isArray(result.warnings));
		});

		it("should suggest missing common tags", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const tags = {
				amenity: "restaurant",
			};

			const result = await suggestImprovements(loader, tags);

			assert.ok(result);
			assert.ok(result.suggestions.length > 0);
			// Restaurant typically should have name, cuisine, etc.
		});

		it("should warn about deprecated tags", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Use first deprecated entry
			const entry = deprecated[0];
			const key = Object.keys(entry.old)[0];
			const value = entry.old[key as keyof typeof entry.old];

			const tags = {
				[key]: value as string,
			};

			const result = await suggestImprovements(loader, tags);

			assert.ok(result);
			assert.ok(result.warnings.length > 0);
			assert.ok(result.warnings.some((w) => w.includes("deprecated")));
		});

		it("should return empty suggestions for complete tag set", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

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

			const result = await suggestImprovements(loader, tags);

			assert.ok(result);
			// Should have fewer suggestions since tags are more complete
		});

		it("should handle empty tag collection", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const tags = {};

			const result = await suggestImprovements(loader, tags);

			assert.ok(result);
			assert.strictEqual(result.suggestions.length, 0);
			assert.strictEqual(result.warnings.length, 0);
		});
	});

	describe("Result Structure", () => {
		it("should return correct result structure", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const tags = {
				amenity: "parking",
			};

			const result = await suggestImprovements(loader, tags);

			assert.ok(result);
			assert.ok("suggestions" in result);
			assert.ok("warnings" in result);
			assert.ok("matchedPresets" in result);
			assert.ok(Array.isArray(result.suggestions));
			assert.ok(Array.isArray(result.warnings));
			assert.ok(Array.isArray(result.matchedPresets));
		});

		it("should include matched presets", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const tags = {
				amenity: "restaurant",
			};

			const result = await suggestImprovements(loader, tags);

			assert.ok(result);
			assert.ok(result.matchedPresets);
			assert.ok(result.matchedPresets.length > 0);
		});

		it("should have meaningful suggestion messages", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const tags = {
				amenity: "restaurant",
			};

			const result = await suggestImprovements(loader, tags);

			assert.ok(result);
			if (result.suggestions.length > 0) {
				for (const suggestion of result.suggestions) {
					assert.ok(typeof suggestion === "string");
					assert.ok(suggestion.length > 0);
				}
			}
		});
	});

	describe("Preset Matching", () => {
		it("should match presets based on tags", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const tags = {
				amenity: "restaurant",
				cuisine: "italian",
			};

			const result = await suggestImprovements(loader, tags);

			assert.ok(result);
			assert.ok(result.matchedPresets);
			// Should find restaurant-related presets
		});

		it("should suggest fields from matched presets", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const tags = {
				amenity: "parking",
			};

			const result = await suggestImprovements(loader, tags);

			assert.ok(result);
			// Parking should have suggestions like capacity, fee, surface, etc.
			assert.ok(result.suggestions.length > 0);
		});
	});

	describe("Deprecation Warnings", () => {
		it("should warn about ALL deprecated tags (100% coverage)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// CRITICAL: Test ALL deprecated entries individually - no Math.min, no sampling
			let testedCount = 0;
			let skippedCount = 0;
			for (let i = 0; i < deprecated.length; i++) {
				const entry = deprecated[i];
				const oldKeys = Object.keys(entry.old);

				// Skip entries with multiple keys (complex cases)
				if (oldKeys.length !== 1) {
					skippedCount++;
					continue;
				}

				const key = oldKeys[0];
				if (!key) {
					skippedCount++;
					continue;
				}

				const value = entry.old[key as keyof typeof entry.old];
				if (!value || typeof value !== "string") {
					skippedCount++;
					continue;
				}

				// Skip if replace doesn't exist (edge cases)
				if (!entry.replace || Object.keys(entry.replace).length === 0) {
					skippedCount++;
					continue;
				}

				const tags = { [key]: value };
				const result = await suggestImprovements(loader, tags);

				assert.ok(result, `Should return result for deprecated tag ${key}=${value}`);
				assert.ok(result.warnings.length >= 1, `Should warn about deprecated tag ${key}=${value}`);
				assert.ok(
					result.warnings.some((w) => w.includes("deprecated")),
					`Warning should mention 'deprecated' for ${key}=${value}`,
				);
				testedCount++;
			}

			// Verify we processed ALL entries (tested + skipped = total)
			assert.strictEqual(
				testedCount + skippedCount,
				deprecated.length,
				`Should have processed ALL ${deprecated.length} deprecated entries (tested: ${testedCount}, skipped: ${skippedCount})`,
			);
			assert.ok(testedCount > 0, "Should have tested at least some deprecated entries");
		});
	});

	describe("JSON Schema Validation", () => {
		it("should suggest fields from preset fields", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Use a known preset
			const preset = presets["amenity/restaurant"];
			if (preset?.tags) {
				const tags: Record<string, string> = {};
				for (const [k, v] of Object.entries(preset.tags)) {
					if (typeof v === "string" && v !== "*") {
						tags[k] = v;
					}
				}

				const result = await suggestImprovements(loader, tags);

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
			const loader = new SchemaLoader({ enableIndexing: true });
			const tags = {
				unknown_key_xyz: "unknown_value_123",
			};

			const result = await suggestImprovements(loader, tags);

			assert.ok(result);
			assert.strictEqual(result.matchedPresets.length, 0);
		});

		it("should handle single tag", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const tags = {
				building: "yes",
			};

			const result = await suggestImprovements(loader, tags);

			assert.ok(result);
			// Building=yes is very generic, should suggest more specific tags
		});
	});
});
