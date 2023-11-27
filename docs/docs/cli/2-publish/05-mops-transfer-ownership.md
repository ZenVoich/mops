---
slug: /cli/mops-transfer-ownership
sidebar_label: mops transfer-ownership
---

# `mops transfer-ownership`

Transfer ownership of the current package to another user principal.

```
mops transfer-ownership <principal>
```

:::warning
This action cannot be undone!

After transfering ownership, you will no longer be able to publish new versions of the package.
:::

### Example

Imagine you have a package named `hello` and you want to transfer ownership to the principal `2d2zu-vaaaa-aaaak-qb6pq-cai`.

mops.toml:
```toml
[package]
name = "hello"
version = "0.1.0"
...
```

Transfer ownership:
```
mops transfer-ownership 2d2zu-vaaaa-aaaak-qb6pq-cai
```