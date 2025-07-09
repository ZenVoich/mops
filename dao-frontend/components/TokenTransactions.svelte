<script lang="ts">
	import { AnonymousIdentity } from '@dfinity/agent';
	import { encodeIcrcAccount, IcrcLedgerCanister, type IcrcValue } from '@dfinity/ledger-icrc';
	import { Principal } from '@dfinity/principal';
	import { createAgent } from '@dfinity/utils';
	import { formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
	import { onMount } from 'svelte';

	type Transaction = {
		id: bigint;
		timestamp: number;
		operation: 'mint' | 'transfer' | 'burn';
		fromAccount: string;
		toAccount: string;
		amount: number;
	};

	let snsRoot = '3e3x2-xyaaa-aaaaq-aaalq-cai';
	let canister = 'mxzaz-hqaaa-aaaar-qaada-cai';

	let transactions = $state<Transaction[]>([]);
	let ledger: IcrcLedgerCanister | null = null;

	onMount(async () => {
		let agent = await createAgent({
			identity: new AnonymousIdentity(),
			host: 'https://icp-api.io',
		});

		ledger = IcrcLedgerCanister.create({
			agent,
			canisterId: Principal.fromText(canister),
		});

		await refreshTransactions();
	});

	async function refreshTransactions() {
		let blocksMeta = await ledger.getBlocks({args: []});

		let blocks = await ledger.getBlocks({
			args: [
				{
					start: blocksMeta.log_length - 20n,
					length: 20n,
				},
			],
		});

		transactions = blocks.blocks.map(block => icrc3BlockToTransaction(block.id, block.block)).filter(transaction => transaction !== null).toReversed();

		setTimeout(refreshTransactions, 3000);
	}

	function formatAccount(account: string) {
		if (account.length < 10) return account;
		return account.substring(0, 5) + '...' + account.substring(account.length - 3);
	}

	function accountToText(accountArray: [{Blob: Uint8Array | number[];}, {Blob: Uint8Array | number[];}]): string {
		return encodeIcrcAccount({
			owner: Principal.fromUint8Array(new Uint8Array(accountArray[0].Blob)),
			subaccount: accountArray[1] ? new Uint8Array(accountArray[1].Blob) : undefined,
		});
	}

	function icrc3BlockToTransaction(id: bigint, block: IcrcValue): Transaction | null {
		if (!block || typeof block !== 'object' || !('Map' in block)) return null;
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

		if (!transaction) return null;

		let operation: 'mint' | 'transfer' | 'burn' = 'transfer';
		let fromAccount = '';
		let toAccount = '';
		let amount = '';

		// Parse transaction data
		for (let [txKey, txValue] of transaction) {
			if (txKey === 'op' && 'Text' in txValue) {
				operation = txValue.Text === 'xfer' ? 'transfer' : txValue.Text as 'mint' | 'transfer' | 'burn';
			} else if (txKey === 'from' && 'Array' in txValue) {
				fromAccount = accountToText(txValue.Array as any);
			} else if (txKey === 'to' && 'Array' in txValue) {
				toAccount = accountToText(txValue.Array as any);
			} else if (txKey === 'amt' && 'Nat' in txValue) {
				// Convert from smallest unit (assuming 8 decimals like ICP)
				let amtBigInt = BigInt(txValue.Nat.toString());
				amount = (Number(amtBigInt) / 100000000).toFixed(8);
			}
		}

		return {
			id,
			timestamp: Number(timestamp),
			operation,
			fromAccount,
			toAccount,
			amount: Number(amount),
		};
	}
</script>

<div class="transactions">
	<div class="title">Transactions</div>
	<div class="list">
		<table>
			<thead>
				<tr>
					<th class="id">#</th>
					<th class="timestamp">Timestamp</th>
					<th class="operation">Operation</th>
					<th class="from">From</th>
					<th class="to">To</th>
					<th class="amount">Amount</th>
				</tr>
			</thead>
			<tbody>
				{#if transactions.length === 0}
					<tr class="loading">
						<td colspan="6" class="empty">Loading...</td>
					</tr>
				{/if}
				{#each transactions as transaction}
					<tr>
						<td><a href="https://dashboard.internetcomputer.org/sns/{snsRoot}/transaction/{transaction.id}" target="_blank">{transaction.id}</a></td>
						<td>{formatDistanceToNowStrict(new Date(transaction.timestamp), {addSuffix: true})}</td>
						<td>{transaction.operation}</td>
						<td>{formatAccount(transaction.fromAccount)}</td>
						<td>{formatAccount(transaction.toAccount)}</td>
						<td class="amount">{transaction.amount} MOPS</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.transactions {
		border-top: 1px solid #e0e0e0;
		padding-top: 42px;
		margin-top: 42px;
		white-space: nowrap;
	}

	.title {
		font-size: 24px;
		font-weight: bold;
		margin-bottom: 16px;
	}

	.list {
		overflow: auto;
		max-height: 400px;
	}

	table {
		width: 100%;
		min-height: 400px;
		border-collapse: collapse;
		font-family: sans-serif;
	}

	th,
	td {
		padding: 12px 15px;
		text-align: left;
		border-bottom: 1px solid #ddd;
	}

	th.timestamp {
		width: 190px;
	}

	th.operation {
		width: 110px;
	}

	th.from,
	th.to {
		width: 120px;
	}

	thead {
		position: sticky;
		top: 0;
	}

	thead th {
		background-color: #f2f2f2;
		color: #333;
		font-weight: bold;
	}

	tbody tr:nth-child(even) {
		background-color: #f9f9f9;
	}

	tbody tr:not(.loading):hover {
		background-color: #f1f1f1;
	}

	tr.loading td {
		text-align: center;
		font-style: italic;
		color: #999;
	}

	td {
		color: #666;
	}

	.amount {
		text-align: right;
	}
</style>