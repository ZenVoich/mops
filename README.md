# MOPS

MOPS is a package manager for the Motoko programming language.

See https://mops.one

## Setup

### 1. Check system requirements
- [Node.js](https://nodejs.org/)
- [DFX](https://internetcomputer.org/docs/current/developer-docs/quickstart/local-quickstart) >= 0.10.0

### 2. Install CLI tool
```
npm i -g ic-mops
```

## Install Packages

### 1. Configure dfx.json
Add `mops` as a packtool to your `dfx.json`

```json
{
  "defaults": {
    "build": {
      "packtool": "mops sources"
    }
  }
}
```

### 2. Initialize
Run this command in the root directory of your project (where is `dfx.json` placed)

```
mops init
```

### 3. Install Motoko Packages
Install your favorite packages

```
mops add <package_name>
```

### 4. Import Package
Now you can import installed packages in your Motoko code

```motoko
import Lib "mo:<package_name>";
```

## Publish a Package

### 1. Import Identity
Create new identity to publish packages

```
dfx identity new mops
```

Import identity into `mops`

```
mops import-identity -- "$(dfx identity export mops)"
```

### 2. Initialize
Run this command in your package root

```
mops init <your_package_name>
```

Edit `description` and `repository` fields in `mops.toml` file.

Write your package code in `*.mo` source files in the `src/` directory.

Create `README.md` file with information on how to use your package.

### 3. Publish
Publish package to the mops registry!

```
mops publish
```

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
