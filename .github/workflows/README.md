# GitHub Actions Workflows

This directory contains CI/CD workflows for the OSM Tagging Schema MCP Server.

## Workflows

### 1. Test Workflow (`test.yml`)
Runs on every push and pull request to ensure code quality:
- Unit tests
- Integration tests
- Linting (BiomeJS)
- Type checking (TypeScript)
- Build verification

### 2. Docker Workflow (`docker.yml`)
Builds and publishes Docker images to GitHub Container Registry:
- Multi-architecture support (amd64, arm64)
- Vulnerability scanning with Trivy
- Image signing with Cosign
- Tags: `latest`, `edge`, `X.Y.Z`, `X.Y`, `X`

### 3. Publish Workflow (`publish.yml`)
Publishes package to npm registry with provenance:
- SLSA Level 3 attestations
- SBOM generation (CycloneDX format)
- Automated releases
- Provenance signing

### 4. Security Workflow (`security.yml`)
Performs security scanning:
- Dependency vulnerability scanning
- SAST analysis
- License compliance checks

### 5. CodeQL Workflow (`codeql.yml`)
GitHub's code scanning for security vulnerabilities:
- JavaScript/TypeScript analysis
- Automated security alerts

### 6. Cleanup Workflow (`cleanup.yml`)
Automatically cleans up old container images:
- Removes untagged images
- Cleans up development images
- Preserves tagged releases

### 7. Dependency Review Workflow (`dependency-review.yml`)
Reviews dependency changes in pull requests:
- Checks for vulnerable dependencies
- License compliance
- Compatibility issues

### 8. Auto-PR Workflow (`auto-pr.yml`) ✅ Active
**Automatically creates Pull Requests from `claude/*` branches.**

> **Status**: ✅ Enabled - GitHub Actions can create PRs

#### Setup Instructions

This workflow requires additional configuration to work (already configured for this repository):

##### Option 1: Enable GitHub Actions PR Creation (Recommended)

1. Go to **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Enable: ✅ **"Allow GitHub Actions to create and approve pull requests"**
4. Click **Save**

![GitHub Actions Settings](https://docs.github.com/assets/cb-52389/mw-1440/images/help/repository/actions-workflow-permissions-repository.webp)

##### Option 2: Use Personal Access Token (PAT)

If you prefer not to enable the above setting, use a PAT:

1. **Create a PAT:**
   - Go to: https://github.com/settings/tokens/new
   - Name: `Auto-PR Token`
   - Expiration: Your preference (recommend: 90 days)
   - Scopes: ✅ `repo` (all)
   - Click **Generate token**
   - Copy the token (you won't see it again!)

2. **Add PAT as repository secret:**
   - Go to: **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `PAT_TOKEN`
   - Value: (paste your PAT)
   - Click **Add secret**

#### How It Works

When you push to a `claude/*` branch:

```bash
git push origin claude/add-new-feature-abc123
```

The workflow automatically:
1. ✅ Detects the branch push
2. ✅ Creates a PR with title: `[CLAUDE] <first commit title>`
3. ✅ Targets the default branch
4. ✅ Includes recent commits in PR description
5. ✅ Adds labels: `auto-created`, `claude-branch`

**Branch naming format:** `claude/<feature-description>-<session-id>`

Example: `claude/improve-validation-01Y1fZwRf7bd`
- Session ID: `01Y1fZwRf7bd`
- First commit: "Improve tag validation logic"
- **PR Title**: `[CLAUDE] Improve tag validation logic`

#### Troubleshooting

**Problem:** Workflow fails with "GitHub Actions is not permitted to create or approve pull requests"

**Solution:** Follow setup instructions above (Option 1 or Option 2)

**Problem:** PR created but labels not added

**Solution:** Create labels in your repository:
- Go to: **Issues** → **Labels**
- Create: `auto-created` and `claude-branch` labels

**Problem:** Can't find workflow run

**Solution:** Check: https://github.com/gander-tools/osm-tagging-schema-mcp/actions/workflows/auto-pr.yml

## Workflow Security

All workflows follow security best practices:
- ✅ Pinned action versions (full SHA)
- ✅ Minimal permissions (least privilege)
- ✅ Secret scanning enabled
- ✅ Code signing where applicable
- ✅ Provenance attestations

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)
- [Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
