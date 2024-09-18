set -e

# default: current commit hash
COMMIT_HASH=${COMMIT_HASH:-$(git rev-parse HEAD)}
# default: current mops version
MOPS_VERSION=${MOPS_VERSION:-$(npm pkg get version | tr -d \")}

echo "Commit hash: $COMMIT_HASH"
echo "Mops version: $MOPS_VERSION"

# build verifiable bundle using Docker
docker build . --build-arg COMMIT_HASH=$COMMIT_HASH --build-arg MOPS_VERSION=$MOPS_VERSION -t mops

# print hash
docker run --rm mops || echo ""

# replace cli.tgz with the one from the Docker container
cid=$(docker create mops)
echo "Container ID: $cid"
mkdir -p bundle
docker cp $cid:/mops/cli/bundle/cli.tgz ./bundle/cli.tgz

# verify
# docker run --rm --env SHASUM=d57fc281a24fb12b0b6ef72cac4d478b357e6f22dca53bcc4a5506759fc96b06 mops