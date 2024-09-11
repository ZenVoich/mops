actual_shasum=$(sha256sum bundle/cli.tgz | head -n1 | awk '{print $1;}')

if [ "$actual_shasum" != "$SHASUM" ]; then
  echo "Expected shasum: $SHASUM"
  echo "Actual shasum: $actual_shasum"
  echo "Verification failed"
  exit 1
else
  echo "Verification successful for shasum: $actual_shasum"
fi