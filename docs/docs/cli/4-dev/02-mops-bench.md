---
slug: /cli/mops-bench
sidebar_label: mops bench
---

# `mops bench`

Run Motoko benchmarks.

```
mops bench [filter]
```

Put your benchmark code in `bench/*.bench.mo` files.

It is necessary to use [bench package](https://mops.one/bench) to write benchmarks.

The output format is a markdown table, so you can copy-paste it into your `README.md`.

### How it works

Under the hood, Mops will:
- Start a local replica on port `4944`
- Wrap each `*.bench.mo` file in a canister
- Compile canisters with `--force-gc` flag and deploy them
- Run each cell of the benchmark file as an update call
- For each call measure usage of wasm instructions(`performance_counter`) and heap size(`rts_heap_size`)

## Options

### `--replica`

Which replica to use.

Default `pocket-ic` if `pocket-ic` is specified in `mops.toml` in `[toolchain]` section, otherwise `dfx`.

Possible values:
- `dfx` - use `dfx` local replica
- `pocket-ic` - use [PocketIC](https://pypi.org/project/pocket-ic/) light replica via [pic.js](https://www.npmjs.com/package/@hadronous/pic) wrapper

### `--gc`

Select garbage collector.

Possible values:
- `copying` (default)
- `compacting`
- `generational`
- `incremental`

### `--save`

Save benchmark results to `.bench/<filename>.json` file.

### `--compare`

Compare benchmark results with the results from `.bench/<filename>.json` file.

### `--verbose`

Verbose output.