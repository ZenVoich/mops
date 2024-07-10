---
slug: updates-2024-07-15
title: Updates 15 July, 2024
authors: [zen]
tags: []
---

<!-- truncate -->

## Mops blog

This is the first blog post of the new Mops blog.

Further Mops updates will be posted here. Previous updates can be found in the [Dfinity forum](https://forum.dfinity.org/t/mops-on-chain-package-manager-for-motoko/17275/17)

## Mops CLI updates
- Added `--no-install` flag to `mops sources` command (by [@ZenVoich](https://github.com/ZenVoich))
- Updated npm dependencies (by [@ZenVoich](https://github.com/ZenVoich))

## GitHub Action update

New version `1.3.1` of [`setup-mops`](https://github.com/ZenVoich/setup-mops) action is released  (by [@ZenVoich](https://github.com/ZenVoich)).

The action is updated to use the on-chain storage to install Mops, which gave a **2x** speedup to the installation process (from ~20s to ~10s).

If you are using the action in this way:

```yaml
- uses: ZenVoich/setup-mops@v1
```

no changes are required from your side.