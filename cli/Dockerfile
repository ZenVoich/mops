FROM --platform=linux/amd64 oven/bun:1.2.17-alpine@sha256:0d39ff2bdbefda6db94fa0a5d1d9c81f70c3700a1a44a6388d2741de2a4176c7 AS bun

FROM --platform=linux/amd64 zenvoich/mops-builder:1.0.0@sha256:ce283d3c4ad2e6fe8caff6dd9511224f234a77a90590ddfeb49e598266a44773

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