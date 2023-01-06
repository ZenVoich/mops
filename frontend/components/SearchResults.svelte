<script lang="ts">
	import {onMount} from 'svelte';
	import {debounce} from 'throttle-debounce';
	import {currentURL} from 'svelte-spa-history-router';

	import {PackageDetails} from '/declarations/main/main.did.js';
	import {mainActor} from '/logic/actors';

	import Header from './Header.svelte';
	import Loader from './Loader.svelte';
	import PackageCard from './PackageCard.svelte';
	import NotFound from './NotFound.svelte';
	import Footer from './Footer.svelte';

	$: searchText = decodeURI($currentURL.pathname.split('/search/')[1]);
	$: $currentURL && updateResults();

	let packages: PackageDetails[] = [];
	let loaded = false;

	let updateResults = debounce(10, () => {
		loaded = false;

		mainActor().search(searchText).then((res) => {
			packages = res;
			loaded = true;
		});
	});

	onMount(updateResults);
</script>

<svelte:head>
	<title>MOPS &nbsp;&bull;&nbsp; Motoko Package Manager</title>
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

<Footer />

<style>
	.search-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 20px 10px;
		gap: 20px;
	}
</style>