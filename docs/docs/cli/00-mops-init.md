---
# sidebar_position: 0.1
sidebar_label: 'mops init'
---

# CLI command `mops init`

Initialize a new project or package in the current directory
```
mops init
```

## Options

### `--yes`, `-y`

Initalize with all defaults

```
Publish a package:
  publish [options]                 Publish package to the mops registry
  bump [major|minor|patch]          Bump current package version

User:
  import-identity <data>            Import .pem file data to use as identity
  user set <prop> [value]           User settings
  user get <prop>                   User settings
  whoami                            Print your identity principal

Test and benchmark:
  test [options] [filter]           Run tests
  bench [options] [filter]          Run benchmarks

  sources [options]                 for dfx packtool
  search <text>                     Search for packages
  template                          Apply template

Other commands:
  cache <sub>                       Manage cache
  set-network|sn <network>          Set network local|staging|ic
  get-network|gn                    Get network
```