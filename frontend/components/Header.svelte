<script lang="ts">
	import {push} from 'svelte-spa-history-router';

	export let searchText = '';

	function search() {
		let text = searchText.trim().toLowerCase();
		if (!text) {
			return;
		}

		push(`/search/${text}`);
	}

	function onKeyDown(e : KeyboardEvent) {
		if (e.key == 'Enter') {
			search();
		}
	}
</script>

<header>
	<mops-navbar></mops-navbar>
	<div class="search">
		<input class="input" bind:value={searchText} on:keydown={onKeyDown} placeholder="Search motoko packages..." spellcheck="false" maxlength="100">
		<div class="button" on:click="{search}">Search</div>
	</div>
</header>

<style>
	header {
		position: relative;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20px;
		padding: 10px 30px;
		box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
	}

	.search {
		display: flex;
		justify-content: center;
		min-width: 0;
		margin-left: auto;
		margin-right: auto;
		transform: translateX(-50%);
	}

	.input {
		width: 450px;
		padding: 10px;
		border: 2px solid var(--color-primary-light);
		outline: none;
		border-right: none;
		border-radius: 3px 0 0 3px;
		height: 50px;
		font-size: 20px;
		line-height: 50px;
		min-width: 0;
	}

	.input:focus {
		border-color: var(--color-primary);
	}

	.button {
		display: flex;
		align-items: center;
		background: var(--color-primary);
		color: #ffffff;
		font-size: 18px;
		padding: 10px 20px;
		text-align: center;
		cursor: pointer;
		border-radius: 0 3px 3px 0;
		user-select: none;
	}

	@media (width < 1600px) {
		header {
			justify-content: flex-start;
		}

		.search {
			transform: none;
			margin-left: 0;
		}
	}

	@media (width < 700px) {
		.search {
			display: none;
		}
	}
</style>