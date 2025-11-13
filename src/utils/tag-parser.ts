/**
 * Parse tag input in various formats into a Record<string, string> object
 *
 * Supports three input formats:
 * 1. Text format: key=value pairs, one per line
 * 2. JSON string: valid JSON object with string values
 * 3. Object: JavaScript object with string values
 *
 * @param input - Tag input in text, JSON, or object format
 * @returns Parsed tags as Record<string, string>
 * @throws Error if input format is invalid
 */
export function parseTagInput(input: string | Record<string, unknown>): Record<string, string> {
	// Handle object input directly
	if (typeof input === "object" && input !== null) {
		return trimAndValidateObject(input);
	}

	// Handle string input
	if (typeof input === "string") {
		const trimmed = input.trim();
		// Try to parse as JSON first (objects or arrays)
		if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
			return parseJsonInput(input);
		}

		// Otherwise, parse as text format
		return parseTextInput(input);
	}

	throw new Error("Input must be a string or object");
}

/**
 * Parse text format input (key=value lines)
 *
 * @param input - Text input with key=value pairs, one per line
 * @returns Parsed tags
 * @throws Error if any line has invalid format
 */
function parseTextInput(input: string): Record<string, string> {
	const tags: Record<string, string> = {};

	// Normalize line endings and split into lines
	const lines = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

	for (let i = 0; i < lines.length; i++) {
		const lineValue = lines[i];
		if (lineValue === undefined) continue;
		const line = lineValue.trim();

		// Skip empty lines and comments
		if (line === "" || line.startsWith("#")) {
			continue;
		}

		// Find first = separator
		const separatorIndex = line.indexOf("=");
		if (separatorIndex === -1) {
			throw new Error(
				`Invalid tag format at line ${i + 1}: missing '=' separator. Expected format: key=value`,
			);
		}

		// Split only on first = to allow = in values
		const key = line.substring(0, separatorIndex).trim();
		const value = line.substring(separatorIndex + 1).trim();

		if (key === "") {
			throw new Error(`Invalid tag format at line ${i + 1}: empty key before '='`);
		}

		tags[key] = value;
	}

	return tags;
}

/**
 * Parse JSON format input
 *
 * @param input - JSON string
 * @returns Parsed tags
 * @throws Error if JSON is invalid or not an object with string values
 */
function parseJsonInput(input: string): Record<string, string> {
	let parsed: unknown;

	try {
		parsed = JSON.parse(input);
	} catch (error) {
		throw new Error(
			`Invalid JSON format: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Validate that parsed value is an object
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new Error("JSON input must be an object, not an array or primitive");
	}

	return trimAndValidateObject(parsed as Record<string, unknown>);
}

/**
 * Trim and validate object values
 *
 * @param obj - Object to validate
 * @returns Object with trimmed string values
 * @throws Error if any value is not a string
 */
function trimAndValidateObject(obj: Record<string, unknown>): Record<string, string> {
	const result: Record<string, string> = {};

	for (const [key, value] of Object.entries(obj)) {
		if (typeof value !== "string") {
			throw new Error(`All values must be strings. Found ${typeof value} for key "${key}"`);
		}
		result[key.trim()] = value.trim();
	}

	return result;
}
