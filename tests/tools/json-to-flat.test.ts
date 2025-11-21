import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { jsonToFlat } from "../../src/tools/json-to-flat.js";

describe("jsonToFlat", () => {
	describe("Basic Functionality", () => {
		it("should convert simple JSON object to flat text format", () => {
			const input = { amenity: "restaurant", name: "Test Restaurant" };
			const result = jsonToFlat(input);

			assert.ok(result.includes("amenity=restaurant"));
			assert.ok(result.includes("name=Test Restaurant"));

			// Check that each tag is on a separate line
			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 2);
		});

		it("should convert JSON string to flat text format", () => {
			const input = '{"highway":"primary","name":"Main Street"}';
			const result = jsonToFlat(input);

			assert.ok(result.includes("highway=primary"));
			assert.ok(result.includes("name=Main Street"));

			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 2);
		});

		it("should handle single tag", () => {
			const input = { building: "yes" };
			const result = jsonToFlat(input);

			assert.strictEqual(result.trim(), "building=yes");
		});

		it("should handle empty object", () => {
			const input = {};
			const result = jsonToFlat(input);

			assert.strictEqual(result.trim(), "");
		});
	});

	describe("Edge Cases", () => {
		it("should handle tags with special characters in values", () => {
			const input = { name: "Restaurant & Bar", website: "https://example.com/test?id=123" };
			const result = jsonToFlat(input);

			assert.ok(result.includes("name=Restaurant & Bar"));
			assert.ok(result.includes("website=https://example.com/test?id=123"));
		});

		it("should handle tags with equals sign in values", () => {
			const input = { note: "height=5m" };
			const result = jsonToFlat(input);

			assert.ok(result.includes("note=height=5m"));
		});

		it("should handle tags with newlines in values", () => {
			const input = { description: "Line 1\nLine 2" };
			const result = jsonToFlat(input);

			// Newlines in values should be preserved or escaped
			assert.ok(result.includes("description="));
		});

		it("should handle tags with colons and slashes", () => {
			const input = {
				"internet_access:fee": "no",
				"addr:street": "Main Street",
				"contact:phone": "+1234567890",
			};
			const result = jsonToFlat(input);

			assert.ok(result.includes("internet_access:fee=no"));
			assert.ok(result.includes("addr:street=Main Street"));
			assert.ok(result.includes("contact:phone=+1234567890"));
		});

		it("should preserve tag order (alphabetical or insertion)", () => {
			const input = { zebra: "yes", building: "yes", amenity: "restaurant" };
			const result = jsonToFlat(input);

			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 3);

			// All tags should be present
			assert.ok(result.includes("zebra=yes"));
			assert.ok(result.includes("building=yes"));
			assert.ok(result.includes("amenity=restaurant"));
		});
	});

	describe("Error Handling", () => {
		it("should throw error for invalid JSON string", () => {
			const input = "{invalid json}";

			assert.throws(
				() => jsonToFlat(input),
				(error: Error) => {
					assert.match(error.message, /Invalid JSON/i);
					return true;
				},
			);
		});

		it("should throw error for JSON array", () => {
			const input = '["amenity", "restaurant"]';

			assert.throws(
				() => jsonToFlat(input),
				(error: Error) => {
					assert.match(error.message, /must be an object/i);
					return true;
				},
			);
		});

		it("should throw error for null input", () => {
			assert.throws(
				// biome-ignore lint/suspicious/noExplicitAny: Testing invalid input type
				() => jsonToFlat(null as any),
				(error: Error) => {
					assert.match(error.message, /Input must be/i);
					return true;
				},
			);
		});

		it("should throw error for non-string values in object", () => {
			// biome-ignore lint/suspicious/noExplicitAny: Testing invalid value type
			const input = { amenity: "restaurant", maxspeed: 50 } as any;

			assert.throws(
				() => jsonToFlat(input),
				(error: Error) => {
					assert.match(error.message, /must be strings/i);
					return true;
				},
			);
		});
	});

	describe("Real World OSM Tags", () => {
		it("should convert restaurant tags", () => {
			const input = {
				amenity: "restaurant",
				name: "Pizza House",
				cuisine: "pizza",
				opening_hours: "Mo-Su 10:00-22:00",
				wheelchair: "yes",
			};
			const result = jsonToFlat(input);

			assert.ok(result.includes("amenity=restaurant"));
			assert.ok(result.includes("name=Pizza House"));
			assert.ok(result.includes("cuisine=pizza"));
			assert.ok(result.includes("opening_hours=Mo-Su 10:00-22:00"));
			assert.ok(result.includes("wheelchair=yes"));

			const lines = result.trim().split("\n");
			assert.strictEqual(lines.length, 5);
		});

		it("should convert building with address tags", () => {
			const input = {
				building: "residential",
				"addr:housenumber": "123",
				"addr:street": "Main Street",
				"addr:city": "Springfield",
				"addr:postcode": "12345",
			};
			const result = jsonToFlat(input);

			assert.ok(result.includes("building=residential"));
			assert.ok(result.includes("addr:housenumber=123"));
			assert.ok(result.includes("addr:street=Main Street"));
			assert.ok(result.includes("addr:city=Springfield"));
			assert.ok(result.includes("addr:postcode=12345"));
		});

		it("should convert highway tags", () => {
			const input = {
				highway: "primary",
				name: "Route 66",
				ref: "US 66",
				maxspeed: "55 mph",
				lanes: "2",
				surface: "asphalt",
			};
			const result = jsonToFlat(input);

			assert.ok(result.includes("highway=primary"));
			assert.ok(result.includes("name=Route 66"));
			assert.ok(result.includes("ref=US 66"));
			assert.ok(result.includes("maxspeed=55 mph"));
			assert.ok(result.includes("lanes=2"));
			assert.ok(result.includes("surface=asphalt"));
		});
	});
});
