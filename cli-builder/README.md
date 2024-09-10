# Mops CLI builder

This is a base image for building Mops CLI.

Images are available on Docker Hub: https://hub.docker.com/r/zenvoich/mops-builder/tags

## Usage

```dockerfile
FROM --platform=linux/amd64 zenvoich/mops-builder:1.0.0
# ...
```

## Publish new version

```
docker build . -t zenvoich/mops-builder:<version>
docker push zenvoich/mops-builder:<version>
```