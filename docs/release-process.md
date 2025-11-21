# Release Process

This document describes the manual release workflow using git-cliff and GitHub Actions.

## Overview

The release process is initiated locally and automated through GitHub Actions:

1. **Local environment** - Prepare release manually (version bump + changelog with git-cliff)
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

### Step 2: Determine Version Bump

Decide on the version bump based on changes since last release:

- **Patch** (0.1.0 → 0.1.1): Bug fixes, documentation, chores
- **Minor** (0.1.0 → 0.2.0): New features, backwards-compatible changes
- **Major** (0.1.0 → 1.0.0): Breaking changes

Review commits since last release:

```bash
# View commits since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

### Step 3: Update Version

Bump version in `package.json` and `package-lock.json`:

```bash
# Choose one:
npm version patch   # 0.1.0 → 0.1.1 (bug fixes)
npm version minor   # 0.1.0 → 0.2.0 (new features)
npm version major   # 0.1.0 → 1.0.0 (breaking changes)
```

This command:
- ✅ Updates `package.json` version
- ✅ Updates `package-lock.json` version
- ✅ Creates git commit with message: `X.Y.Z`
- ✅ Creates git tag: `vX.Y.Z`

### Step 4: Generate CHANGELOG

Generate changelog entry using git-cliff:

```bash
# Generate changelog for all versions
npx git-cliff --output CHANGELOG.md

# Or generate for specific version range
npx git-cliff --tag vX.Y.Z --output CHANGELOG.md
```

**Manually verify CHANGELOG.md:**
- [ ] New version entry added at top
- [ ] All commits categorized correctly
- [ ] Breaking changes highlighted
- [ ] Links to PRs/commits working

### Step 5: Amend Release Commit

Add CHANGELOG.md to the release commit:

```bash
# Stage CHANGELOG.md
git add CHANGELOG.md

# Amend the version commit
git commit --amend --no-edit
```

Now you have a single commit with:
- ✅ Version bump in package.json
- ✅ Version bump in package-lock.json
- ✅ Updated CHANGELOG.md
- ✅ Git tag vX.Y.Z

### Step 6: Review Changes

Review the release commit and tag:

```bash
# View the commit
git show HEAD

# Verify the tag
git tag -l vX.Y.Z

# View CHANGELOG.md entry
git diff HEAD~1 CHANGELOG.md
```

**If you need to make changes:**

```bash
# Delete the tag
git tag -d vX.Y.Z

# Reset the commit (keep changes)
git reset --soft HEAD~1

# Make your changes to CHANGELOG.md or package.json
# Then repeat steps 3-5
```

### Step 7: Push Release to Trigger Publishing

When you're satisfied with the release, push to trigger automated publishing:

```bash
# Push commit and tag together
git push && git push --tags
```

### Step 8: Automatic Publishing (Triggered by Tag)

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

### Step 9: Publish GitHub Release (Manual)

1. Go to **Releases** on GitHub
2. Find the draft release for your version
3. Review the release notes
4. Edit if needed (add highlights, breaking changes, etc.)
5. Click **Publish release**

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

### git-cliff not generating changelog correctly

Check `cliff.toml` configuration:

```bash
# Preview what git-cliff will generate
npx git-cliff --unreleased

# Test with specific tag range
npx git-cliff --tag vX.Y.Z --unreleased
```

## Tools

- **git-cliff**: Changelog generator
  - Configuration: `cliff.toml`
  - Documentation: https://git-cliff.org/
- **npm version**: Version bumping
  - Built into npm
- **GitHub Actions**: CI/CD automation
  - `publish-npm.yml`: npm publishing with SLSA attestations
  - `publish-docker.yml`: Docker image publishing
- **npm Trusted Publishers**: Secure publishing with OIDC authentication
- **SLSA Attestations**: Supply chain security

## Related Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [CHANGELOG.md](../CHANGELOG.md) - Version history
- [docs/security.md](./security.md) - Security and provenance documentation
- [git-cliff docs](https://git-cliff.org/) - Changelog generator
