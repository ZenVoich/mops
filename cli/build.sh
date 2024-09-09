COMMIT_HASH=231e08c3410a2f1c854af5da1c96ead0af51579d
MOPS_VERSION=0.0.0

# build verifiable bundle using Docker
docker build . --build-arg COMMIT_HASH=$COMMIT_HASH --build-arg MOPS_VERSION=$MOPS_VERSION -t mops

# print hash
docker run --rm mops || echo ""

# build on host machine
# npm version $MOPS_VERSION --allow-same-version
# npm run release

# replace cli.tgz with the one from the Docker container
cid=$(docker create mops)
docker cp $cid:/mops/cli/bundle/cli.tgz ./bundle/cli.tgz

# verify
# docker run --rm --env SHASUM=d57fc281a24fb12b0b6ef72cac4d478b357e6f22dca53bcc4a5506759fc96b06 mops