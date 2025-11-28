# Docker Build On-Demand

This document describes how to trigger Docker image builds on-demand for Pull Requests.

## Overview

The `publish-docker.yml` workflow handles both version tag releases and on-demand PR builds. For Pull Requests, it allows you to build and publish Docker images on-demand without automatically building on every PR push. This saves CI resources and provides flexibility to build only when needed.

**Build Triggers:**
- ✅ **Version tags** (v*.*.*): Automatic release builds
- ✅ **On-demand PR builds**: Manual trigger, label (`docker:build`), or comment (`/docker-build`)
- ❌ **NOT on push to master**: No automatic builds on master branch
- ❌ **NOT on regular PR events**: Only on-demand triggers work for PRs

## Security & Permissions

**IMPORTANT:** This workflow includes security protections to prevent untrusted code execution.

### Permission Requirements

Only users with **write access** to the repository can trigger Docker builds:

- ✅ **Repository maintainers** (admin/write access)
- ✅ **Collaborators with write permission**
- ❌ **External contributors** (read-only access)
- ❌ **First-time contributors**

### Why Permission Checks?

The workflow checks out and builds code from Pull Requests, which could potentially contain malicious code. Permission checks ensure that only trusted team members can trigger builds, preventing:

- **Code injection attacks** through PR comments
- **Execution of untrusted code** in privileged workflow context
- **Secret exfiltration** during build process
- **Supply chain attacks** through malicious dependencies

### Permission Denied

If a user without write access attempts to trigger a build, they will receive a notification:

```markdown
### ⚠️ Docker Build Permission Denied

@username, you do not have permission to trigger Docker builds.

**Required permission:** Write access to the repository

**What you can do:**
- Ask a maintainer to trigger the build for you
- Request write access if you are a regular contributor
```

### Security Model & Trade-offs

**Known Risk:** The workflow checks out and builds code from PRs in a privileged context with access to secrets and registry credentials.

**Mitigation Strategies:**

1. **Permission Gating** (Primary Defense)
   - Only users with write/admin access can trigger builds
   - Verified via GitHub API before checkout
   - External contributors cannot trigger builds

2. **Shallow Clone**
   - `fetch-depth: 1` - only current commit
   - Reduces exposure to git history manipulation

3. **Credential Isolation**
   - `persist-credentials: false` - no git credentials in working directory
   - GITHUB_TOKEN not accessible in repository after checkout

4. **Minimal Permissions**
   - Each job has only required permissions
   - Default permissions: read-only

**Residual Risk:**

Even with permission checks, **trusted users with write access can execute arbitrary code** during Docker build. This is an accepted trade-off for on-demand PR builds.

**Risk Acceptance:**
- ✅ Acceptable: Trusted team members need to test PR changes
- ✅ Mitigated: Permission checks prevent external contributors
- ⚠️  Residual: Malicious insider with write access could abuse this
- 🛡️ Defense-in-depth: Vulnerability scanning, image signing, SARIF reporting

**Recommendations for Maximum Security:**

If your threat model requires zero risk from PR code execution:
- Use manual approval gates before builds
- Build in isolated environment without secrets
- Use separate service account with limited access
- Review Dockerfile changes before triggering builds

### Architecture Decision: Permission Gating vs workflow_run Pattern

**Current Implementation:** Permission Gating (single workflow with permission checks)

**GitHub Recommended Pattern:** `workflow_run` (two-workflow pattern with build/publish separation)

#### Why We Chose Permission Gating

This workflow uses **permission gating** instead of GitHub's recommended `workflow_run` pattern. This is a deliberate architectural decision based on the following considerations:

**Permission Gating Approach (Current):**
```
issue_comment/pull_request (labeled)
  → Permission check (write/admin required)
  → Checkout PR code
  → Build + Push (privileged context)
```

**Advantages:**
- ✅ Simpler architecture (1 workflow vs 2)
- ✅ Faster execution (no artifact upload/download overhead)
- ✅ Easier to debug and maintain
- ✅ Sufficient for trusted team environment
- ✅ Clear user experience (direct trigger → result)

**Accepted Trade-offs:**
- ⚠️ Build runs in privileged context with secrets
- ⚠️ Trusted users can execute code during build (insider threat)
- ⚠️ Not GitHub's strictest security recommendation

#### Alternative: workflow_run Pattern

GitHub's recommended approach for maximum security:

**workflow_run Approach (Alternative):**
```
Workflow 1 (unprivileged):
  pull_request trigger
  → Build image (no secrets)
  → Upload artifact (image tar)

Workflow 2 (privileged):
  workflow_run trigger
  → Download artifact
  → Verify artifact
  → Push to registry (with secrets)
```

**Advantages of workflow_run:**
- ✅ Build isolated from secrets (zero insider threat during build)
- ✅ GitHub security best practice
- ✅ Complete separation of build/publish

**Why We Didn't Use It:**
- ❌ Significantly more complex (2 workflows, artifact management)
- ❌ Slower (artifact upload/download adds minutes)
- ❌ Harder to debug (split across workflows)
- ❌ Poor UX for on-demand builds (no direct trigger)
- ❌ Overkill for trusted team with low insider threat

#### When to Migrate to workflow_run

Consider migrating to `workflow_run` pattern if:
- 📊 **Team Growth**: Repository has 10+ contributors with write access
- 🔓 **Open Contribution Model**: Frequently granting write access to new contributors
- 💰 **High-Value Targets**: Building images for production infrastructure
- 🏢 **Compliance Requirements**: Security audits mandate build/publish separation
- 🚨 **Insider Threat Model**: Need protection against malicious insiders

#### Implementation Recommendation

For most projects like this one:
- **Permission gating is sufficient** - trusted team, on-demand convenience feature
- **Four security layers** provide adequate defense-in-depth
- **Simplicity has value** - easier to maintain and understand

For high-security environments:
- **Use workflow_run pattern** - maximum isolation
- **Accept complexity trade-off** - security over convenience
- **See GitHub docs**: [Keeping your GitHub Actions secure](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions)

## Trigger Methods

There are **three ways** to trigger an on-demand Docker build:

### 1. Manual Trigger (workflow_dispatch)

**Best for:** Testing specific PRs, ad-hoc builds

1. Go to **Actions** tab in GitHub
2. Select **"Docker Build and Publish"** workflow
3. Click **"Run workflow"**
4. Enter the PR number (or leave empty for tag build)
5. Choose whether to push the image (default: true)
6. Click **"Run workflow"**

```
PR number: 123 (or leave empty for tag build)
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

All on-demand builds include multiple layers of security:

1. **Permission Checks**: Only users with write access can trigger builds
2. **Vulnerability Scanning**: Trivy scans for CRITICAL and HIGH severity issues
3. **Image Signing**: Cosign keyless signing for image verification
4. **SARIF Upload**: Security findings uploaded to GitHub Security tab
5. **Input Sanitization**: All user inputs (comments, labels) are sanitized to prevent code injection

## Image Verification

Verify the image signature:

```bash
cosign verify \
  --certificate-identity-regexp="https://github.com/gander-tools/osm-tagging-schema-mcp/.*" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  ghcr.io/gander-tools/osm-tagging-schema-mcp:pr-123
```

## Automatic Builds

The `publish-docker.yml` workflow handles automatic builds for:

- ✅ **Version tags** (v*.*.*) → `latest`, semantic version tags

**Removed:**
- ❌ **Push to master** → No longer builds automatically on master
- ❌ **Pull Request** → Use on-demand triggers instead (label, comment, manual)

## Workflow Permissions

The workflow requires these GitHub Actions permissions:

- `contents: read` - Checkout repository
- `packages: write` - Push to GitHub Container Registry
- `id-token: write` - Cosign keyless signing
- `security-events: write` - Upload Trivy results
- `pull-requests: write` - Comment on PRs

**User Permissions:** Only users with **write** or **admin** access to the repository can trigger builds.

## Troubleshooting

### Permission denied

**Problem:** User gets "Docker Build Permission Denied" notification

**Cause:** User does not have write access to the repository

**Solutions:**
- **For external contributors:** Ask a maintainer to trigger the build
- **For team members:** Request write access from repository admin
- **For maintainers:** You can trigger builds for any PR

### Label not working

**Problem:** Adding `docker:build` label doesn't trigger the workflow

**Solutions:**
1. **Check label exists:**
   - Go to **Issues** → **Labels**
   - Create label named exactly: `docker:build`

2. **Check permissions:**
   - Only users with write access can trigger builds
   - Verify you have write access to the repository

### Comment not working

**Problem:** `/docker-build` comment doesn't trigger the workflow

**Solutions:**
- **Check permissions:** Only users with write access can trigger builds
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
gh run list --workflow="Docker Build and Publish"
```

### Example 3: Manual trigger for specific SHA

```bash
# Trigger workflow for PR #42
gh workflow run publish-docker.yml -f pr_number=42 -f push_image=true

# Watch the run
gh run watch
```

## Architecture

### Build Types

The `publish-docker.yml` workflow handles two types of builds:

| Feature | **Release Builds** | **On-Demand PR Builds** |
|---------|-------------------|-------------------------|
| **Trigger** | Version tags (v*.*.*) | Label, comment, manual |
| **When** | Tag push | Pull Requests |
| **Tags** | `latest`, semver (e.g., `1`, `1.2`, `1.2.3`) | `pr-<number>`, `pr-<number>-<sha>` |
| **Dockerfile** | `Dockerfile.release` (uses prebuilt `dist/` artifact) | `Dockerfile` (builds from source) |
| **Platforms** | linux/amd64, linux/arm64 | linux/amd64, linux/arm64 |
| **Security** | Trivy, Cosign | Trivy, Cosign |
| **Post-Build** | Webhook notification | PR comment |

### Workflow Design

```
┌──────────────────────┐
│   Trigger Source     │
│                      │
│ • Version tag (v*.*.*)│
│ • Label (docker:build)│
│ • Comment (/docker-build)│
│ • Manual (workflow_dispatch)│
└──────────┬───────────┘
           │
           v
┌──────────────────────┐
│  check-build-type    │
│                      │
│ • Determine type     │
│   (release/on-demand)│
│ • Permission check   │
│ • Tag validation     │
│ • Get PR info        │
└──────────┬───────────┘
           │
           v
┌──────────────────────┐
│   build-and-push     │
│                      │
│ Release builds:      │
│ • Checkout tag       │
│ • Download dist/     │
│ • Build (Dockerfile.release)│
│ • Push tags          │
│ • Send webhook       │
│                      │
│ On-demand builds:    │
│ • Checkout PR SHA    │
│ • Build (Dockerfile) │
│ • Push PR tags       │
│ • Comment on PR      │
│                      │
│ Both:                │
│ • Scan (Trivy)       │
│ • Sign (Cosign)      │
└──────────────────────┘
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
