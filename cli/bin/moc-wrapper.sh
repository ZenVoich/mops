#!/bin/bash

# TODO: find nearest mops.toml if we are inside subfolders
rootDir="$(pwd)"
mopsToml="$rootDir/mops.toml"

if [ ! -f $mopsToml ]; then
  echo "$mopsToml not found"
  exit 1;
fi;

mopsTomlHash=$(openssl sha256 $mopsToml | awk -F'= ' '{print $2}')
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
