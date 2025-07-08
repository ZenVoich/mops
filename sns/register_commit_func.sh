set -e

. .env.private
. .env.local

CANISTER_NAME="${1:-main}"
CANISTER_ID="$(dfx canister id ${CANISTER_NAME})"

FUNC_ID="1010"
if [ "${CANISTER_NAME}" == "assets" ]; then
	FUNC_ID="1010"
elif [ "${CANISTER_NAME}" == "blog" ]; then
	FUNC_ID="1011"
elif [ "${CANISTER_NAME}" == "docs" ]; then
	FUNC_ID="1012"
elif [ "${CANISTER_NAME}" == "cli" ]; then
	FUNC_ID="1013"
elif [ "${CANISTER_NAME}" == "dao-frontend" ]; then
	FUNC_ID="1014"
elif [ "${CANISTER_NAME}" == "play-frontend" ]; then
	FUNC_ID="1015"
fi

echo "Registering commit function for ${CANISTER_NAME} on ${DFX_NETWORK} with func id ${FUNC_ID}"

quill sns  \
  --canister-ids-file $SNS_CANISTER_IDS_FILE  \
  --pem-file "${PEM_FILE}"  \
  make-proposal --proposal "(record { title=\"Create custom SNS function 'commit' for canister '${CANISTER_NAME}'\"; url=\"\"; summary=\"Register \`commit\` function to trigger \`commit_proposed_batch\` on canister \`${CANISTER_ID}\`\"; action=opt variant {AddGenericNervousSystemFunction = record {id=${FUNC_ID}:nat64; name=\"commit\"; description=opt \"\"; function_type=opt variant {GenericNervousSystemFunction=record{validator_canister_id=opt principal\"$CANISTER_ID\"; target_canister_id=opt principal\"$CANISTER_ID\"; validator_method_name=opt\"validate_commit_proposed_batch\"; target_method_name=opt\"commit_proposed_batch\"}}}}})" $DEVELOPER_NEURON_ID > msg.json

quill send ${QUILL_EXTRA_ARGS:-} --yes msg.json

rm ./msg.json