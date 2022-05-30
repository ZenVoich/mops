<script lang="ts">
	import {push, link} from 'svelte-spa-router';

	export let searchText = '';

	function search() {
		let text = searchText.trim().toLowerCase();
		if (!text) {
			return;
		}

		push(`/search/${text}`);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key == 'Enter') {
			search();
		}
	}
</script>

<div class="header">
	<a href="/" use:link>
		<img class="logo" src="img/mops-motoko.svg" alt="mops">
	</a>
	<div class="search">
		<input class="input" bind:value={searchText} on:keydown={onKeyDown} placeholder="Search motoko packages..." spellcheck="false" maxlength="50">
		<div class="button" on:click="{search}">Search</div>
	</div>
</div>

<style>
	.logo {
		width: 60px;
		height: 60px;
		cursor: pointer;
		user-select: none;
		-webkit-user-drag: none;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20px;
		padding: 10px 30px;
		box-shadow: 0 0 5px #a7a7a7;
	}

	.search {
		display: flex;
		justify-content: center;
		min-width: 0;
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
</style>