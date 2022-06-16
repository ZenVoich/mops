<script lang="ts">
	import {onMount} from 'svelte';
	import {debounce} from 'throttle-debounce';
	import {push, location as loc} from 'svelte-spa-router';

	import {PackageDetails} from '/declarations/main/main.did.js';
	import {mainActor} from '/logic/actors';

	import Header from './Header.svelte';
	import Loader from './Loader.svelte';
	import PackageCard from './PackageCard.svelte';
	import NotFound from './NotFound.svelte';

	$: searchText = decodeURI($loc.split('/search/')[1]);
	$: $loc && updateResults();

	let packages: PackageDetails[] = [];
	let loaded = false;

	let updateResults = debounce(10, () => {
		loaded = false;

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

<svelte:head>
	<title>Motoko Packages</title>
</svelte:head>

<Header searchText="{searchText}"></Header>

<div class="search-results">
	{#if loaded}
		{#each packages as pkg}
			<PackageCard {pkg}></PackageCard>
		{:else}
			<NotFound>Packages not found</NotFound>
		{/each}
	{:else}
		<Loader></Loader>
	{/if}
</div>

<style>
	.search-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 20px 10px;
		gap: 20px;
	}
</style>