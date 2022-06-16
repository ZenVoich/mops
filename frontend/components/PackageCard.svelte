<script lang="ts">
	import {push, location as loc} from 'svelte-spa-router';
	import Date from './Date.svelte';

	import {PackageDetails} from '/declarations/main/main.did.js';

	export let pkg: PackageDetails;

	function show(name: string) {
		push(`/package/${name}`);
	}
</script>

<div class="package">
	<div class="left">
		<div class="header">
			<div class="name" on:click="{() => show(pkg.config.name)}">{pkg.config.name}</div>
			<div class="version">{pkg.config.version}</div>
		</div>
		<div class="description">{pkg.config.description}</div>
	</div>
	<div class="right">
		<div>Updated <Date date="{Number(pkg.publication.time / 1000000n)}"></Date></div>
		<!-- <div>Downloads: {pkg.downloadsTotal.toLocaleString()}</div> -->
	</div>
</div>

<style>
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
</style>