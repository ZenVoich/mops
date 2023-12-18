#!/bin/bash

# FILE_NAME=$(basename "$0");

# function findMopsTomlFile() {
#   if [ -f "mops.toml" ]; then
#     printf '%s\n' "${PWD%/}/mops.toml"
#   elif [ "$PWD" = / ]; then
#     false
#   else
#     # a subshell so that we don't affect the caller's $PWD
#     (cd .. && findMopsTomlFile "mops.toml")
#   fi
# }

# mopsTomlFile="$(findMopsTomlFile)"

# cat $mopsTomlFile

# mocPath=""
# if [ -z "$mopsTomlFile" ]
# then
#   mocPath="$HOME/.cache/mocv/versions/$(cat $HOME/.cache/mocv/versions/current/version.txt)/$FILE_NAME"
#   # mocPath="$(DFX_WARNING=-version_check dfx cache show)/$FILE_NAME"
# else
#   mocPath="$HOME/.cache/mocv/versions/$(cat $mopsTomlFile)/$FILE_NAME"
# fi

# fallback to dfx
# mocPath="$(DFX_WARNING=-version_check dfx cache show)/moc"

# echo $mocPath

# # install moc version if not installed yet
# if [[ ! -f "$mocPath" && -f "$mopsTomlFile" ]]; then
#   # mocv install --silent $(cat $mopsTomlFile)
#   mocv use $(cat $mopsTomlFile)
# fi

# mocPath="/home/zen/.cache/mocv/versions/current/moc"

# mocPath=""
# if command -v mops &> /dev/null
# then
#   mocPath="/home/zen/.cache/mops/moc/0.9.5/moc"
# else
#   mocPath="$(DFX_WARNING=-version_check dfx cache show)/moc" # fallback to dfx
# fi

mocPath="$(mops toolchain bin moc)"
# mocPath="$(dfx cache show)/moc"
# mocPath="/home/zen/.cache/mops/moc/0.7.5/moc"

$mocPath "$@"