---
slug: 2024-10-08-updates
title: Updates 8 October, 2024
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

## More information of package dependencies and dependents

On the package page, in the "Dependencies" tab, you can see how old is a dependency and the latest available version of the dependency.

In the "Dependents" tab, you can see which version of a package a dependent package uses.