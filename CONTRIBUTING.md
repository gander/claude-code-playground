# Contributing to OSM Tagging Schema MCP Server

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Documentation](#documentation)

## Code of Conduct

This project follows standard open-source etiquette:
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Assume good intentions

## Getting Started

### Prerequisites

- **Node.js**: 22.0.0 or higher
- **npm**: 10.0.0 or higher
- **Git**: Latest version

### Initial Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/osm-tagging-schema-mcp.git
   cd osm-tagging-schema-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify setup**
   ```bash
   npm test
   npm run lint
   npm run typecheck
   npm run build
   ```

4. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/gander-tools/osm-tagging-schema-mcp.git
   ```

## Development Workflow

This project follows **Test-Driven Development (TDD)**. Always write tests first!

### 1. Create a Feature Branch

```bash
git checkout master
git pull upstream master
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements

### 2. Write Tests First (TDD - RED)

Create test files in the appropriate directory:
- Unit tests: `tests/tools/` or `tests/utils/`
- Integration tests: `tests/integration/`

```bash
# Example: Adding a new tool
# 1. Create test file first
touch tests/tools/my-new-tool.test.ts
touch tests/integration/my-new-tool.test.ts

# 2. Write failing tests
npm test  # Should fail (RED)
```

### 3. Implement the Feature (TDD - GREEN)

Write minimal code to make tests pass:

```bash
# Create implementation file
touch src/tools/my-new-tool.ts

# Implement feature
# Run tests until they pass
npm test  # Should pass (GREEN)
```

### 4. Refactor (TDD - REFACTOR)

Improve code quality while keeping tests green:

```bash
npm test        # Ensure tests still pass
npm run lint    # Check code quality
npm run format  # Auto-format code
npm run typecheck  # Verify types
```

### 5. Test Data Integrity

**CRITICAL**: All tools must be tested against actual JSON data from `@openstreetmap/id-tagging-schema`.

```typescript
// Import JSON data in your tests
import presets from "@openstreetmap/id-tagging-schema/dist/presets.json" with { type: "json" };
import fields from "@openstreetmap/id-tagging-schema/dist/fields.json" with { type: "json" };

// Validate against ALL values (100% coverage required)
describe("JSON Schema Data Integrity", () => {
  it("should validate against all presets", async () => {
    // Loop through ALL presets, not a sample
    for (const [presetId, preset] of Object.entries(presets)) {
      // Test each individually
      const result = await myTool(presetId);
      assert.ok(result);
    }
  });
});
```

**Requirements:**
- ✅ Validate EVERY value from JSON files
- ✅ Use provider patterns for comprehensive coverage
- ✅ No hardcoded test values
- ✅ Bidirectional validation (tool → JSON and JSON → tool)

## Pull Request Process

### Before Submitting

Run the full validation suite:

```bash
# 1. Run all tests
npm test

# 2. Check code quality
npm run lint

# 3. Verify TypeScript
npm run typecheck

# 4. Build project
npm run build
```

**All checks must pass before submitting a PR.**

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a PR on GitHub**
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template

3. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] All tests passing
   - [ ] Test coverage >90%

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings
   ```

### Review Process

1. **Automated Checks**: GitHub Actions will run tests, linting, and type checking
2. **Code Review**: Maintainers will review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

## Coding Standards

### File Organization

**One Tool, One File**: Each MCP tool gets its own file.

```
src/tools/
├── my-new-tool.ts        # Implementation
tests/tools/
├── my-new-tool.test.ts   # Unit tests
tests/integration/
├── my-new-tool.test.ts   # Integration tests
```

### TypeScript Style

```typescript
// Use explicit types
export interface MyToolResult {
  data: string[];
  count: number;
}

// Use async/await
export async function myTool(
  loader: SchemaLoader,
  param: string,
): Promise<MyToolResult> {
  const data = await loader.getData();
  return { data, count: data.length };
}

// Use type guards
if ("fields" in preset && preset.fields) {
  // ...
}
```

### Code Quality Tools

- **BiomeJS**: Linting and formatting
- **TypeScript**: Type checking
- **Node.js Test Runner**: Testing

```bash
# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Run specific test file
node --import tsx --test tests/tools/my-tool.test.ts
```

## Testing Requirements

### Test Coverage

- **Minimum**: 90% coverage across all modules
- **Goal**: 100% coverage for critical paths

### Test Structure

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("MyTool", () => {
  describe("Basic Functionality", () => {
    it("should do X", async () => {
      // Arrange
      const input = "test";

      // Act
      const result = await myTool(input);

      // Assert
      assert.strictEqual(result.count, 1);
    });
  });

  describe("JSON Schema Data Integrity", () => {
    it("should validate against JSON data", async () => {
      // Test against actual schema data
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty input", async () => {
      // Test edge cases
    });
  });
});
```

### Integration Tests

```typescript
describe("Integration: my_new_tool", () => {
  let client: Client;
  let server: TestServer;

  beforeEach(async () => {
    ({ client, server } = await setupClientServer());
  });

  afterEach(async () => {
    await teardownClientServer(client, server);
  });

  it("should register tool", async () => {
    const response = await client.listTools();
    const tool = response.tools.find((t) => t.name === "my_new_tool");
    assert.ok(tool);
  });
});
```

## Commit Message Guidelines

Follow **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions/changes
- `refactor`: Code refactoring
- `style`: Code style changes (formatting, etc.)
- `chore`: Build process, dependencies

### Examples

```bash
# Good commit messages
git commit -m "feat(tools): add get_tag_relations tool"
git commit -m "fix(validation): handle empty tag collections"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(tools): add JSON data integrity tests"

# Bad commit messages (avoid these)
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "update"
```

### Detailed Commit Body

For complex changes, use a detailed commit message:

```bash
git commit -m "$(cat <<'EOF'
feat(tools): add suggest_improvements tool (TDD)

**Feature**: suggest_improvements tool for analyzing tag collections

**TDD Approach**:
- RED: Created 14 unit tests for functionality
- GREEN: Implemented with preset matching
- REFACTOR: Fixed bugs, added type guards

**Implementation**:
- Created src/tools/suggest-improvements.ts
- Integrated with check_deprecated
- Returns matched preset IDs

**Tests**:
- Unit tests (13 tests)
- Integration tests (11 tests)
- All 370 tests passing
EOF
)"
```

## Documentation

### Code Documentation

Use JSDoc comments:

```typescript
/**
 * Get all possible values for a tag key
 *
 * @param loader - Schema loader instance
 * @param tagKey - The tag key to query (e.g., "amenity")
 * @returns Array of valid values sorted alphabetically
 */
export async function getTagValues(
  loader: SchemaLoader,
  tagKey: string,
): Promise<string[]> {
  // ...
}
```

### README Updates

When adding new tools, update:
- **README.md**: Add tool to the table
- **ROADMAP.md**: Mark task as completed
- **CHANGELOG.md**: Add entry in Unreleased section

### CLAUDE.md Updates

For significant features, update `CLAUDE.md`:
- Development Status section
- Test counts
- Phase completion status

## Questions?

- **Issues**: Open an issue on GitHub for questions
- **Discussions**: Use GitHub Discussions for broader topics
- **Security**: Email security issues privately (see SECURITY.md)

## License

By contributing, you agree that your contributions will be licensed under the GNU General Public License v3.0.
