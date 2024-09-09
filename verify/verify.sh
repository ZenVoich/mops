# COMMIT_HASH=b18cafb288b25d48caa922ea69216a12a511ff25
# MOPS_VERSION=1.0.0-pre.0
# SHASUM=1c78eab58e41282a071218169062dc4f82ac7ab6ae45f95630150ae2f2fca0e2

# git clone https://github.com/ZenVoich/mops.git
# cd mops
# git checkout $COMMIT_HASH

# cd cli
# npm install
# npm version $MOPS_VERSION
# npm run release

# actual_shasum=$(shasum -a 256 mops/cli/bundle/cli.tgz | head -n1 | awk '{print $1;}')
actual_shasum=$(sha256sum bundle/cli.tgz | head -n1 | awk '{print $1;}')

if [ "$actual_shasum" != "$SHASUM" ]; then
  echo "Expected shasum: $SHASUM"
  echo "Actual shasum: $actual_shasum"
  echo "Verification failed"
  exit 1
else
  echo "Verification successful for shasum: $actual_shasum"
fi

# build:
# docker build . --build-arg COMMIT_HASH=1f69fb4076cef8f4f27b7422a1ac0c184fa37126 --build-arg MOPS_VERSION=0.0.0 -t mops

# copy cli.tgz:
# cid=$(docker create mops)
# docker cp $cid:/mops/cli/bundle/cli.tgz .

# verify:
# docker run --rm --env SHASUM=d57fc281a24fb12b0b6ef72cac4d478b357e6f22dca53bcc4a5506759fc96b06 mops