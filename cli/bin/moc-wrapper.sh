#!/bin/bash
mocPath="$(mops toolchain bin moc --fallback)"
$mocPath "$@"