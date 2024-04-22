#!/bin/bash

# set -e

findRootDir() {
  dir="$(pwd)"
  while [[ "$dir" != "" && ! -e "$dir/mops.toml" ]]; do
    dir=${dir%/*}
  done
  echo "$dir"
}

rootDir=$(findRootDir)
mopsToml="$rootDir/mops.toml"

if [[ $rootDir == "" ]] || [[ ! -f $mopsToml ]]; then
  echo "mops.toml not found in $rootDir or its parent directories"
  exit 1;
fi;

if command -v openssl &> /dev/null; then
  mopsTomlHash=$(openssl sha256 $mopsToml | awk -F'= ' '{print $2}')
else
  mopsTomlHash=$(shasum $mopsToml -a 256 | awk -F' ' '{print $1}')
fi;

cached="$rootDir/.mops/moc-$mopsTomlHash"

if [ -f $cached ]; then
  mocPath=$(cat $cached)
  if [[ "$mocPath" != *"/moc" ]] ; then
    mocPath="$(mops toolchain bin moc --fallback)"
    echo -n $mocPath > "$cached"
  fi;
else
  mocPath="$(mops toolchain bin moc --fallback)"
  echo -n $mocPath > "$cached"
fi;

$mocPath "$@"
