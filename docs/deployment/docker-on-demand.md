# Docker Build On-Demand

This document describes how to trigger Docker image builds on-demand for Pull Requests.

## Overview

The `docker-build-on-demand.yml` workflow allows you to build and publish Docker images for Pull Requests without automatically building on every PR push. This saves CI resources and provides flexibility to build only when needed.

## Trigger Methods

There are **three ways** to trigger an on-demand Docker build:

### 1. Manual Trigger (workflow_dispatch)

**Best for:** Testing specific PRs, ad-hoc builds

1. Go to **Actions** tab in GitHub
2. Select **"Docker Build On-Demand"** workflow
3. Click **"Run workflow"**
4. Enter the PR number
5. Choose whether to push the image (default: true)
6. Click **"Run workflow"**

```
PR number: 123
Push image: ✓ (checked)
```

### 2. PR Label

**Best for:** Regular workflow, team collaboration

Add the `docker:build` label to any Pull Request:

1. Open the Pull Request
2. Click **"Labels"** on the right sidebar
3. Add label: `docker:build`
4. Workflow will automatically start

**Note:** You need to create the `docker:build` label first:
- Go to **Issues** → **Labels** → **New label**
- Name: `docker:build`
- Description: "Trigger Docker build for this PR"
- Color: `#0366d6` (blue)

### 3. PR Comment

**Best for:** Quick builds via comment

Comment on any Pull Request with:

```
/docker-build
```

The workflow will automatically start and add a 🚀 reaction to your comment.

## Build Output

### Image Tags

Built images are tagged with:

- `pr-<number>` - e.g., `pr-123`
- `pr-<number>-<sha>` - e.g., `pr-123-abc1234`

### Pull the Image

After the build completes, you can pull the image:

```bash
docker pull ghcr.io/gander-tools/osm-tagging-schema-mcp:pr-123
```

### PR Comment

The workflow will automatically comment on the PR with:

✅ **Success:**
```markdown
### ✅ Docker Build Successful

**Image:** `ghcr.io/gander-tools/osm-tagging-schema-mcp`

**Tags:**
- `ghcr.io/gander-tools/osm-tagging-schema-mcp:pr-123`
- `ghcr.io/gander-tools/osm-tagging-schema-mcp:pr-123-abc1234`

**Digest:** `sha256:...`

**Pull command:**
```bash
docker pull ghcr.io/gander-tools/osm-tagging-schema-mcp:pr-123
```

**Security:** Image signed with Cosign and scanned with Trivy
```

❌ **Failure:**
```markdown
### ❌ Docker Build Failed

Build failed. Check the [workflow run](link) for details.
```

## Security Features

All on-demand builds include:

1. **Vulnerability Scanning**: Trivy scans for CRITICAL and HIGH severity issues
2. **Image Signing**: Cosign keyless signing for image verification
3. **SARIF Upload**: Security findings uploaded to GitHub Security tab

## Image Verification

Verify the image signature:

```bash
cosign verify \
  --certificate-identity-regexp="https://github.com/gander-tools/osm-tagging-schema-mcp/.*" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  ghcr.io/gander-tools/osm-tagging-schema-mcp:pr-123
```

## Automatic Builds

The main `publish-docker.yml` workflow still handles automatic builds for:

- ✅ **Push to master** → `edge` tag
- ✅ **Version tags** (v*.*.*) → `latest`, semantic version tags
- ✅ **Manual trigger** → workflow_dispatch

**Removed:**
- ❌ **Pull Request** → Use on-demand workflow instead

## Permissions

The workflow requires these permissions:

- `contents: read` - Checkout repository
- `packages: write` - Push to GitHub Container Registry
- `id-token: write` - Cosign keyless signing
- `security-events: write` - Upload Trivy results
- `pull-requests: write` - Comment on PRs

## Troubleshooting

### Label not working

**Problem:** Adding `docker:build` label doesn't trigger the workflow

**Solution:** Ensure the label exists in the repository:
1. Go to **Issues** → **Labels**
2. Create label named exactly: `docker:build`

### Comment not working

**Problem:** `/docker-build` comment doesn't trigger the workflow

**Solutions:**
- Ensure comment is on a Pull Request (not an Issue)
- Comment must start with `/docker-build` (no leading spaces)
- Check workflow run history in Actions tab

### Build not pushing

**Problem:** Build completes but image not pushed

**Solutions:**
- Check `push_image` input is set to `true` (default)
- Verify GitHub token has `packages: write` permission
- Check Container Registry permissions in repo settings

## Examples

### Example 1: Test PR before merge

```bash
# Add label to PR #42
gh pr edit 42 --add-label "docker:build"

# Wait for build to complete
gh run watch

# Pull and test the image
docker pull ghcr.io/gander-tools/osm-tagging-schema-mcp:pr-42
docker run -i ghcr.io/gander-tools/osm-tagging-schema-mcp:pr-42
```

### Example 2: Quick build via comment

```bash
# Comment on PR #42
gh pr comment 42 --body "/docker-build"

# Check workflow status
gh run list --workflow="Docker Build On-Demand"
```

### Example 3: Manual trigger for specific SHA

```bash
# Trigger workflow for PR #42
gh workflow run docker-build-on-demand.yml -f pr_number=42 -f push_image=true

# Watch the run
gh run watch
```

## Architecture

### Workflow Comparison

| Feature | `publish-docker.yml` | `docker-build-on-demand.yml` |
|---------|---------------------|------------------------------|
| **Trigger** | Automatic (push, tag) | On-demand (label, comment, manual) |
| **When** | Master, tags | Pull Requests |
| **Tags** | `latest`, `edge`, semver | `pr-<number>`, `pr-<number>-<sha>` |
| **Dockerfile** | `Dockerfile.release` (tags), `Dockerfile` (dev) | `Dockerfile` |
| **Platforms** | linux/amd64, linux/arm64 | linux/amd64, linux/arm64 |
| **Security** | Trivy, Cosign | Trivy, Cosign |

### Workflow Design

```
┌─────────────────┐
│ Trigger Source  │
│                 │
│ • Label         │
│ • Comment       │
│ • Manual        │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ check-trigger   │
│                 │
│ • Validate      │
│ • Get PR info   │
│ • Extract SHA   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ build-and-push  │
│                 │
│ • Checkout PR   │
│ • Build image   │
│ • Scan (Trivy)  │
│ • Sign (Cosign) │
│ • Comment on PR │
└─────────────────┘
```

## Best Practices

1. **Use labels for regular builds** - Easy to see which PRs have builds
2. **Use comments for quick tests** - Fast, no need to navigate to labels
3. **Use manual trigger for debugging** - Full control over inputs
4. **Clean up old PR images** - Delete images after PR merge
5. **Check security scans** - Review Trivy results before deploying

## Related Documentation

- [Deployment Guide](./deployment.md)
- [Security Features](./security.md)
- [Release Process](../development/release-process.md)
