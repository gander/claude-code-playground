# Release Process

This document describes the automated release workflow using Release Please and Conventional Commits.

## Overview

The release process is **fully automated** using [Release Please](https://github.com/googleapis/release-please):

1. **Developers** - Write commits following [Conventional Commits](https://www.conventionalcommits.org/) format
2. **Release Please** - Automatically creates/updates release PR based on commits
3. **Merge Release PR** - Triggers automatic npm publish, Docker builds, and GitHub release
4. **Done!** - Package is live, tags created, CHANGELOG updated

**Key benefits:**
- ✅ Zero manual release steps
- ✅ Automatic version bumping based on commit types
- ✅ Automatic CHANGELOG generation
- ✅ Automatic tagging and publishing
- ✅ Consistent release quality

## Prerequisites

- Git configured with your credentials
- Write access to the repository (for merging release PRs)
- Understanding of [Conventional Commits](https://www.conventionalcommits.org/)

## Conventional Commits

All commits to the master branch should follow the Conventional Commits format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

Release Please recognizes these commit types:

| Type | Description | Version Bump | Appears in CHANGELOG |
|------|-------------|--------------|---------------------|
| `feat:` | New feature | **Minor** (0.X.0) | ✅ Features |
| `fix:` | Bug fix | **Patch** (0.0.X) | ✅ Bug Fixes |
| `perf:` | Performance improvement | **Patch** (0.0.X) | ✅ Performance Improvements |
| `revert:` | Revert previous commit | **Patch** (0.0.X) | ✅ Reverts |
| `docs:` | Documentation only | **Patch** (0.0.X) | ✅ Documentation |
| `refactor:` | Code refactoring | **Patch** (0.0.X) | ✅ Code Refactoring |
| `style:` | Code style changes | **Patch** (0.0.X) | ❌ Hidden |
| `test:` | Test changes | **Patch** (0.0.X) | ❌ Hidden |
| `build:` | Build system changes | **Patch** (0.0.X) | ❌ Hidden |
| `ci:` | CI/CD changes | **Patch** (0.0.X) | ❌ Hidden |
| `chore:` | Miscellaneous changes | **Patch** (0.0.X) | ❌ Hidden |

### Breaking Changes

To trigger a **Major** version bump (X.0.0), include `BREAKING CHANGE:` in the commit footer:

```
feat: new API for tag validation

BREAKING CHANGE: validate_tag now returns a structured object instead of boolean
```

Or use the `!` marker:

```
feat!: redesign validate_tag API
```

### Examples

**Feature (minor version bump):**
```bash
git commit -m "feat: add search_tags tool for keyword-based tag search"
```

**Bug fix (patch version bump):**
```bash
git commit -m "fix: handle undefined values in tag validation"
```

**Documentation (patch version bump):**
```bash
git commit -m "docs: update installation guide with Docker instructions"
```

**Breaking change (major version bump):**
```bash
git commit -m "feat!: change validate_tag return format

BREAKING CHANGE: validate_tag now returns { valid: boolean, issues: string[] } instead of boolean"
```

**Multiple commits in one PR:**
```bash
git commit -m "feat: add get_preset_details tool"
git commit -m "test: add tests for get_preset_details"
git commit -m "docs: document get_preset_details API"
# Release Please will detect the feat: and bump minor version
```

## Release Workflow

### Step 1: Write Conventional Commits

All you need to do is write commits following the Conventional Commits format and merge them to master:

```bash
# Create feature branch
git checkout -b feat/add-new-tool

# Make changes
# ...

# Commit with conventional format
git commit -m "feat: add new tool for category exploration"

# Push and create PR
git push origin feat/add-new-tool
```

### Step 2: Merge to Master

Once your PR is approved and merged to master, **Release Please automatically**:

1. ✅ Analyzes all commits since last release
2. ✅ Determines version bump based on commit types
3. ✅ Generates/updates CHANGELOG.md
4. ✅ Creates or updates release PR

**You don't need to do anything!** Release Please handles it all.

### Step 3: Review Release PR

Release Please will create a PR like: **"chore(main): release 1.2.0"**

This PR contains:
- 📝 Updated `package.json` version
- 📝 Updated `CHANGELOG.md` with all changes
- 📝 Updated `.release-please-manifest.json`

**Review the release PR:**
1. Check version bump is correct (major/minor/patch)
2. Review CHANGELOG entries
3. Verify all important changes are documented

**Note:** The release PR is automatically updated when new commits are merged to master. You can keep merging features, and Release Please will update the version and CHANGELOG accordingly.

### Step 4: Merge Release PR

When you're ready to release, simply **merge the release PR**. This triggers automatic:

**GitHub Actions Workflow (`release-please.yml`):**
1. ✅ Runs all tests (unit, integration, type checking, linting)
2. ✅ Builds the package
3. ✅ Generates SBOM (Software Bill of Materials)
4. ✅ Creates SLSA Level 3 attestations
5. ✅ Publishes to npm with provenance
6. ✅ Creates Git tag (e.g., `v1.2.0`)
7. ✅ Updates GitHub release with artifacts
8. ✅ Uploads `dist.tar.gz` for Docker builds

**publish-docker.yml** (triggered by tag):
1. ✅ Builds multi-arch Docker images (amd64, arm64)
2. ✅ Publishes to GitHub Container Registry (ghcr.io)
3. ✅ Tags with version and `latest`
4. ✅ Runs Trivy vulnerability scanning
5. ✅ Signs images with Cosign

### Step 5: Done!

That's it! Your release is live:
- 📦 npm package published: https://www.npmjs.com/package/@gander-tools/osm-tagging-schema-mcp
- 🐳 Docker images published: https://github.com/gander-tools/osm-tagging-schema-mcp/pkgs/container/osm-tagging-schema-mcp
- 🏷️ Git tag created: `vX.Y.Z`
- 📋 GitHub release created: https://github.com/gander-tools/osm-tagging-schema-mcp/releases

## Release Please Configuration

Configuration is in `release-please-config.json`:

```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "package-name": "@gander-tools/osm-tagging-schema-mcp",
      "bump-minor-pre-major": true,
      "bump-patch-for-minor-pre-major": true,
      "changelog-sections": [
        // ... commit types mapping
      ]
    }
  }
}
```

**Key settings:**
- `release-type: "node"` - Node.js package (updates package.json)
- `bump-minor-pre-major: true` - Features bump minor version before 1.0.0
- `bump-patch-for-minor-pre-major: true` - Fixes bump patch before 1.0.0
- `changelog-sections` - Maps commit types to CHANGELOG sections

Current version is tracked in `.release-please-manifest.json`.

## Manual Releases (Emergency Only)

For emergency hotfixes or exceptional circumstances, use the manual workflow:

```bash
# Go to GitHub Actions
# → Workflows → "Publish to NPM (Manual Dispatch)"
# → Run workflow → Select master branch
```

**⚠️ Important:**
- Only use for emergencies (e.g., security hotfix)
- Ensure you're on master branch
- Manually update version in package.json first
- Creates draft GitHub release (you must publish manually)

## Version Strategy

Release Please automatically determines version bumps:

| Commits | Version Bump | Example |
|---------|--------------|---------|
| Only `fix:`, `docs:`, `refactor:` | **Patch** | 1.0.0 → 1.0.1 |
| At least one `feat:` | **Minor** | 1.0.0 → 1.1.0 |
| Any commit with `BREAKING CHANGE:` or `!` | **Major** | 1.0.0 → 2.0.0 |

**Pre-1.0.0 behavior:**
- `feat:` → bumps minor (0.1.0 → 0.2.0)
- `fix:` → bumps patch (0.1.0 → 0.1.1)
- Breaking changes → bumps minor (0.1.0 → 0.2.0)

**Post-1.0.0 behavior:**
- `feat:` → bumps minor (1.0.0 → 1.1.0)
- `fix:` → bumps patch (1.0.0 → 1.0.1)
- Breaking changes → bumps major (1.0.0 → 2.0.0)

## Troubleshooting

### Release PR not created

**Cause:** No releasable commits since last release (only `chore:`, `ci:`, `test:`, etc.)

**Solution:** Merge at least one `feat:`, `fix:`, or `docs:` commit to trigger release.

### Wrong version bump

**Cause:** Commits don't follow Conventional Commits format

**Solution:**
1. Ensure commits use correct prefixes (`feat:`, `fix:`, etc.)
2. For breaking changes, include `BREAKING CHANGE:` in footer or use `!`
3. Release Please only sees commits merged to master

### CHANGELOG missing entries

**Cause:** Commits are hidden types (`test:`, `chore:`, `ci:`, etc.)

**Solution:** Use visible types for user-facing changes:
- Use `fix:` instead of `chore:` for bug fixes
- Use `feat:` instead of `chore:` for new features
- Use `docs:` for documentation changes

### Need to skip release

**Cause:** Release PR created but you want to include more changes

**Solution:** Just keep merging PRs to master. Release Please automatically updates the release PR with new commits and adjusts version/CHANGELOG.

### Publishing failed

**Check GitHub Actions logs:**
1. Go to **Actions** tab
2. Find the failed "Release Please" workflow
3. Review error logs in the `publish-npm` job
4. Common issues:
   - Tests failing
   - Build errors
   - npm authentication issues

**Fix:**
1. Fix the issue in a new PR
2. Merge to master
3. Re-run the failed workflow or merge will trigger new run

### Need to undo a release

**If release PR not yet merged:**
- Just close the release PR
- Release Please will recreate it on next commit

**If release already published:**
- ⚠️ **Cannot unpublish npm packages** (npm policy)
- Must publish a new patch version with fixes
- Create PR with fixes, merge, and let Release Please create new release

### Want to release specific version

Release Please determines versions automatically. For manual control:

1. Use commit types strategically:
   - `fix:` for patch bumps
   - `feat:` for minor bumps
   - `feat!:` or `BREAKING CHANGE:` for major bumps

2. Or manually edit release PR before merging:
   - Edit `package.json` version
   - Edit `CHANGELOG.md` entries
   - Commit changes to release PR branch
   - Merge the updated release PR

## Comparison: Old vs New Process

### Old Process (release-it)
1. Run `npm run release` locally
2. Answer interactive prompts
3. Create release/vX.Y.Z branch manually
4. Push branch
5. Create PR manually
6. Merge PR
7. auto-release-from-pr.yml publishes

### New Process (Release Please)
1. Write conventional commits
2. Merge to master
3. **Done!** (Release Please handles everything)

**Time savings:** ~5 minutes per release → ~30 seconds

## Tools

- **Release Please**: Automated release management
  - Configuration: `release-please-config.json`
  - Manifest: `.release-please-manifest.json`
  - Documentation: https://github.com/googleapis/release-please
- **Conventional Commits**: Commit message standard
  - Documentation: https://www.conventionalcommits.org/
- **GitHub Actions**: CI/CD automation
  - `release-please.yml`: Automatic release PR and publishing
  - `publish-docker.yml`: Docker image publishing
  - `publish-npm.yml`: Manual emergency publishing
- **npm Trusted Publishers**: Secure publishing with OIDC authentication
- **SLSA Attestations**: Supply chain security

## Best Practices

1. **Write meaningful commit messages**: CHANGELOG is generated from commits
2. **Use correct commit types**: Determines version bump and CHANGELOG section
3. **Include descriptions**: Helps users understand changes
4. **One logical change per commit**: Makes CHANGELOG clearer
5. **Document breaking changes**: Always include `BREAKING CHANGE:` explanation
6. **Review release PRs**: Check version and CHANGELOG before merging
7. **Don't rush releases**: Let Release Please accumulate changes

## Related Documentation

- [contributing.md](./contributing.md) - Contribution guidelines (includes commit conventions)
- [CHANGELOG.md](../../CHANGELOG.md) - Version history
- [security.md](../deployment/security.md) - Security and provenance documentation
- [Release Please](https://github.com/googleapis/release-please) - Release automation tool
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit message standard
