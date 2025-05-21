---
slug: /cli/mops-watch
sidebar_label: mops watch
sidebar_position: 5
---

# `mops watch`

Watch Motoko files and check for syntax errors, warnings, run tests, generate declarations and deploy canisters

```
mops watch
```

By default, `mops watch` will:
- Check for syntax errors
- Check for warnings
- Run tests
- Generate declarations for Motoko canisters
- Deploy Motoko canisters to the local replica

## Options

### `--error`

Check Motoko files for syntax errors.

Always enabled.

```
mops watch --error
```

### `--warning`

Check Motoko files for warnings.

```
mops watch --warning
```

### `--format`

Format Motoko files.

```
mops watch --format
```

### `--test`

Run Motoko tests.

```
mops watch --test
```

### `--generate`

Generate declarations for Motoko canisters from `dfx.json` that have `declarations` field.

```
mops watch --generate
```

### `--deploy`

Deploy Motoko canisters to the local replica.

```
mops watch --deploy
```

## Examples

Check syntax errors, show warnings, run tests, generate declarations and deploy canisters

```
mops watch
```

Check syntax errors and show warnings

```
mops watch --warning
```

Check syntax errors, run tests, generate declarations and deploy canisters

```
mops watch --test --generate --deploy
```
or
```
mops watch -tgd
```