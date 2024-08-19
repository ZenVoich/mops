<script lang="ts">
	import {onMount} from 'svelte';
	import Loader from './Loader.svelte';
	import PackageCard from './package/PackageCard.svelte';
	import {PackageSummary} from '/declarations/main/main.did.js';
	import {mainActor} from '/logic/actors';
	import {getQualityPoints} from '/logic/get-quality-points';

	let packagesByCategory : [string, PackageSummary[]][] = [];

	let loaded = false;
	let packages : PackageSummary[] = [];
	let categories : string[] = [];
	let selectedCategory = '';

	function selectCategory(category : string) {
		selectedCategory = category;
		packages = [];

		for (let [cat, pkgs] of packagesByCategory) {
			if (cat === category) {
				packages = pkgs.slice().sort((a, b) => {
					return getQualityPoints(b.quality).total - getQualityPoints(a.quality).total;
				}).slice(0, 8);
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
	<div class="body">
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
	}

	.body {
		display: flex;
		align-items: flex-start;
		gap: 30px;
		margin-bottom: 20px;
	}

	.categories {
		display: flex;
		flex-direction: column;
		margin-top: 10px;
	}

	.category.selected {
		background: var(--color-secondary);
	}

	.category {
		padding: 20px 20px;
		padding-right: 50px;
		font-size: 18px;
		font-weight: 500;
		user-select: none;
		display: flex;
		align-items: center;
		white-space: nowrap;
		min-width: 155px;
		cursor: pointer;
		border-bottom: 1px solid hsl(0deg 0% 90.66%);
	}

	.packages {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		column-gap: 40px;
		padding: 0 40px;
		margin: 0 auto;
		padding: 0;
		min-width: 0;
	}

	.package {
		min-width: 0;
	}

	@media (width < 700px) {
		.body {
			flex-wrap: wrap;
		}
	}
</style>