---
# sidebar_position: 0
sidebar_label: 'mops import-identity'
---

# CLI command `mops import-identity`

Import `.pem` file data to use as identity.

To be able to publish a packages to the `mops` registry, you need to import an identity from DFX.

## Import identity from DFX

```
mops import-identity -- "$(dfx identity export <identity_name>)"
```

For example, create a new DFX identity named `mops` and import it into the `mops` CLI

```
dfx identity new mops
mops import-identity -- "$(dfx identity export mops)"
```