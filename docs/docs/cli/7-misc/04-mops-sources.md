---
slug: /cli/mops-sources
sidebar_label: mops sources
---

# `mops sources`

Prints the final resolved package sources.

The main purpose of this command is to be specified in the dfx.json file:
```json
...
	"defaults": {
		"build": {
			"packtool": "mops sources"
		}
	},
...
```

The output is formatted to be passed to the `moc`.

Example output:
```
--package base .mops/base@0.10.4/src
--package time-consts .mops/time-consts@1.0.1/src
--package map .mops/map@9.0.1/src
--package ic .mops/ic@1.0.1/src
```
