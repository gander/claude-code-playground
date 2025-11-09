import { describe, it } from "node:test";
import assert from "node:assert";
import { getPresetTags } from "../../src/tools/get-preset-tags.ts";
import { SchemaLoader } from "../../src/utils/schema-loader.ts";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };

describe("get_preset_tags", () => {
	describe("Basic Functionality", () => {
		it("should return tags for a valid preset ID", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await getPresetTags(loader, "amenity/restaurant");

			assert.ok(result, "Should return a result");
			assert.ok(result.tags, "Should have tags property");
			assert.strictEqual(typeof result.tags, "object");
		});

		it("should return the correct identifying tags", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await getPresetTags(loader, "amenity/restaurant");

			assert.ok(result.tags);
			assert.strictEqual(result.tags.amenity, "restaurant");
		});

		it("should include addTags if present in preset", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Find a preset with addTags
			let presetWithAddTags: string | null = null;
			for (const [id, preset] of Object.entries(presets)) {
				if (preset.addTags && Object.keys(preset.addTags).length > 0) {
					presetWithAddTags = id;
					break;
				}
			}

			if (presetWithAddTags) {
				const result = await getPresetTags(loader, presetWithAddTags);
				assert.ok(result.addTags, "Should have addTags for preset with addTags");
				assert.strictEqual(typeof result.addTags, "object");
			}
		});

		it("should not include addTags if not present in preset", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await getPresetTags(loader, "amenity/restaurant");

			const preset = presets["amenity/restaurant"];
			if (!preset.addTags || Object.keys(preset.addTags).length === 0) {
				assert.ok(
					!result.addTags || Object.keys(result.addTags).length === 0,
					"Should not have addTags if preset doesn't have them",
				);
			}
		});

		it("should throw error for non-existent preset", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			await assert.rejects(
				async () => {
					await getPresetTags(loader, "nonexistent/preset");
				},
				{
					message: /Preset .* not found/,
				},
			);
		});

		it("should use cached data on subsequent calls", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const result1 = await getPresetTags(loader, "amenity/cafe");
			const result2 = await getPresetTags(loader, "amenity/cafe");

			assert.deepStrictEqual(result1, result2, "Results should be identical from cache");
		});
	});

	describe("JSON Schema Validation", () => {
		it("should return tags matching JSON data exactly", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await getPresetTags(loader, "amenity/restaurant");

			const expected = presets["amenity/restaurant"];
			assert.ok(expected, "Preset should exist in JSON");

			// Verify tags match
			assert.deepStrictEqual(result.tags, expected.tags);

			// Verify addTags match (if present)
			if (expected.addTags && Object.keys(expected.addTags).length > 0) {
				assert.deepStrictEqual(result.addTags, expected.addTags);
			}
		});

		it("should validate tags for ALL presets via provider pattern (100% coverage)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// CRITICAL: Test EVERY preset from JSON, not a sample
			const allPresetIds = Object.keys(presets);
			assert.ok(allPresetIds.length > 1500, "Should have all presets from JSON");

			// Provider pattern: iterate through EVERY preset
			for (const presetId of allPresetIds) {
				const result = await getPresetTags(loader, presetId);
				const expected = presets[presetId];

				assert.ok(expected, `Preset ${presetId} should exist in JSON`);

				// Verify tags match EXACTLY
				assert.deepStrictEqual(
					result.tags,
					expected.tags,
					`Tags for ${presetId} should match JSON`,
				);

				// Verify addTags match EXACTLY (if present)
				if (expected.addTags && Object.keys(expected.addTags).length > 0) {
					assert.deepStrictEqual(
						result.addTags,
						expected.addTags,
						`AddTags for ${presetId} should match JSON`,
					);
				} else {
					assert.ok(
						!result.addTags || Object.keys(result.addTags).length === 0,
						`Preset ${presetId} should not have addTags`,
					);
				}
			}
		});

		it("should return tags as key-value pairs", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await getPresetTags(loader, "amenity/restaurant");

			assert.ok(result.tags);
			assert.strictEqual(typeof result.tags, "object");

			// Verify each tag is a string key-value pair
			for (const [key, value] of Object.entries(result.tags)) {
				assert.strictEqual(typeof key, "string", "Tag key should be a string");
				assert.strictEqual(typeof value, "string", "Tag value should be a string");
			}
		});
	});
});
