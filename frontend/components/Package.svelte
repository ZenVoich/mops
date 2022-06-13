<script lang="ts">
	import {onMount} from 'svelte';
	import {debounce} from 'throttle-debounce';
	import {location as loc} from 'svelte-spa-router';

	import {PackageSummary} from '/declarations/main/main.did.js';
	import {mainActor, storageActor} from '/logic/actors';
	import {micromark} from 'micromark';

	import Header from './Header.svelte';
	import Loader from './Loader.svelte';

	$: pkgName = $loc.split('/package/')[1] ? decodeURI($loc.split('/package/')[1]) : '';
	$: $loc && load();

	let readmeHtml: string;
	let packageSummary: PackageSummary;
	let loaded = false;
	let clipboardIcon = '📋';

	let load = debounce(10, async () => {
		if (!pkgName) {
			return;
		}
		loaded = false;

		packageSummary = await mainActor().getPackageSummary(pkgName, 'max');

		let res = await storageActor(packageSummary.storage).downloadChunk(`${packageSummary.name}@${packageSummary.version}/${packageSummary.readme}`, 0n);
		if ('ok' in res) {
			let readme = new TextDecoder().decode(new Uint8Array(res.ok));
			readmeHtml = micromark(readme);
		}
		loaded = true;
	});

	let resetIconTimer: any;
	function copyCommand() {
		navigator.clipboard.writeText(`mops i ${packageSummary.name}`);
		clipboardIcon = '✔️';
		clearTimeout(resetIconTimer);
		resetIconTimer = setTimeout(() => {
			clipboardIcon = '📋';
		}, 2000);
	}

	onMount(load);
</script>

<Header></Header>

<div class="package">
	{#if loaded}
		<div class="readme">
			<!-- <div class="header">
				<div class="name">{packageSummary.name}</div>
				<div class="version">{packageSummary.version} published 1 day ago</div>
			</div> -->
			<!-- <div class="install">
				<div class="text">Install</div>
				<div class="command">mops i {packageSummary.name}</div>
			</div> -->
			{@html readmeHtml}
		</div>
		<div class="right-panel">
			<div class="detail">
				<div class="label">Package</div>
				<div class="value">{packageSummary.name}</div>
			</div>
			<div class="detail">
				<div class="label">Version</div>
				<div class="value">{packageSummary.version}</div>
			</div>
			<div class="detail">
				<div class="label">Install</div>
				<div class="value install-command" on:click="{copyCommand}">mops i {packageSummary.name} <div class="icon">{clipboardIcon}</div></div>
			</div>
			{#if packageSummary.repository}
				<div class="detail">
					<div class="label">Repository</div>
					<a class="value" href="{packageSummary.repository}" target="_blank">{packageSummary.repository.replace(/https?:\/\/(www\.)?/, '')}</a>
				</div>
			{/if}
			{#if packageSummary.documentation}
				<div class="detail">
					<div class="label">Documentation</div>
					<a class="value" href="{packageSummary.documentation}" target="_blank">{packageSummary.documentation.replace(/https?:\/\/(www\.)?/, '')}</a>
				</div>
			{/if}
			{#if packageSummary.owner}
				<div class="detail">
					<div class="label">Owner</div>
					<div class="value">{packageSummary.owner}</div>
				</div>
			{/if}
		</div>
	{:else}
		<Loader></Loader>
	{/if}
</div>

<style>
	.package {
		display: flex;
		justify-content: center;
		margin-top: 30px;
	}

	/* .install {
		display: inline-flex;
		padding: 0px;
		align-items: center;
		margin-bottom: 30px;
	}

	.install .text {
		font-weight: 600;
		padding: 10px;
		background: #7c865942;
		height: 41px;
		box-sizing: border-box;
	}

	.install .command {
		font-family: monospace;
		font-size: 18px;
		border: 2px solid #7c865942;
		display: flex;
		align-items: center;
		height: 41px;
		box-sizing: border-box;
		padding: 0 11px;
		cursor: pointer;
	} */

	.right-panel {
		width: 240px;
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.detail {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.label {
		font-weight: bold;
		color: #303030;
	}

	.value {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.install-command {
		display: flex;
		border-radius: 3px;
		border: 2px solid #b9b9b9;
		padding: 7px 10px;
		font-family: monospace;
		font-size: 16px;
		cursor: pointer;
		color: #7a7a7a;
		white-space: normal;
	}

	.install-command:hover {
		background: #efefef;
		color: black;
	}
	.install-command:hover > .icon {
		opacity: 1;
	}

	.install-command > .icon {
		font-size: medium;
		margin-left: auto;
		opacity: 0;
		pointer-events: none;
	}

	.readme {
		width: 600px;
		background: white;
		padding: 20px;
		padding-top: 0;
	}

	:global(h1, h2) {
		border-bottom: 1px solid rgb(177, 177, 177);
		padding-bottom: 4px;
		margin-top: 0;
	}

	:global(code) {
		background: rgb(233, 233, 233);
		padding: 3px;
		border-radius: 3px;
	}

	:global(pre > code) {
		display: block;
		padding: 10px;
		tab-size: 4;
	}
</style>