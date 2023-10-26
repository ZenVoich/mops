---
slug: /cli/mops-publish
sidebar_label: mops publish
---

# `mops publish`

Publish package to the mops registry
```
mops publish
```

You need to [import identity](/cli/mops-import-identity) before publishing a package.

Tests will be run before publishing to ensure the package works correctly.

Documentation for the package will be generated automatically from the source code(`src` folder) and published to the registry.

## Options

`--no-docs` - Do not generate docs

`--no-test` - Do not run tests