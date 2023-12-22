---
slug: /cli/mops-update
sidebar_label: mops update
---

# `mops update`

Update all dependencies
```
mops update
```

Update only a specific dependency
```
mops update [pkg]
```

### Example

Update the `base` package to the latest version:
```
mops update base
```

## Options

### `--lock`

What to do with the [lockfile](/mops.lock).

Default value is `update` if lockfile exists and `ignore` otherwise.

Possible values:
- `update` - update lockfile (create if not exists). Always checks after update
- `ignore` - ignore lockfile