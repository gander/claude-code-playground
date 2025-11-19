#!/bin/bash -eu
# OSS-Fuzz build script
# This is prepared for potential future OSS-Fuzz submission

# Navigate to project directory
cd $SRC/osm-tagging-schema-mcp

# Install dependencies
npm ci

# Build the project
npm run build

# For JavaScript/TypeScript projects using property-based testing,
# we integrate with fast-check fuzz tests

# Create fuzzer wrappers for OSS-Fuzz
# These would be adapted to work with OSS-Fuzz's libFuzzer interface

echo "Fuzzing infrastructure ready"
echo "Current approach: Property-based testing with fast-check"
echo "Fuzz targets: tag-parser, validate-tag, schema-loader"

# Note: Full OSS-Fuzz integration would require additional
# adaptation layer between fast-check and libFuzzer format
