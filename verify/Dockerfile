FROM --platform=linux/amd64 node:22.7.0-alpine3.20@sha256:1a526b97cace6b4006256570efa1a29cd1fe4b96a5301f8d48e87c5139438a45

RUN apk add --no-cache git

# for Bun
RUN apk --no-cache add ca-certificates wget
RUN wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub
RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk
RUN apk add --no-cache --force-overwrite glibc-2.28-r0.apk

# clone repository
ARG COMMIT_HASH
RUN git clone https://github.com/ZenVoich/mops.git

WORKDIR /mops
RUN git checkout $COMMIT_HASH

WORKDIR /mops/cli
RUN npm install

# build
ARG MOPS_VERSION
RUN npm version $MOPS_VERSION --allow-same-version
RUN npm run prepare
RUN npm run bundle
# RUN npm run release

# verify
ARG SHASUM
ENV SHASUM=$SHASUM
ADD verify.sh /verify.sh
RUN chmod +x /verify.sh
ENTRYPOINT ["sh", "/verify.sh"]