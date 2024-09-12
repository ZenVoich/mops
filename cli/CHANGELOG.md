# Mops CLI Changelog

## unreleased
- `mops cache clean` now cleans local cache too (`.mops` folder)
- Conflicting dependencies are now reported on `mops add/install/sources`
- New `--conflicts <action>` option in `mops sources` command ([docs](https://docs.mops.one/cli/mops-sources#--conflicts))
- New "Stable Memory" and "Garbage Collection" metrics are now reported in the `mops bench` command
- `mops test` command now supports `replica` mode for running actor tests ([docs](https://docs.mops.one/cli/mops-test#--mode))
- New `--replica` option in `mops test` command
- Updated npm dependencies

**Breaking changes**:
- Default replica in `mops bench` and `mops test` commands now is `pocket-ic` if `pocket-ic` is specified in `mops.toml` in `[toolchain]` section and `dfx` otherwise
- The only supported version of `pocket-ic` is `4.0.0`
- Dropped support for `wasmtime` version `< 14.0.0`
- Default reporter in `mops test` command is now `files` if test file count is > 1 and `verbose` otherwise.
- Renamed `mops import-identity` command to `mops user import`
- Renamed `mops whoami` command to `mops user get-principal`
- Removed the ability to install a specific package with `mops install <pkg>` command. Use `mops add <pkg>` instead.
- Removed legacy folders migration code. If you are using Mops CLI  `<= 0.21.0`, you need first to run `npm i -g ic-mops@0.45.3` to migrate your legacy folders. After that, you can run `mops self update` to update your Mops CLI to the latest version.
- Removed `--verbose` flag from `mops sources` command

## 0.45.3
- Fixed bug with missing `tar` package

## 0.45.2
- Updated npm dependencies

## 0.45.0
- Updated npm dependencies
- Added `--no-install` flag to `mops sources` command
- Added `--verbose` flag to `mops publish` command
- Added support for [dependency version pinning](https://docs.mops.one/dependency-version-pinning)
- Suppress hashing tool detecting error in `moc-wrapper.sh` on Linux
- Fixed `moc-wrapper` error when no `.mops` folder exists
- Fixed cache folder delete on github install error

## 0.44.1
- Fixed fallback to dfx moc if there is no mops.toml

## 0.44.0
- Optimized `moc` toolchain resolving (~30% faster builds)

## 0.43.0
- Add `mops cache show` command
- Fix github legacy deps install

## 0.42.1
- Fix package requirements check from subdirectories
- Fix local and global cache inconsistency

## 0.42.0
- Package requirements support ([docs](https://docs.mops.one/mops.toml#requirements))
- Refactor `mops install` command
- Reduce install threads to 12 (was 16)
- Reduce install threads to 6 when install called from `mops sources`
- Install dependencies directly to global cache, copy to local cache only final resolved dependencies

## 0.41.1
- Fix bin path for npm

## 0.41.0
- Add `mops self update` command to update the CLI to the latest version
- Add `mops self uninstall` command to uninstall the CLI

## 0.40.0
- Publish package benchmarks