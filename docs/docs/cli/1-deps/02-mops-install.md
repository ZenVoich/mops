---
slug: /cli/mops-install
sidebar_label: mops install
---

# `mops install`

Install all dependencies specified in mops.toml
```
mops install
```

## Options

### `--lock`

What to do with the [lockfile](/mops.lock).

Default value is `update` if lockfile exists and `ignore` otherwise.

Possible values:
- `check` - check downloaded dependencies against lockfile
- `update` - update lockfile (create if not exists). Always checks after update
- `ignore` - ignore lockfile

### `--verbose`

Verbose output.