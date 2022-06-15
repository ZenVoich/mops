<script lang="ts">
	import {onMount} from 'svelte';
	import {debounce} from 'throttle-debounce';
	import {location as loc} from 'svelte-spa-router';

	import {PackageDetails} from '/declarations/main/main.did.js';
	import {mainActor, storageActor} from '/logic/actors';
	import {micromark} from 'micromark';

	import Header from './Header.svelte';
	import Loader from './Loader.svelte';
	import Date from './Date.svelte';

	$: pkgName = $loc.split('/package/')[1] ? decodeURI($loc.split('/package/')[1]) : '';
	$: $loc && load();

	let readmeHtml: string;
	let packageDetails: PackageDetails;
	let loaded = false;
	let installHovered = false;
	let copiedToClipboard = false;

	let load = debounce(10, async () => {
		if (!pkgName) {
			return;
		}
		loaded = false;

		packageDetails = await mainActor().getPackageDetails(pkgName, 'highest');

		let res = await storageActor(packageDetails.publication.storage).downloadChunk(`${packageDetails.config.name}@${packageDetails.config.version}/${packageDetails.config.readme}`, 0n);
		if ('ok' in res) {
			let readme = new TextDecoder().decode(new Uint8Array(res.ok));
			readmeHtml = micromark(readme);
		}
		else {
			readmeHtml = '<i>Not found README.md</i>';
		}
		loaded = true;
	});

	let installHoverTimer: any;
	function installMouseenter() {
		clearTimeout(installHoverTimer);
		console.log(copiedToClipboard)
		installHoverTimer = setTimeout(() => {
			installHovered = true;
		}, 600);
	}

	function installMouseleave() {
		clearTimeout(installHoverTimer);
		if (!copiedToClipboard) {
			installHovered = false;
		}
	}

	let resetIconTimer: any;
	function copyCommand() {
		navigator.clipboard.writeText(`mops i ${packageDetails.config.name}`);
		copiedToClipboard = true;
		installHovered = true;
		clearTimeout(resetIconTimer);
		resetIconTimer = setTimeout(() => {
			installHovered = false;
			setTimeout(() => {
				copiedToClipboard = false;
			}, 300);
		}, 3000);
	}

	onMount(load);
</script>

<svelte:head>
	<title>{packageDetails ? packageDetails.config.name + ' - ' : ''}Motoko Packages</title>
</svelte:head>

<Header></Header>

<div class="package">
	{#if loaded}
		<div class="header">
			<div class="header-content">
				<div class="name">{packageDetails.config.name}</div>
				<div class="version">{packageDetails.config.version} published <Date date="{Number(packageDetails.publication.time / 1000000n)}"></Date></div>

				<div class="install">
					<div class="command-container" class:hover="{installHovered}" on:mouseenter="{installMouseenter}" on:mouseleave="{installMouseleave}">
						<div class="text" on:click="{copyCommand}">Install</div>
						<div class="command" on:click="{copyCommand}">mops i {packageDetails.config.name}</div>
					</div>
					<div class="clipboard-text">{copiedToClipboard ? 'Copied to clipboard!' : 'Click to copy to clipboard'}</div>
				</div>
			</div>
		</div>
		<div class="body">
			<div class="readme">
				{@html readmeHtml}
			</div>
			<div class="right-panel">
				{#if packageDetails.config.repository}
					<div class="detail">
						<div class="label">Repository</div>
						<a class="value" href="{packageDetails.config.repository}" target="_blank">{packageDetails.config.repository.replace(/https?:\/\/(www\.)?/, '')}</a>
					</div>
				{/if}
				{#if packageDetails.config.documentation}
					<div class="detail">
						<div class="label">Documentation</div>
						<a class="value" href="{packageDetails.config.documentation}" target="_blank">{packageDetails.config.documentation.replace(/https?:\/\/(www\.)?/, '')}</a>
					</div>
				{/if}
				{#if packageDetails.owner}
					<div class="detail">
						<div class="label">Owner</div>
						<div class="value">{packageDetails.owner}</div>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<Loader></Loader>
	{/if}
</div>

<style>
	.package {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.header {
		display: flex;
		justify-content: center;
		flex-grow: 1;
		align-self: stretch;
		background: rgb(213 217 208);
	}

	.header .name {
		font-size: 35px;
		font-weight: 500;
	}

	.header .version {
		font-size: 14px;
	}

	.header-content {
		width: 900px;
		padding: 20px;
		box-sizing: border-box;
	}

	.header .install {
		display: inline-flex;
		padding: 0px;
		align-items: center;
		margin: 10px 0;
	}

	.header .install .command-container {
		display: flex;
	}

	.header .install .text {
		font-weight: 500;
		padding: 10px;
		background: #7c865942;
		height: 41px;
		box-sizing: border-box;
		cursor: pointer;
	}

	.header .install .command {
		display: flex;
		align-items: center;
		height: 41px;
		box-sizing: border-box;
		border: 2px solid #7c865942;
		font-family: monospace;
		font-size: 18px;
		padding: 0 11px;
		white-space: nowrap;
		cursor: pointer;
	}

	.header .command-container.hover + .clipboard-text {
		opacity: 1;
	}

	.header .install .clipboard-text {
		margin-left: 8px;
		font-size: 14px;
		font-style: italic;
		color: rgb(100, 100, 100);
		opacity: 0;
		transition: opacity 0.3s;
		pointer-events: none;
		user-select: none;
	}

	.body {
		display: flex;
		width: 900px;
		margin-top: 20px;
	}

	.readme {
		flex-grow: 1;
		background: white;
		padding: 20px;
		padding-top: 0;
	}

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