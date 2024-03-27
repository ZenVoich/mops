# Mops CLI

1. Update the version in `package.json` using `npm version` command.

2. Update changelog in `CHANGELOG.md` file.

3. Publish.

## Publish to npm
```
npm publish
```

## Publish on chain

1. Prepeare release
```
npm run release
```

2. Deploy canister
(from root of the project)
```
dfx deploy --network ic --no-wallet cli
```