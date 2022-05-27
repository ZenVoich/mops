<script lang="ts">
	import {onMount} from 'svelte';
	import Loader from './Loader.svelte';
	import PackageSummaryEl from './PackageSummaryEl.svelte';
	import {PackageSummary} from '/declarations/main/main.did.js';
	import {mainActor} from '/logic/actors';

	let loaded = false;
	let packages: PackageSummary[] = [];

	onMount(async () => {
		packages = await mainActor().getRecentlyUpdatedPackages();
		loaded = true;
	});
</script>

<div class="top-packages">
	<div class="title">Recently Updated Pacakges</div>

	{#if loaded}
		{#each packages as pkg}
			<PackageSummaryEl {pkg}></PackageSummaryEl>
		{:else}
			{#if loaded}
				<div class="not-found">Packages not found</div>
			{/if}
		{/each}
	{:else}
		<Loader></Loader>
	{/if}
</div>

<style>
	.top-packages {
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-width: 100%;
		padding: 0 20px;
		box-sizing: border-box;
		margin-top: 10px;
		width: 600px;
	}

	.title {
		font-size: 22px;
		font-weight: 600;
		margin-bottom: 10px;
	}
</style>