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
  mocPath="$(mops toolchain bin moc --fallback)"
else
  if command -v openssl >/dev/null 2>&1; then
    mopsTomlHash=$(openssl sha256 $mopsToml | awk -F'= ' '{print $2}')
  else
    mopsTomlHash=$(shasum $mopsToml -a 256 | awk -F' ' '{print $1}')
  fi;

  cached="$rootDir/.mops/moc-$(uname -n)-$mopsTomlHash"

  if [ -f $cached ]; then
    mocPath=$(cat $cached)
    if [[ "$mocPath" != *"/moc" ]] ; then
      mocPath="$(mops toolchain bin moc --fallback)"
      echo -n $mocPath > "$cached"
    fi;
  else
    mkdir -p "$(dirname $cached)"
    mocPath="$(mops toolchain bin moc --fallback)"
    echo -n $mocPath > "$cached"
  fi;
fi;

$mocPath "$@"
