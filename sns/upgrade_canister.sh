set -e

. .env.private
. .env.local

CANISTER_NAME="${1:-main}"
CANISTER_ID="$(dfx canister id ${CANISTER_NAME})"
DEPLOY_ARG="()"

echo "Upgrading canister '${CANISTER_NAME}' (${CANISTER_ID}) on ${DFX_NETWORK}"

dfx build ${CANISTER_NAME}

if [ "${CANISTER_NAME}" == "main" ] || [ "${CANISTER_NAME}" == "dao" ]; then
	gzip --keep --force "../.dfx/${DFX_NETWORK}/canisters/${CANISTER_NAME}/${CANISTER_NAME}.wasm"
fi

if [ "${CANISTER_NAME}" == "assets" ]; then
	DEPLOY_ARG=$(cat assets_init_arg.did)
fi

quill sns \
	--canister-ids-file $SNS_CANISTER_IDS_FILE \
	--pem-file "${PEM_FILE}" \
	make-upgrade-canister-proposal \
	--title "Upgrade canister '${CANISTER_NAME}'" \
	--target-canister-id "${CANISTER_ID}" \
	--mode upgrade \
	--wasm-path ../.dfx/${DFX_NETWORK}/canisters/${CANISTER_NAME}/${CANISTER_NAME}.wasm.gz \
	--canister-upgrade-arg "${DEPLOY_ARG}" \
	"${DEVELOPER_NEURON_ID}" > msg.json

quill send \
	${QUILL_EXTRA_ARGS:-} \
	--pem-file "${PEM_FILE}" \
	--yes msg.json

rm ./msg.json