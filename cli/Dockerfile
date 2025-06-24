FROM oven/bun:1.2.17-alpine AS bun




FROM node:22.7.0-alpine3.20

RUN apk add --no-cache git tar

# for Bun
RUN apk --no-cache add ca-certificates wget
RUN wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub
RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk
RUN apk add --no-cache --force-overwrite glibc-2.28-r0.apk




COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

# clone repository
ARG COMMIT_HASH
RUN git clone https://github.com/ZenVoich/mops.git

WORKDIR /mops
RUN git checkout $COMMIT_HASH

WORKDIR /mops/cli
RUN bun i --ignore-scripts

# build
ARG MOPS_VERSION
RUN npm version $MOPS_VERSION --allow-same-version
RUN npm run build

# verify
ARG SHASUM
ENV SHASUM=$SHASUM
COPY verify.sh /verify.sh
RUN chmod +x /verify.sh
ENTRYPOINT ["sh", "/verify.sh"]