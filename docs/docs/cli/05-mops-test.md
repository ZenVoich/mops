---
# sidebar_position: 0
sidebar_label: 'mops test'
---

# CLI command `mops test`

Mops can run Motoko unit tests
```
mops test
```

Put your tests in `test/*.test.mo` files.

See [test package](https://mops.one/test) to help you write tests.

## Options

### `--reporter`, `-r`

Test reporter.

```
--reporter <reporter>
```

Available reporters:

- `verbose` - print each test name (default)
- `files` - print only test files
- `compact` - pretty progress bar
- `silent` - print only errors


### `--watch`, `-w`

Re-run tests every time you change *.mo files.

```
--watch
```


### `--mode`

Test run mode

```
--mode <mode>
```

Available modes:

- `interpreter` - run tests via `moc -r` (default)
- `wasi` - compile test file to wasm and execute it with `wasmtime`. Useful, when you use `to_candid`/`from_candid`, or if you get stackoverflow errors.


You can also specify `wasi` mode for a specific test file by adding the line below as the first line in the test file
```
// @testmode wasi
```