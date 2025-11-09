import { describe, it } from "node:test";
import assert from "node:assert";
import { getPresetDetails } from "../../src/tools/get-preset-details.ts";
import { SchemaLoader } from "../../src/utils/schema-loader.ts";
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };

describe("get_preset_details", () => {
	describe("Basic Functionality", () => {
		it("should return complete preset details for a valid preset ID", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await getPresetDetails(loader, "amenity/restaurant");

			assert.ok(result, "Should return a result");
			assert.strictEqual(result.id, "amenity/restaurant");
			assert.ok(result.tags, "Should have tags property");
			assert.ok(result.geometry, "Should have geometry property");
		});

		it("should return all required properties", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await getPresetDetails(loader, "amenity/restaurant");

			// Required properties
			assert.strictEqual(typeof result.id, "string");
			assert.strictEqual(typeof result.tags, "object");
			assert.ok(Array.isArray(result.geometry));

			// Optional properties (if present in preset)
			if (result.fields) {
				assert.ok(Array.isArray(result.fields));
			}
			if (result.moreFields) {
				assert.ok(Array.isArray(result.moreFields));
			}
			if (result.icon) {
				assert.strictEqual(typeof result.icon, "string");
			}
			if (result.name) {
				assert.strictEqual(typeof result.name, "string");
			}
		});

		it("should return tags object with correct structure", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await getPresetDetails(loader, "amenity/restaurant");

			assert.ok(result.tags);
			assert.strictEqual(typeof result.tags, "object");
			assert.strictEqual(result.tags.amenity, "restaurant");
		});

		it("should return geometry array", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await getPresetDetails(loader, "amenity/restaurant");

			assert.ok(Array.isArray(result.geometry));
			assert.ok(result.geometry.length > 0, "Should have at least one geometry type");
		});

		it("should return fields array for presets with fields", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await getPresetDetails(loader, "amenity/restaurant");

			assert.ok(result.fields, "Restaurant preset should have fields");
			assert.ok(Array.isArray(result.fields));
			assert.ok(result.fields.length > 0);
		});

		it("should throw error for non-existent preset", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			await assert.rejects(
				async () => {
					await getPresetDetails(loader, "nonexistent/preset");
				},
				{
					message: /Preset .* not found/,
				},
			);
		});

		it("should use cached data on subsequent calls", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			const result1 = await getPresetDetails(loader, "amenity/cafe");
			const result2 = await getPresetDetails(loader, "amenity/cafe");

			assert.deepStrictEqual(result1, result2, "Results should be identical from cache");
		});
	});

	describe("JSON Schema Validation", () => {
		it("should return preset details matching JSON data exactly", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });
			const result = await getPresetDetails(loader, "amenity/restaurant");

			const expected = presets["amenity/restaurant"];
			assert.ok(expected, "Preset should exist in JSON");

			// Verify tags match
			assert.deepStrictEqual(result.tags, expected.tags);

			// Verify geometry matches
			assert.deepStrictEqual(result.geometry, expected.geometry);

			// Verify fields match (if present)
			if (expected.fields) {
				assert.deepStrictEqual(result.fields, expected.fields);
			}

			// Verify moreFields match (if present)
			if (expected.moreFields) {
				assert.deepStrictEqual(result.moreFields, expected.moreFields);
			}

			// Verify icon matches (if present)
			if (expected.icon) {
				assert.strictEqual(result.icon, expected.icon);
			}

			// Verify name matches (if present)
			if (expected.name) {
				assert.strictEqual(result.name, expected.name);
			}
		});

		it("should validate ALL preset details via provider pattern (sample-based)", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Test a representative sample of presets
			const samplePresets = [
				"amenity/restaurant",
				"amenity/cafe",
				"building/house",
				"highway/residential",
				"natural/tree",
				"shop/supermarket",
				"amenity/parking",
				"building/commercial",
			];

			for (const presetId of samplePresets) {
				const result = await getPresetDetails(loader, presetId);
				const expected = presets[presetId];

				assert.ok(expected, `Preset ${presetId} should exist in JSON`);
				assert.strictEqual(result.id, presetId);
				assert.deepStrictEqual(result.tags, expected.tags);
				assert.deepStrictEqual(result.geometry, expected.geometry);

				// Verify optional fields match
				if (expected.fields !== undefined) {
					assert.deepStrictEqual(result.fields, expected.fields);
				}
				if (expected.moreFields !== undefined) {
					assert.deepStrictEqual(result.moreFields, expected.moreFields);
				}
				if (expected.icon !== undefined) {
					assert.strictEqual(result.icon, expected.icon);
				}
				if (expected.name !== undefined) {
					assert.strictEqual(result.name, expected.name);
				}
			}
		});

		it("should handle presets without optional fields", async () => {
			const loader = new SchemaLoader({ enableIndexing: true });

			// Find a preset without fields (if any exist)
			let presetWithoutFields: string | null = null;
			for (const [id, preset] of Object.entries(presets)) {
				if (!preset.fields) {
					presetWithoutFields = id;
					break;
				}
			}

			if (presetWithoutFields) {
				const result = await getPresetDetails(loader, presetWithoutFields);
				assert.ok(result);
				assert.strictEqual(result.id, presetWithoutFields);
				// fields should be undefined or not present
				assert.ok(!result.fields || result.fields.length === 0);
			}
		});
	});
});
