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