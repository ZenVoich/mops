<script lang="ts">
	import {link} from 'svelte-spa-history-router';
	import Date from './Date.svelte';

	import {PackageSummary} from '/declarations/main/main.did.js';

	export let pkg: PackageSummary;
	export let showVersion = false;
	export let showUpdated = false;
	export let showDownloads = false;
	export let show7DayDownloads = false;
</script>

<div class="package">
	<div class="summary">
		<div class="left">
			<div class="header">
				<a class="name" href="/{pkg.config.name}" use:link>{pkg.config.name}</a>
				<div class="version">{pkg.config.version}</div>
			</div>
		</div>
		<div class="right">
			{#if showVersion}
				<div>Version {pkg.config.version}</div>
			{/if}
			{#if showUpdated}
				<div>Updated <Date date="{Number(pkg.publication.time / 1000000n)}"></Date></div>
			{/if}
			{#if show7DayDownloads}
				<div>Downloads: {pkg.downloadsInLast7Days.toLocaleString()}</div>
			{/if}
			{#if showDownloads}
				<div>Downloads: {pkg.downloadsTotal.toLocaleString()}</div>
			{/if}
		</div>
	</div>
	<div class="description">{pkg.config.description}</div>
</div>

<style>
	/* .package:hover {
		box-shadow: -0 1px 5px #c1c1c1;
	} */

	.package {
		display: flex;
		flex-direction: column;
		padding: 17px;
		box-sizing: border-box;
		width: 600px;
		max-width: 100%;
		gap: 10px;
		box-shadow: 0 1px 3px #c1c1c1;
		border-radius: 3px;
	}

	.summary {
		display: flex;
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
		word-break: break-word;
	}

	.version {
		font-size: 12px;
		display: none;
	}

	.description {
		font-size: 15px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.right {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 14px;
		color: rgb(170, 170, 170);
		white-space: nowrap;
	}
</style>