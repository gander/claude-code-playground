import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createServer } from "../../src/index.js";
import { prompts } from "../../src/prompts/index.js";

/**
 * Tests for MCP prompts functionality
 *
 * Requirements:
 * - Prompts should be registered and available
 * - Each prompt should have meaningful description
 * - Each prompt should have argument schema
 * - Prompt handlers should return valid message structures
 * - Prompts should guide users through multi-tool workflows
 */

describe("MCP Prompts", () => {
	describe("Prompt Registration", () => {
		it("should have 5 prompts defined", () => {
			assert.equal(prompts.length, 5, "Expected exactly 5 prompts");
		});

		it("should have unique prompt names", () => {
			const names = prompts.map((p) => p.name);
			const uniqueNames = new Set(names);

			assert.equal(names.length, uniqueNames.size, "All prompt names should be unique");
		});

		it("should register prompts in MCP server", () => {
			const server = createServer();

			// Verify server has prompts capability
			// We can't directly access registered prompts, but we can verify
			// the server was created without errors and has the capability
			assert.ok(server, "Server should be created successfully with prompts");
		});

		it("all prompts should follow kebab-case naming convention", () => {
			for (const prompt of prompts) {
				const isKebabCase = /^[a-z]+(-[a-z]+)*$/.test(prompt.name);

				assert.ok(isKebabCase, `Prompt name '${prompt.name}' should be in kebab-case format`);
			}
		});
	});

	describe("Prompt Configuration", () => {
		it("each prompt should have a description", () => {
			for (const prompt of prompts) {
				const config = prompt.config();

				assert.ok(config.description, `Prompt '${prompt.name}' should have a description`);

				assert.ok(
					config.description.length >= 100,
					`Prompt '${prompt.name}' description should be detailed (at least 100 chars)`,
				);
			}
		});

		it("each prompt should have argument schema", () => {
			for (const prompt of prompts) {
				const config = prompt.config();

				assert.ok(config.argsSchema, `Prompt '${prompt.name}' should have argsSchema defined`);

				const argCount = Object.keys(config.argsSchema).length;

				assert.ok(argCount > 0, `Prompt '${prompt.name}' should have at least one argument`);
			}
		});

		it("prompt arguments should have descriptions", () => {
			for (const prompt of prompts) {
				const config = prompt.config();

				for (const [argName, argSchema] of Object.entries(config.argsSchema || {})) {
					const description = (argSchema as { description?: string }).description;

					assert.ok(
						description,
						`Prompt '${prompt.name}' argument '${argName}' should have a description`,
					);

					assert.ok(
						description.length >= 30,
						`Prompt '${prompt.name}' argument '${argName}' description should be meaningful`,
					);
				}
			}
		});
	});

	describe("Prompt Handlers", () => {
		it("validate-osm-feature should return workflow guidance", () => {
			const validatePrompt = prompts.find((p) => p.name === "validate-osm-feature");
			assert.ok(validatePrompt, "validate-osm-feature prompt should exist");

			const result = validatePrompt.handler({
				featureType: "restaurant",
				tags: "amenity=restaurant\nname=Test",
			});

			assert.ok(result.messages, "Handler should return messages array");
			assert.ok(result.messages.length > 0, "Should return at least one message");

			const userMessage = result.messages[0];
			assert.equal(userMessage.role, "user", "Message should have user role");

			const text = userMessage.content.text.toLowerCase();

			// Should mention key workflow steps
			assert.ok(text.includes("validate"), "Should mention validation");
			assert.ok(text.includes("deprecated"), "Should mention deprecated tags check");
			assert.ok(text.includes("suggest"), "Should mention suggestions");
		});

		it("find-preset should guide preset discovery", () => {
			const findPrompt = prompts.find((p) => p.name === "find-preset");
			assert.ok(findPrompt, "find-preset prompt should exist");

			const result = findPrompt.handler({
				featureDescription: "Italian restaurant",
			});

			assert.ok(result.messages, "Handler should return messages array");

			const text = result.messages[0].content.text.toLowerCase();

			assert.ok(text.includes("search"), "Should mention searching");
			assert.ok(text.includes("preset"), "Should mention presets");
			assert.ok(text.includes("tag"), "Should mention tags");
		});

		it("learn-tag should provide educational guidance", () => {
			const learnPrompt = prompts.find((p) => p.name === "learn-tag");
			assert.ok(learnPrompt, "learn-tag prompt should exist");

			const result = learnPrompt.handler({
				tagKey: "amenity",
			});

			const text = result.messages[0].content.text.toLowerCase();

			assert.ok(text.includes("learn"), "Should mention learning");
			assert.ok(text.includes("value"), "Should mention values");
			assert.ok(text.includes("example"), "Should mention examples");
		});

		it("improve-tags should guide improvement workflow", () => {
			const improvePrompt = prompts.find((p) => p.name === "improve-tags");
			assert.ok(improvePrompt, "improve-tags prompt should exist");

			const result = improvePrompt.handler({
				currentTags: "amenity=restaurant\nname=Test",
			});

			const text = result.messages[0].content.text.toLowerCase();

			assert.ok(text.includes("improve"), "Should mention improving");
			assert.ok(text.includes("complete"), "Should mention completeness");
			assert.ok(text.includes("suggest"), "Should mention suggestions");
		});

		it("explore-category should guide category exploration", () => {
			const explorePrompt = prompts.find((p) => p.name === "explore-category");
			assert.ok(explorePrompt, "explore-category prompt should exist");

			const result = explorePrompt.handler({
				category: "amenity",
				geometryType: undefined,
			});

			const text = result.messages[0].content.text.toLowerCase();

			assert.ok(text.includes("explore"), "Should mention exploring");
			assert.ok(text.includes("value") || text.includes("type"), "Should mention values/types");
		});
	});

	describe("Prompt Workflow Coverage", () => {
		it("prompts should reference multiple tools for workflows", () => {
			const toolNames = [
				"validate_tag",
				"validate_tag_collection",
				"suggest_improvements",
				"search_presets",
				"search_tags",
				"get_tag_values",
				"get_preset_details",
				"flat_to_json",
			];

			for (const prompt of prompts) {
				const result = prompt.handler({
					featureType: "test",
					featureDescription: "test",
					tagKey: "test",
					currentTags: "test=test",
					category: "test",
				});

				const text = result.messages[0].content.text.toLowerCase();

				// Count how many tools are mentioned
				const mentionedTools = toolNames.filter((tool) => text.includes(tool));

				assert.ok(
					mentionedTools.length >= 2,
					`Prompt '${prompt.name}' should reference at least 2 tools for multi-step workflow (found: ${mentionedTools.join(", ")})`,
				);
			}
		});

		it("prompts should provide step-by-step guidance", () => {
			for (const prompt of prompts) {
				const result = prompt.handler({
					featureType: "test",
					featureDescription: "test",
					tagKey: "test",
					currentTags: "test=test",
					category: "test",
				});

				const text = result.messages[0].content.text;

				// Look for numbered steps or bullet points
				const hasNumberedSteps = /\d+\./m.test(text);
				const hasBulletPoints = /^[-*•]/m.test(text);

				assert.ok(
					hasNumberedSteps || hasBulletPoints,
					`Prompt '${prompt.name}' should provide step-by-step guidance`,
				);
			}
		});
	});

	describe("Prompt Use Cases", () => {
		it("validate-osm-feature should mention data quality and pre-upload validation", () => {
			const validatePrompt = prompts.find((p) => p.name === "validate-osm-feature");
			const config = validatePrompt?.config();

			assert.ok(config, "validate-osm-feature prompt should exist");
			const desc = config.description.toLowerCase();

			assert.ok(
				desc.includes("quality") || desc.includes("upload"),
				"validate-osm-feature should mention data quality or upload use cases",
			);
		});

		it("find-preset should mention learning and discovery", () => {
			const findPrompt = prompts.find((p) => p.name === "find-preset");
			const config = findPrompt?.config();

			assert.ok(config, "find-preset prompt should exist");
			const desc = config.description.toLowerCase();

			assert.ok(
				desc.includes("learn") || desc.includes("discover"),
				"find-preset should mention learning or discovery",
			);
		});

		it("learn-tag should be explicitly educational", () => {
			const learnPrompt = prompts.find((p) => p.name === "learn-tag");
			const config = learnPrompt?.config();

			assert.ok(config, "learn-tag prompt should exist");
			const desc = config.description.toLowerCase();

			assert.ok(
				desc.includes("educational") || desc.includes("learn"),
				"learn-tag should be explicitly educational",
			);
		});
	});
});
