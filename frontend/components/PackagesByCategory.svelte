<script lang="ts">
	import {onMount} from 'svelte';
	import Loader from './Loader.svelte';
	import PackageCard from './package/PackageCard.svelte';
	import {PackageSummary} from '/declarations/main/main.did.js';
	import {mainActor} from '/logic/actors';

	let packagesByCategory: [string, PackageSummary[]][] = [];

	let loaded = false;
	let packages: PackageSummary[] = [];
	let categories: string[] = [];
	let selectedCategory = '';

	function selectCategory(category: string) {
		selectedCategory = category;
		packages = [];

		for (let [cat, pkgs] of packagesByCategory) {
			if (cat === category) {
				packages = pkgs;
				break;
			}
		}
	}

	onMount(async () => {
		packagesByCategory = await mainActor().getPackagesByCategory();
		categories = packagesByCategory.map(([category, _]) => category);
		selectCategory(packagesByCategory[0][0]);
		loaded = true;
	});
</script>

<div class="packages-by-category">
	<div class="title">Packages by Category</div>
	{#if loaded}
		<div class="categories">
			{#each categories as category}
				<div class="category" class:selected={category === selectedCategory} on:click={() => selectCategory(category)}>{category}</div>
			{/each}
		</div>
		<div class="packages">
			{#each packages as pkg}
				<div class="package">
					<PackageCard
						{pkg}
						showUpdated={false}
						showVersion={false}
					></PackageCard>
				</div>
			{:else}
				{#if loaded}
					<div class="not-found">Packages not found</div>
				{/if}
			{/each}
		</div>
	{:else}
		<Loader></Loader>
	{/if}
</div>

<style>
	.packages-by-category {
		padding: 0 40px;
		width: 900px;
		max-width: 100%;
		box-sizing: border-box;
	}

	.title {
		margin-bottom: 20px;
		font-size: 22px;
		font-weight: 600;
		text-align: center;
	}

	.categories {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}

	.category.selected {
		background: var(--color-primary);
		color: white;
	}

	.category {
		padding: 10px 20px;
		background: var(--color-secondary);
		border-radius: 4px;
		font-size: 18px;
		font-weight: 500;
		user-select: none;
		display: flex;
		align-items: center;
		white-space: nowrap;
		min-width: 155px;
		cursor: pointer;
	}

	.packages {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		column-gap: 40px;
		padding: 0 40px;
		margin: 0 auto;
		padding: 0;
	}

	.package {
		width: 390px;
		max-width: 100%;
	}
</style>