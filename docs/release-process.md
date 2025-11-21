# Release Process

This document describes the release workflow using release-it and git-cliff.

## Overview

The release process is initiated locally using release-it and automated through GitHub Actions:

1. **Local environment** - Prepare release using release-it (version bump + changelog with git-cliff)
2. **publish-npm.yml** - Automatically triggered by tag creation (npm publish)
3. **publish-docker.yml** - Automatically triggered by tag creation (Docker publish)

## Prerequisites

- Node.js 22+ installed
- npm 11.5.1+ installed
- Git configured with your credentials
- Write access to the repository
- Clean working directory (`git status` shows no changes)
- All tests passing locally

## Release Workflow

### Quick Start

For most releases, use these simple commands:

```bash
# Patch release (bug fixes): 1.0.0 → 1.0.1
npm run release:patch

# Minor release (new features): 1.0.0 → 1.1.0
npm run release:minor

# Major release (breaking changes): 1.0.0 → 2.0.0
npm run release:major

# Or let release-it prompt you interactively:
npm run release
```

### Detailed Steps

### Step 1: Prepare Local Environment

Ensure your local repository is up to date:

```bash
# Switch to master branch
git checkout master

# Pull latest changes
git pull origin master

# Verify clean working directory
git status

# Ensure all tests pass
npm run test
npm run lint
npm run typecheck
```

### Step 2: Dry Run (Optional but Recommended)

Preview what release-it will do without making any changes:

```bash
# Preview the release
npm run release:dry
```

**What dry run shows:**
- ✅ Current version and next version
- ✅ Commits since last release
- ✅ CHANGELOG preview
- ✅ Git commands that will be executed
- ✅ GitHub release that will be created

### Step 3: Create Release

Run release-it to create the release:

```bash
# Interactive mode (prompts for version bump)
npm run release

# Or specify version bump directly:
npm run release:patch  # Bug fixes (1.0.0 → 1.0.1)
npm run release:minor  # New features (1.0.0 → 1.1.0)
npm run release:major  # Breaking changes (1.0.0 → 2.0.0)
```

**What happens:**
1. ✅ Bumps version in `package.json` and `package-lock.json`
2. ✅ Generates CHANGELOG.md using git-cliff
3. ✅ Creates git commit: `chore(release): release vX.Y.Z`
4. ✅ Creates git tag: `vX.Y.Z`
5. ✅ Pushes commit and tag to GitHub
6. ✅ Creates draft GitHub Release

**Interactive prompts:**
- Version bump selection (if not specified)
- Confirmation before pushing
- Confirmation before creating GitHub release

### Step 4: Automatic Publishing (Triggered by Tag)

When the tag is pushed, GitHub Actions automatically:

**publish-npm.yml:**
1. ✅ Runs all tests (unit, integration, type checking, linting)
2. ✅ Builds the package
3. ✅ Generates SBOM (Software Bill of Materials)
4. ✅ Creates SLSA Level 3 attestations
5. ✅ Publishes to npm with provenance
6. ✅ Updates draft GitHub Release with security info

**publish-docker.yml:**
1. ✅ Builds multi-arch Docker images (amd64, arm64)
2. ✅ Publishes to GitHub Container Registry (ghcr.io)
3. ✅ Tags with version and `latest`
4. ✅ Runs Trivy vulnerability scanning
5. ✅ Signs images with Cosign

**Monitor progress:**
- GitHub Actions: https://github.com/gander-tools/osm-tagging-schema-mcp/actions
- npm package: https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp
- Docker images: https://github.com/gander-tools/osm-tagging-schema-mcp/pkgs/container/osm-tagging-schema-mcp

### Step 5: Publish GitHub Release (Manual)

1. Go to **Releases** on GitHub
2. Find the draft release for your version
3. Review the release notes
4. Edit if needed (add highlights, breaking changes, etc.)
5. Click **Publish release**

## Release-It Configuration

Configuration is in `.release-it.json`:

- **Git**: Commit message format, tag format, branch requirements
- **Hooks**: Runs git-cliff after version bump
- **GitHub**: Creates draft releases automatically
- **npm**: Publishing disabled (done by GitHub Actions workflow)

**Key settings:**
- `requireBranch: "master"` - Only allow releases from master
- `requireCleanWorkingDir: true` - No uncommitted changes
- `hooks.after:bump` - Runs git-cliff to generate CHANGELOG

## Troubleshooting

### "Working directory not clean"
Commit or stash your changes before creating a release:

```bash
# Check what's uncommitted
git status

# Stash changes
git stash

# Or commit changes
git add .
git commit -m "your message"
```

### "Not on master branch"
release-it requires you to be on the master branch:

```bash
git checkout master
git pull origin master
```

### "Tag already exists"
This version has already been released. Choose a higher version:

```bash
# Check existing tags
git tag -l

# If you need to delete a tag (⚠️ use with caution)
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z
```

### Release workflow failed
Check GitHub Actions logs:
- Go to **Actions** tab
- Find the failed workflow run
- Review error logs
- Fix issues locally and create new release

### Need to undo a release (before push)

If release-it failed or you want to undo before pushing:

```bash
# Cancel release-it when prompted
# Or if commit was already created:

# Delete the tag
git tag -d vX.Y.Z

# Reset the commit
git reset --hard HEAD~1
```

### Need to undo a release (after push)

If you already pushed the tag:

```bash
# Delete remote tag (stops automatic publishing)
git push origin :refs/tags/vX.Y.Z

# Delete local tag
git tag -d vX.Y.Z

# Revert the commit
git revert HEAD
git push
```

**⚠️ Warning:** If the package was already published to npm, you cannot unpublish it (npm policy). You'll need to publish a new patch version.

### git-cliff not generating changelog correctly

Check `cliff.toml` configuration:

```bash
# Preview what git-cliff will generate
npx git-cliff --unreleased

# Test with specific tag
npx git-cliff --tag vX.Y.Z --unreleased
```

## Tools

- **release-it**: Release automation tool
  - Configuration: `.release-it.json`
  - Documentation: https://github.com/release-it/release-it
- **git-cliff**: Changelog generator
  - Configuration: `cliff.toml`
  - Documentation: https://git-cliff.org/
- **GitHub Actions**: CI/CD automation
  - `publish-npm.yml`: npm publishing with SLSA attestations
  - `publish-docker.yml`: Docker image publishing
- **npm Trusted Publishers**: Secure publishing with OIDC authentication
- **SLSA Attestations**: Supply chain security

## Release Scripts

```bash
# Interactive release (prompts for version)
npm run release

# Dry run (preview without changes)
npm run release:dry

# Specific version bumps
npm run release:patch  # Bug fixes
npm run release:minor  # New features
npm run release:major  # Breaking changes
```

## Related Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [CHANGELOG.md](../CHANGELOG.md) - Version history
- [docs/security.md](./security.md) - Security and provenance documentation
- [release-it docs](https://github.com/release-it/release-it) - Release automation tool
- [git-cliff docs](https://git-cliff.org/) - Changelog generator
