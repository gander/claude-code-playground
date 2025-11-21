# Release Process

This document describes the automated release workflow using cliff-jumper and GitHub Actions.

## Overview

The release process is fully automated through GitHub Actions workflows:

1. **prepare-release.yml** - Manually triggered to prepare a release
2. **publish-release.yml** - Automatically triggered after PR merge
3. **publish-npm.yml** - Automatically triggered by tag creation

## Release Workflow

### Step 1: Prepare Release (Manual)

Trigger the **Prepare Release** workflow through GitHub UI:

1. Go to **Actions** → **Prepare Release**
2. Click **Run workflow**
3. Enter version number (e.g., `0.3.0` - without `v` prefix)
4. Click **Run workflow**

**What happens:**
- ✅ Creates release branch: `release/v0.3.0`
- ✅ Bumps `package.json` version to `0.3.0`
- ✅ Generates CHANGELOG.md entry using cliff-jumper
- ✅ Commits changes with message: `chore(release): release osm-tagging-schema-mcp@0.3.0`
- ✅ Pushes branch to GitHub
- ✅ Creates Pull Request to `master` branch

### Step 2: Review and Merge PR

1. Review the auto-generated Pull Request
2. Check:
   - [ ] CHANGELOG.md entry is accurate
   - [ ] package.json version is correct
   - [ ] All tests are passing
3. Merge the PR when ready

### Step 3: Automatic Publishing (Triggered by Merge)

When the release PR is merged, **publish-release.yml** automatically:

1. ✅ Extracts version from branch name (`release/v0.3.0` → `0.3.0`)
2. ✅ Verifies `package.json` version matches
3. ✅ Creates git tag: `v0.3.0`
4. ✅ Pushes tag to GitHub

### Step 4: NPM Publishing and Release (Triggered by Tag)

When the tag is pushed, **publish-npm.yml** automatically:

1. ✅ Runs all tests (unit, integration, type checking, linting)
2. ✅ Builds the package
3. ✅ Generates SBOM (Software Bill of Materials)
4. ✅ Creates SLSA Level 3 attestations
5. ✅ Publishes to npm with provenance
6. ✅ Creates **draft** GitHub Release

### Step 5: Publish GitHub Release (Manual)

1. Go to **Releases** on GitHub
2. Find the draft release for your version
3. Review the release notes
4. Click **Publish release**

## Version Format

Always use semantic versioning: `MAJOR.MINOR.PATCH`

Examples:
- Patch release (bug fixes): `0.2.1` → `0.2.2`
- Minor release (new features): `0.2.1` → `0.3.0`
- Major release (breaking changes): `0.2.1` → `1.0.0`

**Important:** Enter version WITHOUT `v` prefix in the workflow input.

## Troubleshooting

### "Branch already exists"
- Delete the existing release branch or use a different version
- Command: `git push origin --delete release/vX.Y.Z`

### "Tag already exists"
- This version has already been released
- Use a higher version number

### "Package version mismatch"
- The merged code doesn't have the expected version
- This shouldn't happen with automated workflow - contact maintainers

### PR creation failed
- Check repository settings: **Settings** → **Actions** → **General**
- Enable: "Allow GitHub Actions to create and approve pull requests"

## Manual Release (Emergency)

If automated workflows fail, you can release manually:

```bash
# 1. Create release branch
git checkout -b release/v0.3.0 master

# 2. Run cliff-jumper
npx cliff-jumper 0.3.0 --skip-tag

# 3. Create PR manually
gh pr create --base master --title "release: v0.3.0"

# 4. After merge, create and push tag
git checkout master
git pull
git tag -a v0.3.0 -m "Release version 0.3.0"
git push origin v0.3.0

# 5. Wait for publish-npm.yml to complete
# 6. Publish the draft release through GitHub UI
```

## Tools

- **cliff-jumper**: Automated changelog generation and version management
- **GitHub Actions**: CI/CD automation
- **npm Trusted Publishers**: Secure publishing with OIDC authentication
- **SLSA Attestations**: Supply chain security

## Related Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [CHANGELOG.md](../CHANGELOG.md) - Version history
- [docs/security.md](./security.md) - Security and provenance documentation
