---
slug: /mops.toml
sidebar_label: mops.toml
---

# `mops.toml` file

### [package]

| Field        | Description                                      |
| ------------ | ------------------------------------------------ |
| name         | Package name (e.g. `lib`)                          |
| version      | Package version in format x.y.z (e.g. `0.1.2`)     |
| description  | Package description shown in search results      |
| repository   | Repository url (e.g. `https://github.com/dfinity/motoko`) |
| keywords     | Array of keywords (max 10 items, max 20 chars)   |
| license      | Package license. Use [SPDX license identifier](https://spdx.org/licenses/) |

### [dependencies]

| Field                 | Description                                     |
| --------------------- | ----------------------------------------------- |
| <mops_package_name>        | Version in format x.y.z (e.g. `0.1.2`)              |
| <github_package_name> | Format: `https://github.com/<repo>#<branch/tag/ref>`<br/>Example: `https://github.com/dfinity/motoko-base#moc-0.11.0` |

### [dev-dependencies]

Same structure as `[dependencies]`.

`dev-dependencies` are only used for testing and benchmarking purposes. They are not installed when the package is used as a dependency.


### [toolchain]
See [toolchain management](/cli/toolchain) page for more details.

| Field                | Description                                      |
| -------------------- | ------------------------------------------------ |
| moc                  | Motoko compiler used for building canisters and running tests   |
| wasmtime             | WASM runtime used to run [tests](/cli/mops-test#--mode) in `wasi` mode   |
| pocket-ic            | Local IC replica used to run [benchmarks](/cli/mops-bench#--replica)   |


### [requirements]

When a user installs your package(as a transitive dependency too), Mops will check if the requirements are met and display a warning if they are not.

| Field                | Description                                      |
| -------------------- | ------------------------------------------------ |
| moc                  | Motoko compiler version  (e.g. `0.11.0` which means `>=0.11.0`)  |