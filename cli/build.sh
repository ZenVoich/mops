COMMIT_HASH=4c22b5ec37c5da9c8231656cf56f8a06dba09308
MOPS_VERSION=0.0.0

# build on host machine
npm version $MOPS_VERSION --allow-same-version
npm run release

# build verifiable bundle using Docker
docker build . --build-arg COMMIT_HASH=$COMMIT_HASH --build-arg MOPS_VERSION=$MOPS_VERSION -t mops

# replace cli.tgz with the one from the Docker container
cid=$(docker create mops)
docker cp $cid:/mops/cli/bundle/cli.tgz ./bundle/cli.tgz

# verify
# docker run --rm --env SHASUM=d57fc281a24fb12b0b6ef72cac4d478b357e6f22dca53bcc4a5506759fc96b06 mops