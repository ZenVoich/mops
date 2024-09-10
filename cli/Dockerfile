FROM --platform=linux/amd64 zenvoich/mops-builder:1.0.0@sha256:ce283d3c4ad2e6fe8caff6dd9511224f234a77a90590ddfeb49e598266a44773

# clone repository
ARG COMMIT_HASH
RUN git clone https://github.com/ZenVoich/mops.git

WORKDIR /mops
RUN git checkout $COMMIT_HASH

WORKDIR /mops/cli
RUN npm ci

# build
ARG MOPS_VERSION
RUN npm version $MOPS_VERSION --allow-same-version
RUN npm run build

# verify
ARG SHASUM
ENV SHASUM=$SHASUM
ADD verify.sh /verify.sh
RUN chmod +x /verify.sh
ENTRYPOINT ["sh", "/verify.sh"]