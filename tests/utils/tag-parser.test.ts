import assert from "node:assert";
import { describe, it } from "node:test";
import { parseTagInput } from "../../src/utils/tag-parser.js";

describe("parseTagInput", () => {
	describe("Text Format Parsing", () => {
		it("should parse single line key=value format", () => {
			const input = "amenity=restaurant";
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, { amenity: "restaurant" });
		});

		it("should parse multiple lines", () => {
			const input = `amenity=restaurant
cuisine=pizza
indoor_seating=yes`;
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				cuisine: "pizza",
				indoor_seating: "yes",
			});
		});

		it("should trim whitespace from keys and values", () => {
			const input = `  amenity  =  restaurant
  cuisine=pizza`;
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				cuisine: "pizza",
			});
		});

		it("should ignore empty lines", () => {
			const input = `amenity=restaurant

cuisine=pizza`;
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				cuisine: "pizza",
			});
		});

		it("should ignore lines starting with # (comments)", () => {
			const input = `# This is a comment
amenity=restaurant
# Another comment
cuisine=pizza`;
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				cuisine: "pizza",
			});
		});

		it("should handle values with = signs (split only on first =)", () => {
			const input = "opening_hours=Mo-Fr 08:00-18:00; Sa 09:00=14:00";
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				opening_hours: "Mo-Fr 08:00-18:00; Sa 09:00=14:00",
			});
		});

		it("should handle empty values", () => {
			const input = "amenity=";
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, { amenity: "" });
		});

		it("should throw error for lines without = separator", () => {
			const input = `amenity=restaurant
invalid_line_without_equals
cuisine=pizza`;
			assert.throws(() => parseTagInput(input), {
				message: /Invalid tag format at line 2/,
			});
		});

		it("should return empty object for empty input", () => {
			const result = parseTagInput("");
			assert.deepStrictEqual(result, {});
		});

		it("should return empty object for input with only comments and whitespace", () => {
			const input = `# Comment only

# Another comment`;
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {});
		});

		it("should handle Windows line endings (CRLF)", () => {
			const input = "amenity=restaurant\r\ncuisine=pizza\r\nname=Test";
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				cuisine: "pizza",
				name: "Test",
			});
		});

		it("should handle mixed line endings", () => {
			const input = "amenity=restaurant\ncuisine=pizza\r\nname=Test";
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				cuisine: "pizza",
				name: "Test",
			});
		});
	});

	describe("JSON Format Parsing", () => {
		it("should parse valid JSON object", () => {
			const input = '{"amenity": "restaurant", "cuisine": "pizza"}';
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				cuisine: "pizza",
			});
		});

		it("should parse pretty-printed JSON", () => {
			const input = `{
  "amenity": "restaurant",
  "cuisine": "pizza"
}`;
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				cuisine: "pizza",
			});
		});

		it("should trim whitespace from JSON values", () => {
			const input = '{"amenity": "  restaurant  ", "cuisine": "  pizza  "}';
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				cuisine: "pizza",
			});
		});

		it("should throw error for invalid JSON", () => {
			const input = '{"amenity": "restaurant"'; // Missing closing brace
			assert.throws(() => parseTagInput(input), {
				message: /Invalid JSON format/,
			});
		});

		it("should throw error for JSON array", () => {
			const input = '["amenity", "restaurant"]';
			assert.throws(() => parseTagInput(input), {
				message: /must be an object/,
			});
		});

		it("should throw error for JSON with non-string values", () => {
			const input = '{"amenity": "restaurant", "capacity": 50}';
			assert.throws(() => parseTagInput(input), {
				message: /All values must be strings/,
			});
		});
	});

	describe("Object Format Handling", () => {
		it("should handle JavaScript object input directly", () => {
			const input = { amenity: "restaurant", cuisine: "pizza" };
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				cuisine: "pizza",
			});
		});

		it("should trim whitespace from object values", () => {
			const input = { amenity: "  restaurant  ", cuisine: "  pizza  " };
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				cuisine: "pizza",
			});
		});

		it("should throw error for object with non-string values", () => {
			const input = { amenity: "restaurant", capacity: 50 };
			assert.throws(() => parseTagInput(input as Record<string, unknown>), {
				message: /All values must be strings/,
			});
		});
	});

	describe("Edge Cases", () => {
		it("should handle tag keys with colons", () => {
			const input = "toilets:wheelchair=yes";
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, { "toilets:wheelchair": "yes" });
		});

		it("should handle tag keys with underscores", () => {
			const input = "indoor_seating=yes";
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, { indoor_seating: "yes" });
		});

		it("should handle numeric-looking values as strings", () => {
			const input = `maxspeed=50
layer=2`;
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				maxspeed: "50",
				layer: "2",
			});
		});

		it("should handle special characters in values", () => {
			const input = 'name=Café "Le Bistro" & Bar';
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, {
				name: 'Café "Le Bistro" & Bar',
			});
		});

		it("should handle duplicate keys (last value wins)", () => {
			const input = `amenity=restaurant
amenity=cafe`;
			const result = parseTagInput(input);
			assert.deepStrictEqual(result, { amenity: "cafe" });
		});
	});
});
