---
slug: /cli/mops-remove
sidebar_label: mops remove
---

# `mops remove`

Alias `mops rm`

Remove package and update mops.toml

```
mops remove <package_name>
```

## Options

### `--dev`
Remove package from `[dev-dependencies]` section.

### `--lock`

What to do with the [lockfile](/mops.lock).

Default value is `update` if lockfile exists and `ignore` otherwise.

Possible values:
- `update` - update lockfile (create if not exists). Always checks after update
- `ignore` - ignore lockfile

### `--dry-run`

Do not actually remove anything

### `--verbose`

Verbose output.