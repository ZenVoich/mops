<script lang="ts">
	import { getKongswapTokenInfo, type KongswapTokenInfo } from '../logic/kongswap';
	import { onMount } from 'svelte';

	let canister = 'mxzaz-hqaaa-aaaar-qaada-cai';
	let tokenInfo = $state<KongswapTokenInfo | null>(null);

	onMount(async () => {
		tokenInfo = await getKongswapTokenInfo(canister);
	});

	function formatPriceChange(priceChange: number) {
		return priceChange > 0 ? `+${priceChange.toFixed(2)}%` : `${priceChange.toFixed(2)}%`;
	}
</script>

<div class="token-card">
	<div class="token">
		<div class="header title">
			<div class="header-icon">
				<img src="/static/mops.svg" alt="MOPS token" />
			</div>
			<div>MOPS token</div>
		</div>

		{#if tokenInfo}
			<div class="token-info">
				<div class="detail">Canister: <span class="value">{canister}</span></div>
				<div class="detail">Symbol: <span class="value">{tokenInfo.symbol}</span></div>
				<div class="detail">Decimals: <span class="value">{tokenInfo.decimals}</span></div>
				<!-- <div class="detail">Transaction Fee: <span class="value">{new Intl.NumberFormat('en-US', { maximumSignificantDigits: 1 }).format(tokenInfo.fee)} MOPS</span></div> -->
				<div class="detail">Supply: <span class="value">{parseFloat(tokenInfo.metrics.total_supply).toLocaleString('en-US', { maximumFractionDigits: 0 })} MOPS</span></div>
				<div class="detail market-cap">Market Cap: <span class="value">${parseFloat(tokenInfo.metrics.market_cap).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
				<div class="detail">Price: <span class="value">${parseFloat(tokenInfo.metrics.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumSignificantDigits: 2, })} ({formatPriceChange(parseFloat(tokenInfo.metrics.price_change_24h))})</span></div>
				<!-- <div class="detail">Volume 24h: <span class="value">${parseFloat(tokenInfo.metrics.volume_24h).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div> -->
				<!-- <div class="detail">TVL: <span class="value">${parseFloat(tokenInfo.metrics.tvl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div> -->
			</div>
		{/if}
	</div>

	<div class="exchanges">
		<div class="title">Exchanges</div>
		<div class="list">
			<a class="exchange" href="https://kongswap.io/stats/mxzaz-hqaaa-aaaar-qaada-cai" target="_blank">
				<img src="/static/kongswap.svg" alt="KongSwap" />
				MOPS on KongSwap
			</a>
			<a class="exchange" href="https://app.icpswap.com/swap?input=ryjl3-tyaaa-aaaaa-aaaba-cai&output=mxzaz-hqaaa-aaaar-qaada-cai" target="_blank">
				<img src="/static/icpswap.svg" alt="ICP Swap" />
				MOPS on ICPSwap
			</a>
		</div>
	</div>
</div>

<style>
	.token-card {
		background-color: #fff;
		border-radius: 16px;
		display: flex;
	}

	.token {
		padding-top: 6px;
		flex: 10;
	}

	.token .header {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.title {
		font-size: 24px;
		font-weight: bold;
		margin-bottom: 16px;
	}

	.token img {
		width: 48px;
		height: 48px;
	}

	img {
		width: 32px;
		height: 32px;
	}

	a {
		display: flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
		color: #000;
	}

	.token-info {
		display: flex;
		flex-direction: column;
		gap: 12px;
		font-size: 18px;
	}

	.token-info .detail {
		display: flex;
		justify-content: space-between;
		gap: 10px;
	}

	.token-info .detail.market-cap {
		margin-top: 20px;
	}

	.token-info .value {
		font-family: monospace;
	}

	.exchanges {
		display: flex;
		flex-direction: column;
		gap: 12px;
		border-left: 1px solid #e0e0e0;
		padding-top: 16px;
		padding-left: 42px;
		margin-left: 42px;
		flex: 6;
	}

	.exchange {
		padding: 12px 16px;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background-color: #ffffff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		transition: all 0.2s ease-in-out;
		cursor: pointer;
		flex: 1;
	}

	.exchange:hover {
		background-color: #f9f9f9;
	}

	.exchanges .list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	@media (width < 768px) {
		.token-card {
			flex-direction: column;
		}

		.exchanges {
			border-left: none;
			padding-left: 0;
			margin-left: 0;

			border-top: 1px solid #e0e0e0;
			padding-top: 42px;
			margin-top: 42px;
		}
	}
</style>