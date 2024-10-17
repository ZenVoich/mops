---
unlisted: true
slug: 0-unlisted
title: Unlisted
authors: [zen]
tags: []
---

### Summary
- Mops CLI updates (v1.1.0)
- More information of package dependencies and dependents

<!-- truncate -->

## Mops CLI updates

### Release 1.1.0

Run `mops self update` to update Mops CLI to the latest version.

- New `mops watch` command to check for syntax errors, show warnings, run tests, generate declarations and deploy canisters ([docs](https://docs.mops.one/cli/mops-watch))
- New flag `--no-toolchain` in `mops install` command to skip toolchain installation
- New lock file format v3 ([docs](https://docs.mops.one/mops.lock))
- Faster `mops install` from lock file when lock file is up-to-date and there are no cached packages
- Fixed replica test hanging in watch mode bug
- Fixed mops failing when dfx is not installed
- Fixed `mops test` Github Action template

## Fix GitHub images in package readme

Now images in the package readme are displayed correctly when main branch is `master` instead of `main`.