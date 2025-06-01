---
slug: 2025-06-01-updates
title: Updates 1 June, 2025
authors: [zen]
tags: []
---

### Summary
- Mops CLI updates
  - v1.8.0
  - v1.7.2
  - v1.7.1
  - v1.7.0
  - v1.6.1
  - v1.6.0
  - v1.5.1

<!-- truncate -->

## Mops CLI updates

Run `mops self update` to update Mops CLI to the latest version.

### Release 1.8.0
- Add `mops format` command for formatting Motoko source files with Prettier and Motoko plugin ([docs](https://docs.mops.one/cli/mops-format))
- Add `--format` flag to `mops watch` command to enable automatic formatting during watch mode ([docs](https://docs.mops.one/cli/mops-watch#--format))

### Release 1.7.2
- Fix replica termination in `mops test` command

### Release 1.7.1
- Fix `mops install` for local dependencies

### Release 1.7.0
- Add support for `actor class` detection to run replica tests in `mops test` command

### Release 1.6.1
- Fix `mops i` alias for `mops install` command (was broken in 1.3.0)

### Release 1.6.0
- Add support for `.bash_profile` and `.zprofile` files to `mops toolchain init` command

### Release 1.5.1
- Collapsible output of `mops bench` in a CI environment
- Fix regression in `mops bench` without `dfx.json` file (by @rvanasa)

### Release 1.5.0
- Compile benchmarks with `--release` flag by default
- Respect `profile` field in `dfx.json` for benchmarks

### Release 1.4.0
- Update `mops bench` command output:
  - Print only final results if benchmarks run in a CI environment or there is no vertical space to progressively print the results
  - Hide "Stable Memory" table if it has no data
  - Hide verbose output when running in a CI environment ("Starting replica...", "Running simple.bench.mo...", etc.)
  - Add LaTeX colors to the diffs when running in a CI environment with `--compare` flag
- CLI now fails if excess arguments are passed to it

### Release 1.3.0
- Show error on `mops install <pkg>` command. Use `mops add <pkg>` instead.
- Added support for pocket-ic replica that comes with dfx in `mops bench` command. To activate it, remove `pocket-ic` from `mops.toml` and run `mops bench --replica pocket-ic`. Requires dfx 0.24.1 or higher.
- `mops init` now pre-fills package name with current directory name in kebab-case
- Updated non-major npm dependencies