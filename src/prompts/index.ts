import type { PromptMessage } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Prompt definition interface matching OsmToolDefinition pattern
 */
export interface OsmPromptDefinition {
	name: string;
	config: () => {
		title?: string;
		description?: string;
		argsSchema?: Record<string, z.ZodTypeAny>;
	};
	handler: (args: Record<string, unknown>) => { messages: PromptMessage[] };
}

/**
 * Validate OSM Feature Prompt
 *
 * Guides users through validating a complete OSM feature with all its tags
 */
export const validateOsmFeature: OsmPromptDefinition = {
	name: "validate-osm-feature",
	config: () => ({
		description:
			"Guide the user through validating a complete OpenStreetMap feature. This prompt helps validate all tags for a feature, check for deprecated tags, and suggest improvements. Use when users want to validate data before uploading to OSM or check data quality.",
		argsSchema: {
			featureType: z
				.string()
				.describe(
					"Type of OSM feature to validate (e.g., 'restaurant', 'park', 'road', 'building'). Used to provide context for validation.",
				),
			tags: z
				.string()
				.describe(
					'Tags to validate in flat text format (key=value per line) or JSON. Example: "amenity=restaurant\\nname=Test Cafe\\ncuisine=italian"',
				),
		},
	}),
	handler: ({ featureType, tags }) => ({
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: `I need to validate an OpenStreetMap ${featureType} feature with the following tags:\n\n${tags}\n\nPlease help me:\n1. Convert the tags to JSON format if needed (use flat_to_json tool)\n2. Validate each tag using validate_tag_collection\n3. Identify any deprecated tags and show modern replacements\n4. Check if all tags are appropriate for a ${featureType}\n5. Suggest any missing important tags using suggest_improvements\n6. Provide a summary of the validation results with actionable recommendations`,
				},
			},
		],
	}),
};

/**
 * Find Preset Prompt
 *
 * Helps users discover the correct OSM preset for a feature type
 */
export const findPreset: OsmPromptDefinition = {
	name: "find-preset",
	config: () => ({
		description:
			"Help users find the correct OpenStreetMap preset for a feature they want to map. This prompt guides them through searching for presets, understanding the preset structure, and learning what tags and fields are needed. Use when users are learning OSM tagging or need to know how to tag a specific feature type.",
		argsSchema: {
			featureDescription: z
				.string()
				.describe(
					"Description of the feature to find a preset for (e.g., 'Italian restaurant', 'public park', 'residential street', 'elementary school')",
				),
		},
	}),
	handler: ({ featureDescription }) => ({
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: `I want to map a ${featureDescription} in OpenStreetMap but I'm not sure what tags to use.\n\nPlease help me:\n1. Search for relevant presets using search_presets with keywords from "${featureDescription}"\n2. Show me the top matching presets with their names and tags\n3. For the most relevant preset, get complete details using get_preset_details\n4. Explain what each tag means and which fields are required vs optional\n5. Provide a complete example of how to tag this feature with realistic values`,
				},
			},
		],
	}),
};

/**
 * Learn Tag Prompt
 *
 * Educational prompt to help users understand a specific OSM tag
 */
export const learnTag: OsmPromptDefinition = {
	name: "learn-tag",
	config: () => ({
		description:
			"Provide comprehensive educational information about a specific OpenStreetMap tag key. This prompt explains what the tag is for, shows all possible values, and provides examples of proper usage. Use when users want to learn about OSM tagging concepts or understand a specific tag.",
		argsSchema: {
			tagKey: z
				.string()
				.describe(
					"The OSM tag key to learn about (e.g., 'amenity', 'building', 'highway', 'natural', 'shop')",
				),
		},
	}),
	handler: ({ tagKey }) => ({
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: `I want to learn about the OpenStreetMap tag key "${tagKey}".\n\nPlease help me understand:\n1. Get all possible values using get_tag_values for "${tagKey}"\n2. Show me the complete list of values with their human-readable names\n3. Search for example presets using search_tags with keyword "${tagKey}"\n4. Show 3-5 concrete examples of how this tag is used in different presets\n5. Explain the general purpose and common use cases for the "${tagKey}" tag\n6. Highlight any important conventions or rules for using this tag`,
				},
			},
		],
	}),
};

/**
 * Improve Tags Prompt
 *
 * Guides users through improving incomplete or minimal tag collections
 */
export const improveTags: OsmPromptDefinition = {
	name: "improve-tags",
	config: () => ({
		description:
			"Guide users through improving an incomplete or minimal OpenStreetMap tag collection. This prompt analyzes existing tags, identifies the feature type, and suggests additional tags to make the feature more complete and useful. Use when users have basic tags but want to add more detail.",
		argsSchema: {
			currentTags: z
				.string()
				.describe(
					'Current tags for the feature in flat text format or JSON. Example: "amenity=restaurant\\nname=Test"',
				),
		},
	}),
	handler: ({ currentTags }) => ({
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: `I have an OpenStreetMap feature with these tags:\n\n${currentTags}\n\nI want to make it more complete and informative. Please help me:\n1. Convert tags to JSON if needed using flat_to_json\n2. Identify what type of feature this is by searching for matching presets\n3. Use suggest_improvements to get suggestions for missing fields\n4. For each suggested field, explain what it's for and provide example values\n5. Prioritize suggestions by importance (required fields first, then commonly used optional fields)\n6. Show me a complete, improved version of the tags with realistic example values\n7. Validate the improved tag collection to ensure quality`,
				},
			},
		],
	}),
};

/**
 * Explore Category Prompt
 *
 * Helps users explore all features within a category
 */
const geometryEnum = {
	point: "point",
	line: "line",
	area: "area",
	relation: "relation",
} as const;

export const exploreCategory: OsmPromptDefinition = {
	name: "explore-category",
	config: () => ({
		description:
			"Help users explore all feature types within an OpenStreetMap category. This prompt shows all available values for a tag key, finds related presets, and helps users understand the breadth of features in a category. Use when users want to learn what can be mapped in a specific category or discover all options.",
		argsSchema: {
			category: z
				.string()
				.describe(
					"OSM category/tag key to explore (e.g., 'amenity', 'shop', 'highway', 'natural', 'building', 'landuse')",
				),
			geometryType: z
				.enum(geometryEnum)
				.optional()
				.describe("Optional: filter to only features of this geometry type"),
		},
	}),
	handler: ({ category, geometryType }) => ({
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: `I want to explore all the different types of features in the OpenStreetMap "${category}" category${geometryType ? ` that can be mapped as ${geometryType} features` : ""}.\n\nPlease help me:\n1. Get all possible values for the "${category}" tag using get_tag_values\n2. Show me how many different ${category} types exist\n3. Group the values into logical subcategories if possible (e.g., food, education, healthcare for amenity)\n4. For interesting or common values, search for their presets using search_presets${geometryType ? ` filtered by geometry="${geometryType}"` : ""}\n5. Highlight 5-10 of the most commonly used ${category} types\n6. For 2-3 example types, show complete preset details including required fields\n7. Summarize the diversity and scope of the "${category}" category`,
				},
			},
		],
	}),
};

/**
 * All prompts exported as an array for registration
 */
export const prompts = [validateOsmFeature, findPreset, learnTag, improveTags, exploreCategory];
