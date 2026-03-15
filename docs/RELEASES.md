# Release Process

This document describes how to create and deploy releases for DevPockit.

## Branching Model

This project uses a two-branch model:

| Branch | Purpose |
|--------|---------|
| `main` | Production only — updated exclusively by release PRs from `develop`. Always stable and tagged. |
| `develop` | Active development — all feature branches merge here. |

This ensures fork users who sync `main` always get released, stable code. Tags always point to commits that exist in `main`, so they are available immediately after a fork sync.

## Release Workflow

1. **Development** happens on feature branches merged into `develop`.
2. When ready to release, open a **PR: `develop` → `main`**, including:
   - Updated `package.json` version
   - Updated `CHANGELOG.md`
3. **Merge the PR** after review and CI passes.
4. **Tag the merge commit** on `main` and push the tag — this triggers the release workflow.
5. **Automated**: GitHub Actions builds, deploys to GitHub Pages, and creates a GitHub release.

## Creating a Release

### Step 1: Prepare the release PR

On `develop` (or a dedicated `release/x.y.z` branch cut from `develop`):

1. **package.json**: Update the `version` field
   ```json
   {
     "version": "0.1.0"
   }
   ```

2. **CHANGELOG.md**: Add release notes for the new version
   ```markdown
   ## [0.1.0] - 2026-01-05

   ### Added
   - New features

   ### Changed
   - Changes

   ### Fixed
   - Bug fixes
   ```

3. **next.config.js**: Update version in environment variables (if needed)
   ```javascript
   env: {
     NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
   }
   ```

### Step 2: Open and merge the release PR

```bash
# On develop (or a release/x.y.z branch)
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 0.1.0"
git push origin develop   # or your release branch
```

Then open a PR on GitHub:
- **Base**: `main`
- **Compare**: `develop` (or `release/0.1.0`)
- Title: `chore: release v0.1.0`

Merge the PR after review and CI passes.

### Step 3: Tag the merge commit on main

```bash
git checkout main
git pull origin main

# Create annotated tag
git tag -a v0.1.0 -m "Release version 0.1.0"

# Push tag to trigger release workflow
git push origin v0.1.0
```

Or create the tag via GitHub:
1. Go to **Releases** → **Draft a new release**
2. Choose **Create new tag**: `v0.1.0`
3. **Target**: `main` (important — always tag from main)
4. Release title: `Release 0.1.0`
5. Description: Copy from CHANGELOG.md
6. Click **Publish release**

### Step 4: Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Watch the **Deploy DevPockit to GitHub Pages** workflow
3. Watch the **Create Release** workflow
4. Verify deployment at https://devpockit.hypkey.com/

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

### Pre-release Versions

- **Alpha**: `v0.1.0-alpha.1`
- **Beta**: `v0.1.0-beta.1`
- **RC**: `v0.1.0-rc.1`

Pre-releases are marked as pre-release in GitHub but still deploy to production.

## Release Checklist

Before creating a release:

- [ ] All tests passing (`pnpm test:ci`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Version updated in `package.json`
- [ ] CHANGELOG.md updated with release notes
- [ ] All changes committed and pushed
- [ ] Tag created and pushed

## Automated Workflows

### Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main` branch
- Push of version tag (`v*`)

**Actions:**
- Type checking
- Linting
- Building application
- Verifying build output
- Deploying to GitHub Pages

### Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Push of version tag (`v*`)

**Actions:**
- Type checking
- Linting
- Testing
- Building application
- Generating release notes from CHANGELOG.md
- Creating GitHub release
- Uploading build artifacts

## Manual Release (If Needed)

If automated workflows fail, you can manually deploy:

```bash
# Build locally
pnpm build

# Verify build
pnpm build:verify

# Deploy manually (depends on your hosting)
# For GitHub Pages: Push out/ directory
# For other platforms: Follow their deployment process
```

## Rollback

If a release has issues:

1. **Revert the tag** (if needed):
   ```bash
   git tag -d v0.1.0
   git push origin :refs/tags/v0.1.0
   ```

2. **Redeploy previous version**:
   - Push the previous tag again, or
   - Manually deploy from a previous commit

3. **Create hotfix release**:
   - Fix the issue
   - Create a patch version (e.g., `v0.1.1`)
   - Follow normal release process

## Release Notes

Release notes are automatically generated from `CHANGELOG.md`. The workflow:

1. Extracts the section for the version being released
2. Formats it as release notes
3. Adds a link to the full changelog
4. Includes a link to compare changes

### Format in CHANGELOG.md

```markdown
## [0.1.0] - 2026-01-05

### Added
- Feature 1
- Feature 2

### Changed
- Improvement 1

### Fixed
- Bug fix 1
```

## Environment Variables

The build process uses these environment variables (if set):

- `NEXT_PUBLIC_APP_VERSION`: Application version (defaults to package.json version)
- `NEXT_PUBLIC_APP_NAME`: Application name (defaults to "DevPockit")

These are set automatically during the release build.

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs
2. Verify build succeeds locally: `pnpm build`
3. Check for TypeScript errors: `pnpm type-check`
4. Check for linting errors: `pnpm lint`

### Release Not Created

1. Verify tag format: Must start with `v` (e.g., `v0.1.0`)
2. Check workflow permissions
3. Verify CHANGELOG.md exists and has the version section

### Version Mismatch Warning

If you see a warning that `package.json` version doesn't match the release tag:

1. **This means**: The tag was created before `package.json` was updated
2. **Solution**: Update `package.json` manually to match the tag:
   ```bash
   # Checkout main branch
   git checkout main

   # Update package.json version to match tag (e.g., 0.1.0)
   # Edit package.json: "version": "0.1.0"

   # Commit and push (via PR if branch is protected)
   git add package.json
   git commit -m "chore: update version to 0.1.0"
   git push origin main  # or create PR
   ```

3. **Prevention**: Always follow the workflow:
   - Update `package.json` first
   - Commit and merge PR
   - Then create the release tag

4. **Note**: The workflow will continue successfully even if versions don't match (warning only), since the git tag is the source of truth for versioning.

### Build Artifacts

Build artifacts are uploaded to GitHub Actions and kept for 30 days. You can download them from the workflow run.

---

For questions or issues with releases, please open an issue on GitHub.

