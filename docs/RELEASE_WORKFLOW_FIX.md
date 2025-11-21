# Fix: NPM Publish Workflow Not Triggering on Tag Push

## Problem

When `publish-release.yml` creates and pushes a tag (e.g., `v1.0.2`), the `publish-npm.yml` workflow does **NOT** trigger automatically.

### Root Cause

GitHub Actions **does not trigger workflows** for events created by `GITHUB_TOKEN`. This is by design to prevent infinite workflow loops.

From [GitHub Docs](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#using-the-github_token-in-a-workflow):

> When you use the repository's GITHUB_TOKEN to perform tasks, events triggered by the GITHUB_TOKEN will not create a new workflow run.

### Current Flow

1. ✅ PR with `release/v1.0.2` branch is merged to `master`
2. ✅ `publish-release.yml` triggers (on PR close)
3. ✅ Tag `v1.0.2` is created and pushed (using `GITHUB_TOKEN`)
4. ❌ `publish-npm.yml` does NOT trigger (tag push event ignored)

## Solution: Use Personal Access Token (PAT)

### Step 1: Create Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → **Fine-grained tokens**
2. Click **Generate new token**
3. Configure:
   - **Token name**: `osm-tagging-schema-release-workflow`
   - **Expiration**: 1 year (or custom)
   - **Repository access**: Only select repositories → `gander-tools/osm-tagging-schema-mcp`
   - **Permissions**:
     - Repository permissions:
       - **Contents**: Read and write (for creating tags)
       - **Pull requests**: Read (for reading PR metadata)

4. Click **Generate token**
5. **Copy the token** (you won't see it again!)

### Step 2: Add Token as Repository Secret

1. Go to repository Settings → Secrets and variables → Actions
2. Click **New repository secret**
3. Name: `RELEASE_PAT`
4. Value: Paste the token from Step 1
5. Click **Add secret**

### Step 3: Update `publish-release.yml` Workflow

Modify `.github/workflows/publish-release.yml` to use the PAT:

```yaml
      - name: Checkout merged code
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1
        with:
          ref: master
          fetch-depth: 0
          token: ${{ secrets.RELEASE_PAT }}  # ← ADD THIS LINE

      # ... other steps ...

      - name: Create and push tag
        env:
          GITHUB_TOKEN: ${{ secrets.RELEASE_PAT }}  # ← ADD THIS LINE
        run: |
          TAG="${{ steps.version.outputs.version_tag }}"
          VERSION="${{ steps.version.outputs.version }}"

          echo "📌 Creating tag: $TAG"
          git tag -a "$TAG" -m "Release version $VERSION"

          echo "⬆️  Pushing tag to origin"
          git push origin "$TAG"

          echo "✅ Tag created and pushed: $TAG"
          echo "::notice title=Tag Created::Tag $TAG created and pushed to origin"
```

### Step 4: Test the Fix

1. Trigger a new release with `prepare-release` workflow
2. Merge the release PR
3. Verify:
   - ✅ Tag is created by `publish-release.yml`
   - ✅ `publish-npm.yml` workflow **TRIGGERS** automatically
   - ✅ Package is published to npm
   - ✅ GitHub Release is created

## Alternative Solution: Manual Tag Push

If you don't want to use PAT, you can manually trigger npm publish:

```bash
# After merging release PR to master
git checkout master
git pull origin master

# Create and push tag manually
git tag -a v1.0.2 -m "Release version 1.0.2"
git push origin v1.0.2

# This will trigger publish-npm.yml workflow
```

## Verification

Check if workflow triggered:

1. Go to https://github.com/gander-tools/osm-tagging-schema-mcp/actions
2. Look for "Publish to NPM" workflow run
3. Check if it was triggered by tag push event

## Security Considerations

### Why PAT is Safe Here

1. **Fine-grained permissions**: Token has minimal permissions (only Contents write + PR read)
2. **Repository-scoped**: Token works only for this specific repository
3. **Workflow-isolated**: Token is only used in one specific workflow step
4. **Automated process**: No manual intervention, reduces human error
5. **Expiration**: Token expires after set period (renew annually)

### Best Practices

- ✅ Use fine-grained PAT (not classic PAT)
- ✅ Set expiration date
- ✅ Limit permissions to minimum required
- ✅ Scope to specific repository only
- ✅ Rotate token periodically (set calendar reminder)
- ✅ Document token purpose in GitHub Settings

## References

- [GitHub Actions: GITHUB_TOKEN Limitations](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#using-the-github_token-in-a-workflow)
- [Triggering a workflow from a workflow](https://docs.github.com/en/actions/using-workflows/triggering-a-workflow#triggering-a-workflow-from-a-workflow)
- [Fine-grained Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token#creating-a-fine-grained-personal-access-token)
