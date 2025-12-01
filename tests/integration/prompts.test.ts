import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { prompts } from "../../src/prompts/index.js";

/**
 * Integration tests for MCP prompts
 *
 * Requirements:
 * - Server should advertise prompts capability
 * - Server should list all registered prompts
 * - Server should return prompt details correctly
 * - Server should execute prompts and return messages
 */

describe("Prompts Integration", () => {
	describe("Prompts Capability", () => {
		it("should advertise prompts capability in server info", async () => {
			const client = new Client(
				{
					name: "test-client",
					version: "1.0.0",
				},
				{
					capabilities: {},
				},
			);

			const transport = new StdioClientTransport({
				command: "node",
				args: ["dist/index.js"],
				env: {
					...process.env,
					LOG_LEVEL: "error",
				},
			});

			await client.connect(transport);

			try {
				// Server info should include prompts capability
				const serverCapabilities = (client as { _serverCapabilities?: { prompts?: unknown } })
					._serverCapabilities;

				assert.ok(
					serverCapabilities?.prompts !== undefined,
					"Server should advertise prompts capability",
				);
			} finally {
				await client.close();
			}
		});
	});

	describe("List Prompts", () => {
		it("should list all registered prompts", async () => {
			const client = new Client(
				{
					name: "test-client",
					version: "1.0.0",
				},
				{
					capabilities: {},
				},
			);

			const transport = new StdioClientTransport({
				command: "node",
				args: ["dist/index.js"],
				env: {
					...process.env,
					LOG_LEVEL: "error",
				},
			});

			await client.connect(transport);

			try {
				const result = await client.listPrompts();

				assert.ok(result.prompts, "Should return prompts list");
				assert.equal(
					result.prompts.length,
					prompts.length,
					`Should have ${prompts.length} prompts registered`,
				);

				// Verify all expected prompts are present
				const expectedNames = [
					"validate-osm-feature",
					"find-preset",
					"learn-tag",
					"improve-tags",
					"explore-category",
				];

				for (const name of expectedNames) {
					const found = result.prompts.find((p) => p.name === name);
					assert.ok(found, `Prompt '${name}' should be in the list`);
				}
			} finally {
				await client.close();
			}
		});

		it("each listed prompt should have description", async () => {
			const client = new Client(
				{
					name: "test-client",
					version: "1.0.0",
				},
				{
					capabilities: {},
				},
			);

			const transport = new StdioClientTransport({
				command: "node",
				args: ["dist/index.js"],
				env: {
					...process.env,
					LOG_LEVEL: "error",
				},
			});

			await client.connect(transport);

			try {
				const result = await client.listPrompts();

				for (const prompt of result.prompts) {
					assert.ok(prompt.description, `Prompt '${prompt.name}' should have a description`);

					assert.ok(
						prompt.description.length >= 50,
						`Prompt '${prompt.name}' description should be meaningful`,
					);
				}
			} finally {
				await client.close();
			}
		});
	});

	describe("Get Prompt", () => {
		it("should return prompt messages for validate-osm-feature", async () => {
			const client = new Client(
				{
					name: "test-client",
					version: "1.0.0",
				},
				{
					capabilities: {},
				},
			);

			const transport = new StdioClientTransport({
				command: "node",
				args: ["dist/index.js"],
				env: {
					...process.env,
					LOG_LEVEL: "error",
				},
			});

			await client.connect(transport);

			try {
				const result = await client.getPrompt({
					name: "validate-osm-feature",
					arguments: {
						featureType: "restaurant",
						tags: "amenity=restaurant\nname=Test Cafe",
					},
				});

				assert.ok(result.messages, "Should return messages");
				assert.ok(result.messages.length > 0, "Should have at least one message");

				const message = result.messages[0];
				assert.equal(message.role, "user", "Message should have user role");
				assert.ok(message.content.type === "text", "Message content should be text type");
			} finally {
				await client.close();
			}
		});

		it("should return prompt messages for find-preset", async () => {
			const client = new Client(
				{
					name: "test-client",
					version: "1.0.0",
				},
				{
					capabilities: {},
				},
			);

			const transport = new StdioClientTransport({
				command: "node",
				args: ["dist/index.js"],
				env: {
					...process.env,
					LOG_LEVEL: "error",
				},
			});

			await client.connect(transport);

			try {
				const result = await client.getPrompt({
					name: "find-preset",
					arguments: {
						featureDescription: "coffee shop",
					},
				});

				assert.ok(result.messages, "Should return messages");
				assert.ok(result.messages.length > 0, "Should have at least one message");
			} finally {
				await client.close();
			}
		});

		it("should return prompt messages for learn-tag", async () => {
			const client = new Client(
				{
					name: "test-client",
					version: "1.0.0",
				},
				{
					capabilities: {},
				},
			);

			const transport = new StdioClientTransport({
				command: "node",
				args: ["dist/index.js"],
				env: {
					...process.env,
					LOG_LEVEL: "error",
				},
			});

			await client.connect(transport);

			try {
				const result = await client.getPrompt({
					name: "learn-tag",
					arguments: {
						tagKey: "amenity",
					},
				});

				assert.ok(result.messages, "Should return messages");

				const text = (result.messages[0].content as { text: string }).text.toLowerCase();
				assert.ok(text.includes("amenity"), "Message should include the tag key");
			} finally {
				await client.close();
			}
		});

		it("should return prompt messages for improve-tags", async () => {
			const client = new Client(
				{
					name: "test-client",
					version: "1.0.0",
				},
				{
					capabilities: {},
				},
			);

			const transport = new StdioClientTransport({
				command: "node",
				args: ["dist/index.js"],
				env: {
					...process.env,
					LOG_LEVEL: "error",
				},
			});

			await client.connect(transport);

			try {
				const result = await client.getPrompt({
					name: "improve-tags",
					arguments: {
						currentTags: "amenity=restaurant",
					},
				});

				assert.ok(result.messages, "Should return messages");
			} finally {
				await client.close();
			}
		});

		it("should return prompt messages for explore-category", async () => {
			const client = new Client(
				{
					name: "test-client",
					version: "1.0.0",
				},
				{
					capabilities: {},
				},
			);

			const transport = new StdioClientTransport({
				command: "node",
				args: ["dist/index.js"],
				env: {
					...process.env,
					LOG_LEVEL: "error",
				},
			});

			await client.connect(transport);

			try {
				const result = await client.getPrompt({
					name: "explore-category",
					arguments: {
						category: "amenity",
					},
				});

				assert.ok(result.messages, "Should return messages");

				const text = (result.messages[0].content as { text: string }).text.toLowerCase();
				assert.ok(text.includes("amenity"), "Message should include the category");
			} finally {
				await client.close();
			}
		});
	});

	describe("Prompt Message Content", () => {
		it("prompts should mention specific tool names in workflow", async () => {
			const client = new Client(
				{
					name: "test-client",
					version: "1.0.0",
				},
				{
					capabilities: {},
				},
			);

			const transport = new StdioClientTransport({
				command: "node",
				args: ["dist/index.js"],
				env: {
					...process.env,
					LOG_LEVEL: "error",
				},
			});

			await client.connect(transport);

			try {
				const result = await client.getPrompt({
					name: "validate-osm-feature",
					arguments: {
						featureType: "restaurant",
						tags: "amenity=restaurant",
					},
				});

				const text = (result.messages[0].content as { text: string }).text;

				// Should mention actual tool names
				assert.ok(
					text.includes("validate_tag_collection") || text.includes("validate"),
					"Should mention validation tool",
				);

				assert.ok(
					text.includes("suggest_improvements") || text.includes("suggest"),
					"Should mention suggestions tool",
				);
			} finally {
				await client.close();
			}
		});
	});
});
