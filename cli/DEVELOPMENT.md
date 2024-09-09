# Mops CLI

1. Update the version in `package.json` using `npm version` command.

2. Update changelog in `CHANGELOG.md` file.

3. Publish.

## Publish to npm
```
npm publish
```

## Publish on chain verifiable build

1. Push latest commit to `main` branch

1. Build verifiable build using Docker

```
cd verify
cid=$(docker create mops)
docker build . --build-arg COMMIT_HASH=<commit_hash> --build-arg MOPS_VERSION=<mops_version> -t mops
```

2. Copy `cli.tgz` to the root of the project
```
docker run --rm --env SHASUM=<sha256sum> mops
```

1. Prepeare release
```
npm run release
```

2. Deploy canister
(from root of the project)
```
dfx deploy --network ic --no-wallet cli
```