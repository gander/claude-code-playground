# Fuzzing

This document describes the fuzzing infrastructure for the OSM Tagging Schema MCP Server project.

## Overview

The project uses **property-based testing** with [fast-check](https://github.com/dubzzz/fast-check) to continuously fuzz critical components and discover edge cases, vulnerabilities, and unexpected behavior. This approach is recognized by the [OpenSSF Scorecard](https://securityscorecards.dev/) as a valid fuzzing methodology.

## Why Fuzzing?

Fuzzing helps discover:
- **Edge Cases**: Unexpected input combinations that cause failures
- **Security Vulnerabilities**: Buffer overflows, injection attacks, crashes
- **Robustness Issues**: How the code handles malformed or extreme inputs
- **Logic Errors**: Incorrect behavior with unusual input patterns

## Fuzzing Infrastructure

### Fuzz Targets

We maintain fuzz tests for three critical components that handle untrusted input:

#### 1. Tag Parser (`tests/fuzz/tag-parser.fuzz.test.ts`)

**What it tests:** The `parseTagInput()` function that parses various tag input formats.

**Test cases:**
- Random string inputs (unicode, special characters, very long strings)
- JSON parsing with edge cases (nested objects, arrays, special values)
- Key=value format parsing with various separators
- Mixed valid/invalid line formats
- Empty inputs and whitespace

**Why it matters:** The parser is the entry point for user data and must handle any input without crashing.

**Test iterations:** ~7,000 test cases per run (1,000 per test × 7 test scenarios)

#### 2. Tag Validation (`tests/fuzz/validate-tag.fuzz.test.ts`)

**What it tests:** The `validateTag()` function that validates OSM tag key-value pairs.

**Test cases:**
- Random key-value pairs
- OSM-like tag patterns (amenity, building, highway, etc.)
- Empty and whitespace inputs
- Special characters and unicode
- Very long keys and values
- Known deprecated tag patterns
- Common OSM tag patterns

**Why it matters:** Validation logic must never crash, even with malicious or malformed input.

**Test iterations:** ~4,500 test cases per run (500-100 per test × 7 test scenarios)

#### 3. Schema Loader (`tests/fuzz/schema-loader.fuzz.test.ts`)

**What it tests:** Translation and lookup methods in the `SchemaLoader` class.

**Test cases:**
- Random preset IDs in `getPresetName()`
- Random field keys in `getFieldLabel()`
- Random field key/option pairs in `getFieldOptionName()`
- Random category IDs in `getCategoryName()`
- Random tag keys in `getTagKeyName()`
- Random tag key/value pairs in `getTagValueName()`
- Unicode and special characters across all methods
- Very long strings

**Why it matters:** Translation lookups must handle any input without throwing exceptions.

**Test iterations:** ~3,500 test cases per run (500-100 per test × 8 test scenarios)

### Total Coverage

**Total test cases per full run:** ~15,000 property-based test cases
**Extended run (CI):** ~75,000 test cases (5x multiplier with FUZZ_RUNS=5000)

## Running Fuzz Tests

### Locally

```bash
# Run all fuzz tests (default iterations)
npm run test:fuzz

# Run with coverage report
npm run test:coverage:fuzz

# Run individual fuzz test file
node --import tsx --test tests/fuzz/tag-parser.fuzz.test.ts
```

### In CI/CD

Fuzzing runs automatically in GitHub Actions:

**On Pull Requests:**
- Fast fuzzing run (5 minutes)
- ~15,000 test cases
- Validates changes don't introduce crashes

**On Push to Master:**
- Extended fuzzing run (30 minutes)
- ~75,000 test cases
- More thorough exploration of input space

**Weekly Schedule:**
- Monday 2 AM UTC
- Extended fuzzing run
- Ensures ongoing code health

**Workflow file:** `.github/workflows/fuzz.yml`

## Property-Based Testing with fast-check

### What is Property-Based Testing?

Instead of writing specific test cases with fixed inputs, property-based testing:
1. **Defines properties** that should always be true
2. **Generates random inputs** automatically
3. **Shrinks failing cases** to minimal reproducible examples
4. **Explores edge cases** humans might miss

### Example

```typescript
// Traditional test
test("parser handles empty string", () => {
  expect(parse("")).toEqual({});
});

// Property-based test (fast-check)
test("parser never crashes", () => {
  fc.assert(
    fc.property(fc.string(), (input) => {
      // Property: parsing should never throw unhandled errors
      try {
        const result = parse(input);
        return typeof result === "object";
      } catch (error) {
        return error instanceof Error; // Expected errors are OK
      }
    })
  );
});
```

### Advantages

✅ **Discovers edge cases:** Finds inputs you didn't think to test
✅ **Better coverage:** Tests thousands of inputs automatically
✅ **Minimal failing examples:** Shrinks complex failures to simplest reproducible case
✅ **Regression prevention:** Re-runs with same seed guarantee deterministic results

## OSS-Fuzz Future Integration

The project is **prepared for OSS-Fuzz submission** with configuration files in `.ossfuzz/`:

- `project.yaml` - OSS-Fuzz project configuration
- `Dockerfile` - Docker image for fuzzing environment
- `build.sh` - Build script for fuzz targets
- `README.md` - Detailed submission instructions

**What is OSS-Fuzz?**
- Google's continuous fuzzing service for open source projects
- 24/7 fuzzing on Google infrastructure
- Advanced corpus management with ClusterFuzz
- Private bug reports with 90-day disclosure timeline

**Why not OSS-Fuzz yet?**
- Project must be accepted into OSS-Fuzz program
- Requires commitment to triage and fix bugs
- Current property-based testing provides excellent coverage

**How to submit:** See `.ossfuzz/README.md` for detailed instructions.

## Interpreting Results

### Successful Run

All fuzz tests pass - no crashes or unexpected errors detected.

```
✔ Tag Parser Fuzz Tests (7 tests) [500ms]
✔ Tag Validation Fuzz Tests (7 tests) [800ms]
✔ Schema Loader Fuzz Tests (8 tests) [300ms]
```

### Failure

If a fuzz test fails, fast-check will:
1. **Show the failing input** that caused the problem
2. **Shrink to minimal case** - simplest input that reproduces the issue
3. **Provide seed** for deterministic reproduction

Example failure output:
```
Property failed after 432 tests
Shrunk 12 times to:
  input: "{{{[[[]]]}}"

Counterexample: ["{{{[[[]]]}}}"]
Seed: 1234567890
```

### Fixing Failures

1. **Reproduce locally:**
   ```bash
   npm run test:fuzz
   ```

2. **Debug with minimal case:**
   - Copy the shrunk input from error message
   - Create focused test with that input
   - Fix the underlying issue

3. **Verify fix:**
   - Re-run fuzz tests
   - Add regression test for the specific case

## Best Practices

### When to Add Fuzz Tests

Add fuzz tests for:
- ✅ Input parsers (text, JSON, custom formats)
- ✅ Validators (checking untrusted data)
- ✅ String manipulation (splitting, formatting, encoding)
- ✅ Data structure operations (building, transforming)
- ✅ Any code that handles external input

Don't fuzz:
- ❌ Pure logic with no external input
- ❌ Simple getters/setters
- ❌ Code that just calls other functions

### Writing Good Fuzz Tests

1. **Focus on properties, not values:**
   - ✅ "Function never crashes"
   - ✅ "Output is always valid JSON"
   - ❌ "Function returns exactly {...}"

2. **Allow expected errors:**
   ```typescript
   try {
     const result = validate(input);
     return result.valid !== undefined;
   } catch (error) {
     // Parser is allowed to throw on invalid input
     return error instanceof Error;
   }
   ```

3. **Use appropriate generators:**
   ```typescript
   fc.string()           // Any string
   fc.unicodeString()    // Unicode characters
   fc.oneof(...)         // One of several options
   fc.array(...)         // Arrays
   fc.tuple(...)         // Fixed-length arrays
   ```

4. **Test invariants:**
   ```typescript
   // Parse → stringify → parse should be idempotent
   const parsed1 = parse(input);
   const serialized = JSON.stringify(parsed1);
   const parsed2 = parse(serialized);
   assert.deepEqual(parsed1, parsed2);
   ```

## Resources

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://github.com/dubzzz/fast-check/blob/main/documentation/HowItWorks.md)
- [OSS-Fuzz Documentation](https://google.github.io/oss-fuzz/)
- [OpenSSF Scorecard](https://securityscorecards.dev/)
- [Fuzzing Best Practices](https://google.github.io/oss-fuzz/advanced-topics/ideal-integration/)

## Contact

- **Issues:** https://github.com/gander-tools/osm-tagging-schema-mcp/issues
- **Security:** See SECURITY.md for responsible disclosure
