# Mops

Mops is a package manager for the Motoko programming language.

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
If there are Vessel config files, mops will migrate packages from `vessel.dhall` to `mops.toml`

```
mops init
```

### 3. Install Motoko Packages
Use `mops add <package_name>` to install a specific package and save it to `mops.toml`

```
mops add base
```

You can also add packages from GitHub like this
```
mops add https://github.com/dfinity/motoko-base
```

You can also add local packages like this (put source files inside `src` directory)
```
mops add ./shared
```

Use `mops install` to install all packages specified in `mops.toml`
```
mops install
```

### 4. Import Package
Now you can import installed packages in your Motoko code

```motoko
import PackageName "mo:<package_name>";
```
for example
```motoko
import Itertools "mo:itertools/Iter";
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