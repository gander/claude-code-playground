# Release Process

This document describes the release workflow using release-it and git-cliff.

## Overview

The release process is initiated locally using release-it and fully automated through GitHub Actions:

1. **Local environment** - Prepare release using release-it (version bump + changelog with git-cliff)
2. **auto-release-tag.yml** - Automatically creates tags when release PR is merged to master
3. **publish-npm.yml** - Automatically triggered by tag creation (npm publish)
4. **publish-docker.yml** - Automatically triggered by tag creation (Docker publish)

**Key improvement**: Tags are now created automatically after PR merge, eliminating the manual tag creation step and ensuring releases only happen from the master branch.

## Prerequisites

- Node.js 22+ installed
- npm 11.5.1+ installed
- Git configured with your credentials
- Write access to the repository
- Clean working directory (`git status` shows no changes)
- All tests passing locally

## Release Workflow

### Quick Start

```bash
# Interactive release (prompts for version)
npm run release

# Dry run (preview without changes)
npm run release:dry
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
```

**What happens:**
1. ✅ Prompts for version bump (patch/minor/major/custom)
2. ✅ Bumps version in `package.json` and `package-lock.json`
3. ✅ Generates CHANGELOG.md using git-cliff
4. ✅ Creates release branch: `release/vX.Y.Z`
5. ✅ Creates git commit: `chore(release): release vX.Y.Z`
6. ✅ Pushes release branch to GitHub
7. ⏸️  **No tag created** (tag created automatically after PR merge)
8. ⏸️  **No GitHub release** (created by workflow after automatic tagging)

**Interactive prompts:**
- Version bump selection
- Confirmation before each step

### Step 4: Create Pull Request

After release-it finishes:

1. Go to GitHub repository
2. You'll see a notification about new branch `release/vX.Y.Z`
3. Click "Create Pull Request" (or auto-PR workflow creates it)
4. Review the PR:
   - ✅ Check version in package.json
   - ✅ Review CHANGELOG.md entry
   - ✅ Verify commit message
5. Get review/approval (if required)
6. Merge PR to master

### Step 5: Automatic Tag Creation (Triggered by PR Merge)

After merging the release PR to master, GitHub Actions automatically:

**auto-release-tag.yml:**
1. ✅ Detects release branch merge (`release/vX.Y.Z` → `master`)
2. ✅ Extracts version from branch name
3. ✅ Validates version format (vX.Y.Z)
4. ✅ Verifies package.json version matches release branch
5. ✅ Creates annotated git tag: `vX.Y.Z`
6. ✅ Pushes tag to repository
7. ✅ Adds comment to merged PR with status

**Security safeguards:**
- Only processes release branches merged to master
- Validates version consistency between package.json and branch name
- Checks for duplicate tags before creation

### Step 6: Automatic Publishing (Triggered by Tag)

When the tag is pushed, GitHub Actions automatically:

**publish-npm.yml:**
1. ✅ Validates tag was created from master branch (security)
2. ✅ Runs all tests (unit, integration, type checking, linting)
3. ✅ Builds the package
4. ✅ Generates SBOM (Software Bill of Materials)
5. ✅ Creates SLSA Level 3 attestations
6. ✅ Publishes to npm with provenance
7. ✅ Updates draft GitHub Release with security info

**publish-docker.yml:**
1. ✅ Validates tag was created from master branch (security)
2. ✅ Builds multi-arch Docker images (amd64, arm64)
3. ✅ Publishes to GitHub Container Registry (ghcr.io)
4. ✅ Tags with version and `latest`
5. ✅ Runs Trivy vulnerability scanning
6. ✅ Signs images with Cosign

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

## Release-It Configuration

Configuration is in `.release-it.json`:

- **Git**: Commit message format, branch requirements, no tagging
- **Hooks**:
  - `after:bump` - Runs git-cliff to generate CHANGELOG
  - `before:git:release` - Creates release branch
- **GitHub**: Disabled (releases created by workflow)
- **npm**: Publishing disabled (done by GitHub Actions workflow)

**Key settings:**
- `requireBranch: "master"` - Start releases from master branch
- `requireCleanWorkingDir: true` - No uncommitted changes
- `git.tag: false` - Don't create tag (done manually after merge)
- `git.push: true` - Push release branch to GitHub
- `github.release: false` - Don't create GitHub release (done by workflow)

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
# Cancel release-it when prompted (press Ctrl+C)
# Or if branch was already pushed:

# Delete remote release branch
git push origin --delete release/vX.Y.Z

# Delete local release branch
git branch -D release/vX.Y.Z
```

### Automatic Tag Creation Failed

If the auto-release-tag workflow fails:

```bash
# Check workflow logs
# Go to Actions → Auto-Create Release Tag → View logs

# Common issues:
# 1. Version format invalid (not vX.Y.Z)
# 2. package.json version doesn't match branch
# 3. Tag already exists

# To fix and retry:
# 1. Fix the issue locally
# 2. Create new release PR with corrected version
# 3. Merge the new PR
```

### Tag Created from Wrong Branch

If a tag was accidentally created from a feature branch:

```bash
# The workflows will detect this and block deployment
# You'll see security warnings in Actions logs

# To fix:
# 1. Delete the wrong tag
git push origin :refs/tags/vX.Y.Z
git tag -d vX.Y.Z

# 2. Ensure the release commit is on master
git checkout master
git log --oneline  # verify release commit is here

# 3. Create tag from master
git tag -a vX.Y.Z -m "Release version X.Y.Z"
git push origin vX.Y.Z
```

### Need to undo a release (after PR merge)

If you already merged the release PR but want to undo:

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
  - `auto-release-tag.yml`: Automatic tag creation from release PRs
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
```

## Release Workflow Summary

1. **Local**: `npm run release` → creates `release/vX.Y.Z` branch
2. **GitHub**: Create PR from release branch
3. **Review**: Check version, CHANGELOG, get approval
4. **Merge**: Merge PR to master
5. **Auto-Tag**: GitHub Actions automatically creates `vX.Y.Z` tag
6. **Auto-Publish**: GitHub Actions automatically publish to npm + Docker
7. **Manual**: Publish draft GitHub Release (optional)

**Key Benefits:**
- ✅ No manual tag creation required
- ✅ Automatic security validation (master branch only)
- ✅ Version consistency validation
- ✅ Eliminates human error in tagging process

## Related Documentation

- [contributing.md](./contributing.md) - Contribution guidelines
- [CHANGELOG.md](../../CHANGELOG.md) - Version history
- [security.md](../deployment/security.md) - Security and provenance documentation
- [release-it docs](https://github.com/release-it/release-it) - Release automation tool
- [git-cliff docs](https://git-cliff.org/) - Changelog generator
