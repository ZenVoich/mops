# bun
FROM oven/bun:1.2.17-alpine@sha256:6cb88d90f8a96249e272ba877885d5251a77e1d7a44b4d89565ded015fe5be2d AS bun

# node
FROM node:24.2.0-alpine3.22@sha256:7aaba6b13a55a1d78411a1162c1994428ed039c6bbef7b1d9859c25ada1d7cc5

# copy bun
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

# install dependencies
RUN apk add --no-cache git tar

# for Bun
RUN apk --no-cache add ca-certificates wget
RUN wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub
RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk
RUN apk add --no-cache --force-overwrite glibc-2.28-r0.apk