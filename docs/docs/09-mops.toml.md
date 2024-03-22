---
slug: /mops.toml
sidebar_label: mops.toml
---

# `mops.toml` file

### [package]

| Field        | Type   | Description                                      |
| ------------ | ------ | ------------------------------------------------ |
| name         | Text   | Package name (e.g. `lib`)                          |
| version      | Text   | Package version in format x.y.z (e.g. `0.1.2`)     |
| description  | Text   | Package description shown in search results      |
| repository   | Text   | Repository url (e.g. `https://github.com/dfinity/motoko`) |
| keywords     | [Text] | Array of keywords (max 10 items, max 20 chars)   |
| license      | Text   | Package license. Use [SPDX license identifier](https://spdx.org/licenses/) |

### [dependencies]

| Field                 | Type   | Description                                     |
| --------------------- | ------ | ----------------------------------------------- |
| <mops_package_name>        | Text   | Version in format x.y.z (e.g. `0.1.2`)              |
| <github_package_name> | Text   | Format: `https://github.com/<repo>#<branch/tag/ref>`<br/>Example: `https://github.com/dfinity/motoko-base#moc-0.11.0` |

### [dev-dependencies]

Same structure as `[dependencies]`.

`dev-dependencies` are only used for testing and benchmarking purposes. They are not installed when the package is used as a dependency.


### [toolchain]
See [toolchain management](/cli/toolchain) page for more details.

| Field                | Type   | Description                                      |
| -------------------- | ------ | ------------------------------------------------ |
| moc                  | Text   | Motoko compiler used for building canisters and running tests   |
| wasmtime             | Text   | WASM runtime used to run [tests](/cli/mops-test#--mode) in `wasi` mode   |
| pocket-ic            | Text   | Local IC replica used to run [benchmarks](/cli/mops-bench#--replica)   |