# Mops CLI builder

This is a base image for building Mops CLI.

Images are available on Docker Hub: https://hub.docker.com/r/zenvoich/mops-builder/tags

## Usage

```dockerfile
FROM zenvoich/mops-builder:<version>@sha256:<sha256>

# FROM zenvoich/mops-builder:1.0.0@sha256:ce283d3c4ad2e6fe8caff6dd9511224f234a77a90590ddfeb49e598266a44773
# ...
```

## Publish new version

```
docker build . --platform linux/amd64,linux/arm64 -t zenvoich/mops-builder:<version>
docker push zenvoich/mops-builder:<version>
```