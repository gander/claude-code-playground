# Safe Release Workflow

## Overview

The **Safe Release Workflow** is a two-stage GitHub Actions workflow that ensures all packages (npm and Docker) are tested before publication, with a manual approval gate before final release.

## Workflow Stages

```
┌─────────────────────────────────────────┐
│  Stage 1: PRE-RELEASE (automatic)       │
├─────────────────────────────────────────┤
│  ✅ Tests (unit, integration, lint)     │
│  ✅ Build & test npm package            │
│  ✅ Build & test Docker (stdio + HTTP)  │
│  ✅ Create draft GitHub release         │
│  ✅ Create Pull Request                 │
│  ⏸️  STOP - Wait for approval           │
└─────────────────────────────────────────┘
              ↓ (manual approval)
┌─────────────────────────────────────────┐
│  Stage 2: PUBLISH (manual approval)     │
├─────────────────────────────────────────┤
│  ✅ Publish npm (provenance, SLSA)      │
│  ✅ Publish Docker (multi-arch, signed) │
│  ✅ Publish GitHub release              │
└─────────────────────────────────────────┘
```

## Prerequisites

### GitHub Environment Setup

The workflow requires a GitHub Environment called `production` with manual approval configured.

**Steps to configure:**

1. Go to repository **Settings** → **Environments**
2. Click **New environment**
3. Name: `production`
4. Check **Required reviewers**
5. Add yourself (or team members) as reviewers
6. Click **Save protection rules**

**Important**: Without this environment, the workflow will fail at the `publish` stage.

## Usage

### Step 1: Trigger the Workflow

**Via GitHub UI:**

1. Go to **Actions** tab
2. Select **Safe Release (with Manual Approval)** workflow
3. Click **Run workflow**
4. Select version bump type:
   - `patch` - Bug fixes (1.0.0 → 1.0.1)
   - `minor` - New features (1.0.0 → 1.1.0)
   - `major` - Breaking changes (1.0.0 → 2.0.0)
5. Click **Run workflow**

**Via GitHub CLI:**

```bash
# Patch release (1.0.0 → 1.0.1)
gh workflow run safe-release.yml -f version_bump=patch

# Minor release (1.0.0 → 1.1.0)
gh workflow run safe-release.yml -f version_bump=minor

# Major release (1.0.0 → 2.0.0)
gh workflow run safe-release.yml -f version_bump=major
```

### Step 2: Pre-Release Stage (Automatic)

The workflow automatically runs:

1. **Validation**
   - Type checking (`npm run typecheck`)
   - Linting (`npm run lint`)
   - Unit tests (`npm run test:unit`)
   - Integration tests (`npm run test:integration`)

2. **npm Package Testing**
   - Creates tarball (`npm pack`)
   - Installs globally
   - Tests stdio transport
   - Tests HTTP transport (health + ready endpoints)

3. **Docker Testing**
   - Builds image
   - Tests stdio transport
   - Tests HTTP transport (health + ready endpoints)
   - Validates Docker health checks

4. **Release Preparation**
   - Bumps version using cliff-jumper
   - Generates CHANGELOG.md
   - Creates release branch (`release/vX.Y.Z`)
   - Creates tag (`vX.Y.Z`)
   - Creates draft GitHub release
   - Creates Pull Request to main

**Duration**: ~5-10 minutes

### Step 3: Review

After pre-release stage completes:

1. **Review Draft Release**
   - Go to **Releases** tab
   - Find draft release for `vX.Y.Z`
   - Review release notes (auto-generated from CHANGELOG.md)

2. **Review Pull Request**
   - Go to **Pull requests** tab
   - Find PR titled `release: vX.Y.Z`
   - Review changes (package.json, CHANGELOG.md)

3. **Review Workflow Logs**
   - Go to **Actions** tab
   - Click on workflow run
   - Review "Pre-Release" job logs
   - Verify all tests passed

### Step 4: Approve Publication

**Via GitHub UI:**

1. Go to **Actions** tab
2. Click on the workflow run
3. You'll see **Review deployments** button
4. Click **Review deployments**
5. Check **production** environment
6. Click **Approve and deploy**

**Via GitHub CLI:**

```bash
# List pending deployments
gh run list --workflow=safe-release.yml

# View specific run
gh run view <RUN_ID>

# Note: Approval must be done via GitHub UI (no CLI command available)
```

### Step 5: Publish Stage (Automatic after approval)

Once approved, the workflow automatically:

1. **npm Publication**
   - Generates SBOM (CycloneDX format)
   - Creates SLSA build provenance attestations
   - Creates SLSA SBOM attestations
   - Publishes to npm with provenance

2. **Docker Publication**
   - Builds multi-architecture images (amd64, arm64)
   - Pushes to GitHub Container Registry
   - Scans for vulnerabilities (Trivy)
   - Signs images (Cosign keyless)

3. **GitHub Release**
   - Publishes draft release
   - Adds npm and Docker information
   - Adds security verification commands

**Duration**: ~10-15 minutes

### Step 6: Verify Publication

After successful publication:

```bash
# Verify npm package
npm view @gander-tools/osm-tagging-schema-mcp@latest
npm audit signatures @gander-tools/osm-tagging-schema-mcp

# Test npm package
npx @gander-tools/osm-tagging-schema-mcp@latest

# Verify Docker image
docker pull ghcr.io/gander-tools/osm-tagging-schema-mcp:latest

# Verify Docker signature
cosign verify ghcr.io/gander-tools/osm-tagging-schema-mcp:latest \
  --certificate-identity-regexp=https://github.com/gander-tools \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com

# Verify SLSA attestations
gh attestation verify oci://ghcr.io/gander-tools/osm-tagging-schema-mcp:latest \
  --owner gander-tools
```

## Aborting a Release

If you need to abort before approval:

### Option 1: Don't Approve

Simply don't approve the `production` environment. The workflow will eventually timeout (default: 30 days).

### Option 2: Delete Draft Release and PR

```bash
# Delete draft release
gh release delete vX.Y.Z --yes

# Close PR without merging
gh pr close <PR_NUMBER>

# Delete release branch
git push origin --delete release/vX.Y.Z

# Delete tag (if created)
git push origin --delete vX.Y.Z
```

### Option 3: Cancel Workflow

```bash
# Cancel workflow run
gh run cancel <RUN_ID>
```

## Workflow Summary Outputs

The workflow provides detailed summaries at each stage:

**Pre-Release Summary:**
- Version and branch information
- Validation status (tests, npm, Docker)
- Links to draft release and PR
- Next steps

**Publish Summary:**
- npm package information (name, version, install command)
- Docker image information (tags, platforms, signature)
- GitHub release link
- Verification commands

## Troubleshooting

### "production environment not found"

**Problem**: The `publish` job fails with "environment production not found"

**Solution**: Configure the `production` environment in repository settings (see Prerequisites)

### Pre-release stage fails

**Problem**: Tests fail during pre-release stage

**Solution**:
1. Check workflow logs for specific errors
2. Fix issues locally
3. Run tests locally: `npm test`, `npm run lint`, `npm run typecheck`
4. Re-run workflow after fixes

### npm package test fails

**Problem**: npm package installation or testing fails

**Solution**:
1. Check if `package.json` `files` field includes all necessary files
2. Verify `bin` field points to correct entry point
3. Test locally: `npm pack && npm install -g ./package.tgz`

### Docker test fails

**Problem**: Docker build or testing fails

**Solution**:
1. Check Dockerfile for syntax errors
2. Test locally: `docker build -t test .`
3. Verify health check endpoint works
4. Check logs: `docker logs <container_id>`

### Approval timeout

**Problem**: Workflow waiting indefinitely for approval

**Solution**:
1. Check if you have reviewer permissions for `production` environment
2. Verify environment configuration in repository settings
3. Refresh GitHub Actions page to see approval button

## Comparison with Other Workflows

| Workflow | Trigger | Tests | Draft Release | Manual Approval | Publishes |
|----------|---------|-------|---------------|-----------------|-----------|
| `safe-release.yml` | Manual | ✅ | ✅ | ✅ | npm + Docker |
| `manual-release.yml` | Manual | ✅ | ❌ | Optional | npm only |
| `publish.yml` | Tag push | ✅ | ❌ | ❌ | npm only |
| `docker.yml` | Tag push | ❌ | ❌ | ❌ | Docker only |

**Recommendation**: Use `safe-release.yml` for production releases with full validation and approval.

## Best Practices

1. **Always review draft release** before approving
2. **Check PR changes** (package.json, CHANGELOG.md)
3. **Review workflow logs** for any warnings
4. **Test published packages** after release
5. **Merge PR after successful release** to keep main branch in sync
6. **Create release from main branch** to avoid confusion

## Related Documentation

- [Publishing Guide](../CONTRIBUTING.md#publishing-releases)
- [Security Documentation](./security.md)
- [Deployment Guide](./deployment.md)
- [CHANGELOG](../CHANGELOG.md)
