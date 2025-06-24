# Mops CLI builder

This is a base image for building Mops CLI.

Images are available on Docker Hub: https://hub.docker.com/r/zenvoich/mops-builder/tags

## Usage

```dockerfile
FROM --platform=linux/amd64 zenvoich/mops-builder:<version>@sha256:<sha256>

# FROM --platform=linux/amd64 zenvoich/mops-builder:1.1.0@sha256:9bb87e843a90f1c12ece4ba91ca703e19cd0d79522beb562f45b1f8a14cb05b6
# ...
```

## Publish new version

```
docker build . --platform linux/amd64,linux/arm64 -t zenvoich/mops-builder:<version>
docker push zenvoich/mops-builder:<version>
```