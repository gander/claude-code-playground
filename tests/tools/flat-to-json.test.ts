import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { flatToJson } from "../../src/tools/flat-to-json.js";

describe("flatToJson", () => {
	describe("Basic Functionality", () => {
		it("should convert simple flat text to JSON object", () => {
			const input = "amenity=restaurant\nname=Test Restaurant";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				name: "Test Restaurant",
			});
		});

		it("should handle single tag", () => {
			const input = "building=yes";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, { building: "yes" });
		});

		it("should handle empty input", () => {
			const input = "";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, {});
		});

		it("should handle whitespace-only input", () => {
			const input = "   \n\n  \n  ";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, {});
		});
	});

	describe("Line Ending Handling", () => {
		it("should handle Unix line endings (LF)", () => {
			const input = "highway=primary\nname=Main Street";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				highway: "primary",
				name: "Main Street",
			});
		});

		it("should handle Windows line endings (CRLF)", () => {
			const input = "highway=primary\r\nname=Main Street";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				highway: "primary",
				name: "Main Street",
			});
		});

		it("should handle Mac line endings (CR)", () => {
			const input = "highway=primary\rname=Main Street";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				highway: "primary",
				name: "Main Street",
			});
		});

		it("should handle mixed line endings", () => {
			const input = "amenity=restaurant\r\nname=Test\nhighway=primary";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				name: "Test",
				highway: "primary",
			});
		});
	});

	describe("Whitespace Handling", () => {
		it("should trim whitespace from keys and values", () => {
			const input = "  amenity  =  restaurant  \n  name  =  Test  ";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				name: "Test",
			});
		});

		it("should skip empty lines", () => {
			const input = "amenity=restaurant\n\n\nname=Test\n\n";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				name: "Test",
			});
		});

		it("should skip comment lines starting with #", () => {
			const input = "# This is a comment\namenity=restaurant\n# Another comment\nname=Test";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				name: "Test",
			});
		});
	});

	describe("Special Characters", () => {
		it("should handle equals sign in values", () => {
			const input = "note=height=5m";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, { note: "height=5m" });
		});

		it("should handle multiple equals signs in values", () => {
			const input = "note=formula: a=b=c";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, { note: "formula: a=b=c" });
		});

		it("should handle special characters in values", () => {
			const input =
				"name=Restaurant & Bar\nwebsite=https://example.com/test?id=123\nemail=test@example.com";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				name: "Restaurant & Bar",
				website: "https://example.com/test?id=123",
				email: "test@example.com",
			});
		});

		it("should handle colons and slashes in keys", () => {
			const input = "internet_access:fee=no\naddr:street=Main Street\ncontact:phone=+1234567890";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				"internet_access:fee": "no",
				"addr:street": "Main Street",
				"contact:phone": "+1234567890",
			});
		});

		it("should handle Unicode characters", () => {
			const input = "name=Café René\nname:ja=カフェ";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				name: "Café René",
				"name:ja": "カフェ",
			});
		});
	});

	describe("Error Handling", () => {
		it("should throw error for lines without equals sign", () => {
			const input = "amenity=restaurant\ninvalid line without equals";

			assert.throws(
				() => flatToJson(input),
				(error: Error) => {
					assert.match(error.message, /missing '=' separator/i);
					assert.match(error.message, /line 2/i);
					return true;
				},
			);
		});

		it("should throw error for empty key", () => {
			const input = "=value";

			assert.throws(
				() => flatToJson(input),
				(error: Error) => {
					assert.match(error.message, /empty key/i);
					return true;
				},
			);
		});

		it("should throw error for whitespace-only key", () => {
			const input = "   =value";

			assert.throws(
				() => flatToJson(input),
				(error: Error) => {
					assert.match(error.message, /empty key/i);
					return true;
				},
			);
		});

		it("should throw error for empty values", () => {
			const input = "fixme=";

			assert.throws(
				() => flatToJson(input),
				(error: Error) => {
					assert.match(error.message, /value cannot be empty/i);
					assert.match(error.message, /fixme/i);
					return true;
				},
			);
		});

		it("should throw error for whitespace-only values", () => {
			const input = "note=   ";

			assert.throws(
				() => flatToJson(input),
				(error: Error) => {
					assert.match(error.message, /value cannot be empty/i);
					assert.match(error.message, /note/i);
					return true;
				},
			);
		});
	});

	describe("Duplicate Keys", () => {
		it("should use last value for duplicate keys", () => {
			const input = "name=First\nname=Second\nname=Third";
			const result = flatToJson(input);

			assert.deepStrictEqual(result, { name: "Third" });
		});
	});

	describe("Real World OSM Tags", () => {
		it("should convert restaurant tags", () => {
			const input = `amenity=restaurant
name=Pizza House
cuisine=pizza
opening_hours=Mo-Su 10:00-22:00
wheelchair=yes`;

			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				name: "Pizza House",
				cuisine: "pizza",
				opening_hours: "Mo-Su 10:00-22:00",
				wheelchair: "yes",
			});
		});

		it("should convert building with address tags", () => {
			const input = `building=residential
addr:housenumber=123
addr:street=Main Street
addr:city=Springfield
addr:postcode=12345`;

			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				building: "residential",
				"addr:housenumber": "123",
				"addr:street": "Main Street",
				"addr:city": "Springfield",
				"addr:postcode": "12345",
			});
		});

		it("should convert highway tags", () => {
			const input = `highway=primary
name=Route 66
ref=US 66
maxspeed=55 mph
lanes=2
surface=asphalt`;

			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				highway: "primary",
				name: "Route 66",
				ref: "US 66",
				maxspeed: "55 mph",
				lanes: "2",
				surface: "asphalt",
			});
		});

		it("should handle complex real-world example with comments", () => {
			const input = `# Restaurant in downtown
amenity=restaurant
name=Bella Italia
cuisine=italian
# Contact information
contact:phone=+1-555-0123
contact:website=https://bella-italia.example.com
# Accessibility
wheelchair=yes
wheelchair:description=Ramp at main entrance`;

			const result = flatToJson(input);

			assert.deepStrictEqual(result, {
				amenity: "restaurant",
				name: "Bella Italia",
				cuisine: "italian",
				"contact:phone": "+1-555-0123",
				"contact:website": "https://bella-italia.example.com",
				wheelchair: "yes",
				"wheelchair:description": "Ramp at main entrance",
			});
		});
	});
});
