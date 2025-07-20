# BAML Native Modules

This directory contains platform-specific native modules for @boundaryml/baml.

## Overview

BAML native modules are platform-specific and loaded at runtime instead of being
bundled by Rollup.

## GitHub Actions Runners

For now, only **Linux x64** modules are kept in this repository since
GitHub-hosted runners use Linux x64 architecture:

- **baml-linux-x64-gnu**
- **baml-linux-x64-musl**

Other platform modules (macOS, Windows, ARM64) are commented out in the download
script but can be uncommented if needed for local development or self-hosted
runners.

## Rollup Configuration

These modules are marked as `external` in `rollup.config.ts` to prevent
bundling:

```typescript
external: [
  '@boundaryml/baml-darwin-arm64',
  '@boundaryml/baml-darwin-x64',
  '@boundaryml/baml-linux-arm64-gnu',
  '@boundaryml/baml-linux-arm64-musl',
  '@boundaryml/baml-linux-x64-gnu',
  '@boundaryml/baml-linux-x64-musl',
  '@boundaryml/baml-win32-x64-msvc'
]
```

## Updating Modules

To update the modules after a BAML version upgrade:

1. **Using the download script:**

   ```bash
   ./download.sh [version]
   ```

   Examples:

   ```bash
   ./download.sh              # Downloads version 0.201.0 (default)
   ./download.sh 0.202.0      # Downloads specific version
   ```

2. **Manual update:**
   - Check the latest version: `npm info @boundaryml/baml version`
   - Update the VERSION variable in `download.sh`
   - Run the script to download new modules

3. **Update Rollup config:**
   - Ensure all module names are listed in the `external` array in
     `rollup.config.ts`

## Structure

Each module directory contains:

- `package.json` - Module metadata
- `baml.[platform].node` - Native binary for the specific platform
- `README.md` - Platform-specific documentation

## Version

Current modules are version: **0.201.0**
