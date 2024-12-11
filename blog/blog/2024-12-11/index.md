---
slug: 2024-12-11-updates
title: Updates 11 December, 2024
authors: [zen]
tags: []
---

### Summary
- Mops CLI updates (v1.2.0, v1.1.2)
- Multiple package owners and maintainers support
- Package documentation fixes

<!-- truncate -->

## Mops CLI updates

Run `mops self update` to update Mops CLI to the latest version.

### Release 1.2.0
- Removed `mops transfer-ownership` command
- Added `mops owner` command to manage package owners ([docs](https://docs.mops.one/cli/mops-owner))
- Added `mops maintainers` command to manage package maintainers ([docs](https://docs.mops.one/cli/mops-maintainers))
- Added experimental support for pocket-ic replica that comes with dfx in `mops test` command ([docs](https://docs.mops.one/cli/mops-test#--replica))
- Added flag `--verbose` to `mops test` command to show replica logs
- Fixed bug where `mops watch` would fail if dfx.json did not exist
- Fixed bug with local dependencies without `mops.toml` file

### Release 1.1.2
- Fixed `{MOPS_ENV}` substitution in local package path

## Multiple package owners and maintainers support

Now each package can have multiple owners and maintainers. Owners have full access to the package, while maintainers can only publish new versions.

On "Versions" tab you can see who published each version of the package.

Documentation:
- [Package owners and maintainers](https://docs.mops.one/package-owners-and-maintainers)
- [`mops owner *`](https://docs.mops.one/cli/mops-owner) commands
- [`mops maintainers *`](https://docs.mops.one/cli/mops-maintainers) commands

## Package documentation fixes

Fixed scroll to definition in the package documentation.