<script lang="ts">
	import {onMount} from 'svelte';
	import {debounce} from 'throttle-debounce';
	import {push, location as loc} from 'svelte-spa-router';

	import {PackageSummary} from '/declarations/main/main.did.js';
	import {mainActor} from '/logic/actors';

	import Header from './Header.svelte';

	$: searchText = decodeURI($loc.split('/search/')[1]);
	$: $loc && updateResults();

	let packages: PackageSummary[] = [];
	let loaded = false;

	let updateResults = debounce(10, () => {
		mainActor().search(searchText).then((res) => {
			packages = res;
			loaded = true;
		});
	});

	function formatDate(date: number) {
		return Intl.DateTimeFormat(navigator.language, {year: 'numeric', month: 'long', day: 'numeric'}).format(date);
	}

	function show(name: string) {
		push(`/package/${name}`);
	}

	onMount(updateResults);
</script>

<Header searchText="{searchText}"></Header>

<div class="search-results">
	{#each packages as pkg}
		<div class="package">
			<div class="left">
				<div class="header">
					<div class="name" on:click="{() => show(pkg.name)}">{pkg.name}</div>
					<div class="version">{pkg.version}</div>
				</div>
				<div class="description">{pkg.description}</div>
			</div>
			<div class="right">
				<div>Updated: {formatDate(Number(pkg.updatedAt / 1000000n))}</div>
				<div>Downloads: {pkg.downloadsTotal.toLocaleString()}</div>
			</div>
		</div>
	{:else}
		{#if loaded}
			<div class="not-found">Packages not found</div>
		{/if}
	{/each}
</div>

<style>
	.search-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 20px 10px;
		gap: 20px;
	}

	.package:hover {
		box-shadow: -0 1px 5px #c1c1c1;
	}

	.package {
		display: flex;
		padding: 17px;
		box-sizing: border-box;
		width: 600px;
		max-width: 100%;
		gap: 10px;
		box-shadow: 0 1px 3px #c1c1c1;
		border-radius: 3px;
	}

	.left {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}

	.header {
		display: flex;
		align-items: flex-end;
		gap: 10px;
	}

	.name {
		font-size: 20px;
		font-weight: 500;
		cursor: pointer;
	}

	.version {
		font-size: 12px;
		display: none;
	}

	.description {
		font-size: 15px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.right {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 14px;
		color: rgb(170, 170, 170);
		white-space: nowrap;
	}

	.not-found {
		font-size: 20px;
		color: #9d9d9d;
	}
</style>