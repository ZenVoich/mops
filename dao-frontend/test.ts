import {AnonymousIdentity} from '@dfinity/agent';
import {encodeIcrcAccount, IcrcLedgerCanister} from '@dfinity/ledger-icrc';
import {Principal} from '@dfinity/principal';
import {createAgent} from '@dfinity/utils';

let agent = await createAgent({
	identity: new AnonymousIdentity(),
	host: 'https://icp-api.io',
});

let icrc = IcrcLedgerCanister.create({
	agent,
	canisterId: Principal.fromText('mxzaz-hqaaa-aaaar-qaada-cai'),
});

let blocksMeta = await icrc.getBlocks({args: []});

let blocks = await icrc.getBlocks({
	args: [
		{
			start: blocksMeta.log_length - 20n,
			length: 20n,
		},
	],
});

// Helper function to convert blob to hex string
function blobToHex(blob: any): string {
	if (!blob || typeof blob !== 'object') return '';
	let hex = '';
	for (let key in blob) {
		if (blob.hasOwnProperty(key)) {
			hex += blob[key].toString(16).padStart(2, '0');
		}
	}
	return hex;
}

// Helper function to format account from array
function formatAccount(accountArray: [{Blob: Uint8Array | number[];}, {Blob: Uint8Array | number[];}]): string {
	return encodeIcrcAccount({
		owner: Principal.fromUint8Array(new Uint8Array(accountArray[0].Blob)),
		subaccount: accountArray[1] ? new Uint8Array(accountArray[1].Blob) : undefined,
	});
}

// Helper function to convert nanoseconds timestamp to readable date
function formatTimestamp(tsNanos: string): string {
	let tsMillis = BigInt(tsNanos) / 1000000n; // Convert nanoseconds to milliseconds
	return new Date(Number(tsMillis)).toISOString();
}

// Parse and format each block
console.log('Date\t\t\t\tType\t\tFrom\t\t\tTo\t\t\tAmount');
console.log('='.repeat(120));

type Transaction = {
	timestamp: number;
	operation: 'mint' | 'transfer' | 'burn';
	fromAccount: string;
	toAccount: string;
	amount: number;
};

let transactions: Transaction[] = [];

for (let blockData of blocks.blocks) {
	let block = blockData.block;
	if (!block || typeof block !== 'object' || !('Map' in block)) continue;

	let timestamp = 0;
	let transaction = null;

	// Extract data from the Map structure
	for (let [key, value] of block.Map) {
		if (key === 'ts' && 'Nat' in value) {
			timestamp = Number(value.Nat / 1000000n);
		} else if (key === 'tx' && 'Map' in value) {
			transaction = value.Map;
		}
	}

	if (!transaction) continue;

	let operation: 'mint' | 'transfer' | 'burn' = 'transfer';
	let fromAccount = '';
	let toAccount = '';
	let amount = '';

	// Parse transaction data
	for (let [txKey, txValue] of transaction) {
		if (txKey === 'op' && 'Text' in txValue) {
			operation = txValue.Text === 'xfer' ? 'transfer' : txValue.Text as 'mint' | 'transfer' | 'burn';
		} else if (txKey === 'from' && 'Array' in txValue) {
			fromAccount = formatAccount(txValue.Array as any);
		} else if (txKey === 'to' && 'Array' in txValue) {
			toAccount = formatAccount(txValue.Array as any);
		} else if (txKey === 'amt' && 'Nat' in txValue) {
			// Convert from smallest unit (assuming 8 decimals like ICP)
			let amtBigInt = BigInt(txValue.Nat.toString());
			amount = (Number(amtBigInt) / 100000000).toFixed(8);
		}
	}

	transactions.push({
		timestamp: Number(timestamp),
		operation,
		fromAccount,
		toAccount,
		amount: Number(amount),
	});
}

console.log(transactions);