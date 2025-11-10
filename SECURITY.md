# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of osm-tagging-schema-mcp seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. Report vulnerabilities using:
   - **GitHub Security Advisories** (preferred): https://github.com/gander-tools/osm-tagging-schema-mcp/security/advisories/new
   - Navigate to: Security tab → Advisories → "Report a vulnerability"

### What to Include

Please provide as much information as possible:

- Type of vulnerability (e.g., XSS, SQL injection, command injection)
- Full path of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability
- Any potential mitigations you've identified

### Response Timeline

- **Acknowledgment**: Within 48 hours of report
- **Initial Assessment**: Within 5 business days
- **Fix Timeline**: Depends on severity
  - **Critical**: 7 days
  - **High**: 14 days
  - **Medium**: 30 days
  - **Low**: Next regular release

### Disclosure Policy

- We follow **coordinated disclosure** principles
- Security advisories will be published after a fix is released
- Reporter will be credited (unless anonymity is requested)
- We aim to provide advance notice to affected users

## Security Update Process

### For Users

1. **Monitor Releases**: Watch this repository for security updates
2. **Update Promptly**: Apply security patches as soon as they're released
3. **Verify Images**: Use Cosign to verify Docker image signatures:
   ```bash
   cosign verify ghcr.io/gander-tools/osm-tagging-schema-mcp:latest \
     --certificate-identity-regexp=https://github.com/gander-tools \
     --certificate-oidc-issuer=https://token.actions.githubusercontent.com
   ```

### For Contributors

- Security fixes follow the same TDD workflow as regular features
- Security-related PRs may be handled in a private fork initially
- All security fixes must include tests demonstrating the vulnerability is resolved

## Security Features

This project implements multiple security measures:

### 1. Automated Scanning
- **CodeQL**: Static Application Security Testing (SAST) for code vulnerabilities
- **Trivy**: Container image vulnerability scanning
- **npm audit**: Dependency vulnerability scanning
- **Dependency Review**: Automated review of dependency changes in PRs

### 2. Supply Chain Security
- **Cosign**: Keyless image signing with Sigstore
- **SBOM**: Software Bill of Materials generation (CycloneDX format)
- **OpenSSF Scorecard**: Open Source Security Foundation best practices compliance
- **Pinned Actions**: All GitHub Actions pinned with SHA hashes

### 3. Build Security
- **Multi-stage Docker builds**: Minimal attack surface
- **Non-root execution**: Container runs as unprivileged user (UID 1001)
- **Minimal base image**: Alpine Linux for reduced vulnerabilities
- **License compliance**: Automated license checking

### 4. Development Security
- **BiomeJS**: Code quality and security linting
- **TypeScript**: Type safety to prevent runtime errors
- **Test-Driven Development**: Comprehensive test coverage (>90%)

## Vulnerability Response Examples

### Example: Dependency Vulnerability

1. Dependabot creates PR with security update
2. Automated tests run (CodeQL, npm audit, unit tests)
3. PR reviewed and merged if tests pass
4. New version released automatically
5. Security advisory published

### Example: Code Vulnerability

1. Vulnerability reported via GitHub Security Advisory
2. Maintainers confirm and assess severity
3. Fix developed in private fork with tests
4. Patch released with security advisory
5. Public disclosure after users have time to update

## Security Best Practices for Users

### Running via npx (Recommended)
```bash
# Always use the latest version
npx @gander-tools/osm-tagging-schema-mcp
```

### Running from Source
```bash
# Verify git signatures
git verify-commit HEAD

# Use npm ci for reproducible builds
npm ci

# Run security audit
npm audit
```

### Running via Docker
```bash
# Verify image signature
cosign verify ghcr.io/gander-tools/osm-tagging-schema-mcp:latest \
  --certificate-identity-regexp=https://github.com/gander-tools \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com

# Run with minimal permissions
docker run --read-only --cap-drop=ALL -i \
  ghcr.io/gander-tools/osm-tagging-schema-mcp:latest
```

## Known Security Considerations

### MCP Server Context

This is a Model Context Protocol (MCP) server that:
- Processes user input for OSM tag queries
- Does NOT execute arbitrary code
- Does NOT access filesystem beyond schema data
- Does NOT make network requests
- Does NOT store user data

### Trust Model

- **Schema Data**: Trusted (from official @openstreetmap/id-tagging-schema package)
- **User Input**: Validated (type checking, bounds checking)
- **Query Results**: Deterministic (no external API calls)

## Security Contacts

- **Project Maintainers**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **GitHub Security**: Use Security Advisories feature
- **Community**: Discussions tab (for general security questions only, not vulnerabilities)

## Attribution

- Security policy inspired by [OpenSSF's Security Insights Spec](https://github.com/ossf/security-insights-spec)
- Follows [ISO/IEC 29147:2018](https://www.iso.org/standard/72311.html) vulnerability disclosure guidelines

## Updates to This Policy

This security policy may be updated periodically. Major changes will be announced via:
- Repository releases
- GitHub Discussions
- npm package changelog

Last updated: 2025-11-10
