# OSS-Fuzz Integration

This directory contains configuration files for potential future integration with [OSS-Fuzz](https://github.com/google/oss-fuzz), Google's continuous fuzzing service for open source projects.

## Current Status

**Active Fuzzing:** ✅ Property-based testing with fast-check (GitHub Actions)
**OSS-Fuzz Submission:** 🔄 Prepared but not yet submitted

## Current Fuzzing Approach

The project currently uses **property-based testing** with the [fast-check](https://github.com/dubzzz/fast-check) library, which is a recognized fuzzing approach by the OpenSSF Scorecard.

### Fuzz Targets

We have comprehensive fuzz tests for critical components:

1. **Tag Parser** (`tests/fuzz/tag-parser.fuzz.test.ts`)
   - Tests random string inputs
   - Tests JSON parsing edge cases
   - Tests key=value format parsing
   - Tests unicode and special characters
   - Tests very long inputs

2. **Tag Validation** (`tests/fuzz/validate-tag.fuzz.test.ts`)
   - Tests random key-value pairs
   - Tests OSM-like tag patterns
   - Tests empty and whitespace inputs
   - Tests deprecated tag handling
   - Tests common OSM tag patterns

3. **Schema Loader** (`tests/fuzz/schema-loader.fuzz.test.ts`)
   - Tests translation method lookups
   - Tests preset name resolution
   - Tests field label resolution
   - Tests unicode and special characters

### Running Fuzz Tests

```bash
# Run all fuzz tests locally
npm run test:fuzz

# Run with coverage
npm run test:coverage:fuzz

# Fuzz tests also run automatically in CI:
# - On every PR (5-minute fast fuzzing)
# - On every push to master (30-minute extended fuzzing)
# - Weekly schedule (Monday 2 AM UTC)
```

## OSS-Fuzz Submission (Future)

To submit this project to OSS-Fuzz in the future:

### Prerequisites

1. **Project Requirements:**
   - ✅ Open source with permissive license (GPL-3.0)
   - ✅ Significant user base or security relevance
   - ✅ Actively maintained
   - ✅ Fuzz targets implemented

2. **Maintainer Requirements:**
   - Security contact email
   - Commitment to fix bugs found by fuzzing
   - Review and triage fuzzing findings

### Submission Process

1. **Prepare Configuration:**
   - Update `project.yaml` with actual contact emails
   - Test build locally with OSS-Fuzz tooling
   - Ensure fuzz targets compile and run

2. **Create OSS-Fuzz PR:**
   ```bash
   # Fork https://github.com/google/oss-fuzz
   # Create projects/osm-tagging-schema-mcp/ directory
   # Copy .ossfuzz/* files to that directory
   # Submit PR to google/oss-fuzz
   ```

3. **Integration Steps:**
   - OSS-Fuzz team reviews PR
   - Initial fuzzing run to verify setup
   - Continuous fuzzing starts after approval

### Benefits of OSS-Fuzz

- **Continuous Fuzzing:** 24/7 fuzzing on Google infrastructure
- **ClusterFuzz Integration:** Advanced corpus management
- **Bug Reporting:** Private bug reports with 90-day disclosure timeline
- **Coverage Tracking:** Detailed code coverage reports
- **Sanitizers:** Address, undefined, memory sanitizers

## Configuration Files

- `project.yaml`: OSS-Fuzz project configuration
- `Dockerfile`: Docker image for building fuzz targets
- `build.sh`: Build script for compiling fuzz targets
- `README.md`: This documentation

## Resources

- [OSS-Fuzz Documentation](https://google.github.io/oss-fuzz/)
- [New Project Guide](https://google.github.io/oss-fuzz/getting-started/new-project-guide/)
- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://github.com/dubzzz/fast-check/blob/main/documentation/HowItWorks.md)

## Scorecard Impact

The current implementation with fast-check property-based testing is **recognized by OpenSSF Scorecard** as fuzzing infrastructure. This should improve the project's fuzzing score from 0 to a higher value.

**Scorecard checks for:**
- ✅ fast-check library usage (JavaScript/TypeScript property-based testing)
- ✅ Fuzz test files in repository
- ✅ CI/CD integration for regular fuzzing

## Contact

For questions about fuzzing or security issues, please contact:
- GitHub Issues: https://github.com/gander-tools/osm-tagging-schema-mcp/issues
- Security: See SECURITY.md for responsible disclosure process
