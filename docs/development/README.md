# Development Documentation

Documentation for contributors and developers working on the OSM Tagging Schema MCP Server.

## Getting Started with Development

Essential guides for contributing:

- **[Contributing](contributing.md)** - Contribution guidelines, TDD workflow, and standards
- **[Development](development.md)** - Development setup, commands, and debugging
- **[Inspection](inspection.md)** - Testing and debugging with MCP Inspector
- **[Release Process](release-process.md)** - How releases are created and published

## Project Planning

- **[Roadmap](roadmap.md)** - Development phases and future features
- **[Resources & Prompts Design](resources-prompts-design.md)** - Phase 9 complete design specification
- **[Phase 9 Implementation Plan](phase-9-implementation-plan.md)** - Phase 9 implementation roadmap
- **[Resources & Prompts Quick Reference](resources-prompts-quick-reference.md)** - Phase 9 quick reference

## Quality Assurance

- **[Fuzzing](fuzzing.md)** - Property-based testing and security fuzzing

## Quick Start

1. **Setup**: Follow [development setup](development.md)
2. **Contributing**: Read [contributing guidelines](contributing.md)
3. **Testing**: Use TDD approach - write tests first
4. **Quality**: Run `npm test` before committing

## Development Workflow

This project follows **Test-Driven Development (TDD)**:

1. Write failing tests first
2. Implement minimal code to make tests pass
3. Refactor while keeping tests green
4. Maintain >90% test coverage

## Architecture

- **Language**: TypeScript 5.x with Node.js 22+
- **Testing**: Node.js native test runner + property-based fuzzing
- **MCP SDK**: @modelcontextprotocol/sdk for tool registration
- **Schema**: @openstreetmap/id-tagging-schema for OSM data

## Links

- **[User Documentation](../user/README.md)** - For end users
- **[API Documentation](../api/README.md)** - For tool users
- **[Deployment Documentation](../deployment/README.md)** - For operations

## Need Help?

1. Check [DEVELOPMENT.md](development.md) for setup issues
2. Review [contributing guidelines](contributing.md) for process questions
3. Open an issue for bugs or feature requests
4. Join discussions for architectural questions