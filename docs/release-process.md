# Release Process

This document describes the local release workflow using cliff-jumper and GitHub Actions.

## Overview

The release process is initiated locally and automated through GitHub Actions:

1. **Local environment** - Prepare release using cliff-jumper (version bump + changelog)
2. **publish-npm.yml** - Automatically triggered by tag creation (npm publish)
3. **publish-docker.yml** - Automatically triggered by tag creation (Docker publish)

## Prerequisites

- Node.js 22+ installed
- npm 11.5.1+ installed
- Git configured with your credentials
- Write access to the repository
- Clean working directory (`git status` shows no changes)

## Release Workflow

### Step 1: Prepare Local Environment

Ensure your local repository is up to date:

```bash
# Switch to master branch
git checkout master

# Pull latest changes
git pull origin master

# Verify clean working directory
git status
```

### Step 2: Preview Release (Dry Run)

Before making any changes, preview what will be released:

```bash
# Preview version bump and changelog
npm run release:dry
```

**What this shows:**
- ✅ Version bump type (patch/minor/major)
- ✅ New version number
- ✅ Commits included in release
- ✅ CHANGELOG.md preview

**Verify:**
- [ ] Version bump is correct (patch/minor/major)
- [ ] All expected commits are included
- [ ] No unexpected commits are included

### Step 3: Create Release Locally

If the dry run looks good, create the release locally:

```bash
# Create release (updates package.json, CHANGELOG.md, creates commit + tag)
npm run release
```

**What happens:**
- ✅ Bumps version in `package.json` and `package-lock.json`
- ✅ Generates CHANGELOG.md entry using git-cliff
- ✅ Creates git commit: `chore(release): release <package-name>@X.Y.Z`
- ✅ Creates git tag: `vX.Y.Z`
- ⚠️ Changes are LOCAL only (not pushed yet)

**Verify:**
- [ ] `package.json` version is correct
- [ ] `CHANGELOG.md` entry is accurate
- [ ] Git tag created: `git tag -l`
- [ ] Git commit created: `git log -1`

### Step 4: Review Changes

Review the generated release:

```bash
# View the commit
git log -1

# View the tag
git tag -l

# View CHANGELOG.md changes
git diff HEAD~1 CHANGELOG.md

# View package.json changes
git diff HEAD~1 package.json
```

**If you need to make changes:**

```bash
# Delete the tag
git tag -d vX.Y.Z

# Reset the commit (keep changes)
git reset HEAD~1

# Make your changes to CHANGELOG.md or package.json
# Then commit manually:
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): release <package-name>@X.Y.Z"
git tag -a vX.Y.Z -m "Release version X.Y.Z"
```

### Step 5: Push Release to Trigger Publishing

When you're satisfied with the release, push to trigger automated publishing:

```bash
# Push commit and tag together
npm run release:push

# OR push manually:
git push && git push --tags
```

### Step 6: Automatic Publishing (Triggered by Tag)

When the tag is pushed, GitHub Actions automatically:

**publish-npm.yml:**
1. ✅ Runs all tests (unit, integration, type checking, linting)
2. ✅ Builds the package
3. ✅ Generates SBOM (Software Bill of Materials)
4. ✅ Creates SLSA Level 3 attestations
5. ✅ Publishes to npm with provenance
6. ✅ Creates **draft** GitHub Release

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

### Step 7: Publish GitHub Release (Manual)

1. Go to **Releases** on GitHub
2. Find the draft release for your version
3. Review the release notes
4. Edit if needed (add highlights, breaking changes, etc.)
5. Click **Publish release**

## Version Format

This project uses semantic versioning: `MAJOR.MINOR.PATCH`

**How cliff-jumper determines version:**

Based on conventional commit messages since last release:

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `fix:`, `chore:`, `docs:`, `style:`, `refactor:` | **Patch** | `0.2.1` → `0.2.2` |
| `feat:`, `add:` | **Minor** | `0.2.1` → `0.3.0` |
| Any commit with `BREAKING CHANGE:` in body/footer | **Major** | `0.2.1` → `1.0.0` |

**Examples:**
- Bug fix release: `0.2.1` → `0.2.2`
- New feature release: `0.2.1` → `0.3.0`
- Breaking change release: `0.2.1` → `1.0.0`

## Troubleshooting

### "Tag already exists"
This version has already been released. Use a higher version number or delete the existing tag:

```bash
# Delete local tag
git tag -d vX.Y.Z

# Delete remote tag (⚠️ use with caution)
git push origin :refs/tags/vX.Y.Z
```

### "Working directory not clean"
Commit or stash your changes before creating a release:

```bash
# Stash changes
git stash

# Or commit changes
git add .
git commit -m "your message"
```

### Release workflow failed
Check GitHub Actions logs:
- Go to **Actions** tab
- Find the failed workflow run
- Review error logs
- Fix issues and re-run or create new release

### Need to undo a release
If you pushed the tag but npm publish failed or you want to undo:

```bash
# Delete remote tag (stops automatic publishing)
git push origin :refs/tags/vX.Y.Z

# Delete local tag
git tag -d vX.Y.Z

# Reset local commit (if not pushed yet)
git reset --hard HEAD~1

# If commit was pushed, revert it
git revert HEAD
git push
```

**⚠️ Warning:** If the package was already published to npm, you cannot unpublish it (npm policy). You'll need to publish a new patch version.

## Manual Release (Without cliff-jumper)

If cliff-jumper fails or you need full manual control:

```bash
# 1. Update version in package.json
npm version patch  # or: minor, major

# 2. Edit CHANGELOG.md manually
# Add entry for new version

# 3. Commit changes
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): release <package-name>@X.Y.Z"

# 4. Create tag
git tag -a vX.Y.Z -m "Release version X.Y.Z"

# 5. Push commit and tag
git push && git push --tags

# 6. Wait for publish-npm.yml to complete
# 7. Publish the draft release through GitHub UI
```

## Tools

- **cliff-jumper**: Automated changelog generation and version management
  - Configuration: `.cliff-jumperrc.json`
- **git-cliff**: Changelog generator
  - Configuration: `cliff.toml`
- **GitHub Actions**: CI/CD automation
  - `publish-npm.yml`: npm publishing with SLSA attestations
  - `publish-docker.yml`: Docker image publishing
- **npm Trusted Publishers**: Secure publishing with OIDC authentication
- **SLSA Attestations**: Supply chain security

## Related Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [CHANGELOG.md](../CHANGELOG.md) - Version history
- [docs/security.md](./security.md) - Security and provenance documentation
- [Cliff-jumper docs](https://github.com/favware/cliff-jumper) - Release automation tool
- [git-cliff docs](https://git-cliff.org/) - Changelog generator
