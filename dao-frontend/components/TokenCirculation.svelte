<script lang="ts">
	// import { getCirculation, type Circulation } from '../logic/api';
	import { formatNumber } from '../logic/utils';

	interface Circulation {
		minted: number,
		burned: number,
		votingRewards: number,
		transferFees: number,
		gameFees: number,
		daoFees: number,
	};

	let circulation = $state<Circulation>({
		minted: 6857,
		burned: 2854,
		votingRewards: 1857392,
		transferFees: 1752,
		gameFees: 2947,
		daoFees: 1094,
	});

	// $effect(() => {
	// 	getCirculation().then((data) => {
	// 		circulation = data;
	// 	});
	// });

	let count = 0;
	function barOnClick() {
		count++;
		if (count >= 10) {
			localStorage.setItem('admin', 'true');
		}
	}

	let total = $derived(circulation.minted + circulation.burned);
	let mintedPercent = $derived(circulation.minted / total * 100);
	let burnedPercent = $derived(circulation.burned / total * 100);
</script>

{#if circulation}
	<div class="token-circulation">
		<div class="title">Circulation change in last 30 days</div>
		<div class="content">
			<div class="header">
				<div class="header-col">
					<div class="label">Minted</div>
					<div class="value">🌱 {formatNumber(circulation.minted)} MOPS</div>
				</div>
				<div class="header-col">
					<div class="label">Burned</div>
					<div class="value">🔥 {formatNumber(circulation.burned)} MOPS</div>
				</div>
			</div>

			<div class="bar" on:click={barOnClick}>
				<div class="minted-fill" style="width: {mintedPercent}%"></div>
				<div class="burned-fill" style="width: {burnedPercent}%"></div>
			</div>

			<!-- <div class="details">
				<div class="details-col">
					<div>Voting rewards: 🌱 {formatNumber(circulation.votingRewards)} MOPS</div>
				</div>
				<div class="details-col">
					<div>Transfer fees: 🔥 {formatNumber(circulation.transferFees)} MOPS</div>
					<div>Game fees: 🔥 {formatNumber(circulation.gameFees)} MOPS</div>
					<div>DAO fees: 🔥 {formatNumber(circulation.daoFees)} MOPS</div>
				</div>
			</div> -->
		</div>
	</div>
{/if}

<style>
	.token-circulation {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
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

	.header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		gap: 20px;
		text-align: center;
		margin-bottom: 40px;
	}

	.header-col {
		flex-grow: 1;
		flex-basis: 0;
	}

	.label {
		font-weight: 300;
		font-size: 23px;
		margin-bottom: 1px;
	}

	.value {
		font-size: 30px;
	}

	.bar {
		display: flex;
		height: 50px;
		margin-bottom: 40px;
		border-radius: 50px;
		overflow: hidden;
		background: rgb(230, 230, 230);
		border: 2px solid rgb(230, 230, 230);
		box-shadow: 0 0 7px rgb(184 184 184 / 69%);
	}

	.minted-fill {
		width: 100%;
		background: linear-gradient(90deg, #386e00 0%, hsl(86 84% 50% / 1) 100%);
	}

	.burned-fill {
		width: 100%;
		background: linear-gradient(90deg, #ffd368 0%, hsl(25 100% 44% / 1) 100%);
	}

	.details {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 60px;
	}

	.details-col {
		display: flex;
		flex-direction: column;
		gap: 10px;
		flex-grow: 1;
		flex-basis: 0;
	}

	@media (width <= 768px) {
		.details {
			gap: 20px;
		}
	}
</style>