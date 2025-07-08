set -e

. .env.private
. .env.local

CANISTER_NAME="${1:-assets}"
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

echo "Updating assets of ${CANISTER_NAME} (${CANISTER_ID}) on ${DFX_NETWORK}"

# Delete batch if it exists
# dfx canister call ${CANISTER_NAME} delete_batch 'record {batch_id = 4}'


# dfx deploy assets --compute-evidence
OUTPUT=$(dfx deploy ${CANISTER_NAME} --by-proposal 2>&1)

# Parse BATCH_ID from "Preparing batch X."
BATCH_ID=$(echo "$OUTPUT" | grep "Preparing batch" | awk '{print $3}' | sed 's/\.$//')

# Parse EVIDENCE_STRING from "Proposed commit of batch X with evidence Y."
EVIDENCE_STRING=$(echo "$OUTPUT" | grep "Proposed commit of batch $BATCH_ID with evidence" | awk '{print $8}' | sed 's/\.$//')

# Verify that the evidence string is the same as the one computed by the canister
REF_EVIDENCE=$(dfx deploy ${CANISTER_NAME} --compute-evidence 2>/dev/null | tail -n 1)
if [ "$REF_EVIDENCE" != "$EVIDENCE_STRING" ]; then
	echo "EVIDENCE_STRING does not match REF_EVIDENCE"
	exit 1
fi

echo "BATCH_ID: $BATCH_ID"
echo "EVIDENCE_STRING: $EVIDENCE_STRING"
echo "EVIDENCE_REF: $REF_EVIDENCE"

TITLE="Update frontend canister '${CANISTER_NAME}'"
SUMMARY="Update frontend canister with evidence batch id ${BATCH_ID}."
URL="https://mops.one"

# didc encode --format blob "(record{ batch_id = $BATCH_ID : nat; evidence = blob \"$(echo $EVIDENCE_STRING | sed 's/../\\&/g')\"; })"
PAYLOAD=$(didc encode --format blob "(record{ batch_id = $BATCH_ID : nat; evidence = blob \"$(echo $EVIDENCE_STRING | sed 's/../\\&/g')\"; })")

PROPOSAL="(record { title=\"$TITLE\"; url=\"$URL\"; summary=\"$SUMMARY\"; action=opt variant {ExecuteGenericNervousSystemFunction = record {function_id=($FUNC_ID:nat64); payload="$PAYLOAD"}}})"

echo $PAYLOAD


quill sns  \
  --canister-ids-file $SNS_CANISTER_IDS_FILE  \
  --pem-file "${PEM_FILE}"  \
  make-proposal --proposal "$PROPOSAL" $DEVELOPER_NEURON_ID > msg.json

quill send ${QUILL_EXTRA_ARGS:-} --yes msg.json

rm ./msg.json