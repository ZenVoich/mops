# MOPS

MOPS is a package manager for the Motoko programming language.

See https://mops.one

## Local Development
`npm run dev` - starts local replica and dev server

To be able to install/publish packages locally:

1. Make the following changes to the `cli/package.json`
```diff
{
-	"name": "ic-mops",
+	"name": "ic-mops-local",
	"version": "0.1.14",
	"type": "module",
	"bin": {
-		"mops": "cli.js"
+		"mops-local": "cli.js"
	},
...
```

2. Inside `cli` folder run
```
npm run link
```

2. Switch network to local
```
mops-local set-network local
```

3. Revert changes made to `cli/package.json`

Now you can install/publish packages locally like this `mops-local install lib`

------------
*Built for the [Supernova Hackathon](https://dfinity.org/supernova/)*