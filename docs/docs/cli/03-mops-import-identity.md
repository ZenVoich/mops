---
# sidebar_position: 0
# sidebar_label: 'mops import-identity'
---

# `mops import-identity`

Import `.pem` file data to use as identity.

```
mops import-identity -- <pem_data>
```

To be able to publish a packages to the `mops` registry, you need to import an identity from DFX.

### Import identity from DFX

```
mops import-identity -- "$(dfx identity export <identity_name>)"
```

### Example

1. Create new identity in DFX named `mops`

```
dfx identity new mops
```

2. Import identity into `mops`

```
mops import-identity -- "$(dfx identity export mops)"
```