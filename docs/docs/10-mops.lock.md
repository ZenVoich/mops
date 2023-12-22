---
slug: /mops.lock
sidebar_label: mops.lock
---

# `mops.lock` file

:::info
Currently lockfile is disabled by default. You can enable it by running `mops i --lock update` once.

When `mops.lock` file exists, no need to specify `--lock` flag.
:::

`mops.lock` is used to ensure integrity of dependencies, so that you can be sure that all dependencies have exactly the same source code as they had when the package author published them to the Mops Registry.

`mops.lock` contains the following information:
- Hash of `[dependencies]` and `[dev-dependencies]` section of `mops.toml` file
- All transitive dependencies with the final resolved versions
- Hash of each file of each dependency

File hashes are retrieved from the mops registry canister.

When `mops.lock` exists, it is updated(and checked) automatically when you run any of the following commands:
- `mops add`
- `mops remove`
- `mops install`
- `mops update`
- `mops sync`

`mops.lock` maintained by Mops and should not be manually edited.