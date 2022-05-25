<script lang="ts">
	import {onMount} from 'svelte';
	import {debounce} from 'throttle-debounce';
	import {location as loc} from 'svelte-spa-router';

	import {PackageConfig} from '/declarations/main/main.did.js';
	import {mainActor} from '/logic/actors';
	import {micromark} from 'micromark';

	import Header from './Header.svelte';

	$: pkgName = $loc.split('/package/')[1] ? decodeURI($loc.split('/package/')[1]) : '';
	$: $loc && load();

	let readmeHtml: string;
	let config: PackageConfig;
	let loaded = false;
	let clipboardIcon = '📋';

	let load = debounce(10, async () => {
		if (!pkgName) {
			return;
		}
		config = await mainActor().getLastConfig(pkgName);
		mainActor().getReadmeFile(config.name, config.version).then((res) => {
			let readme = new TextDecoder().decode(new Uint8Array(res.content));
			readmeHtml = micromark(readme);
			loaded = true;
		});
	});

	let resetIconTimer: any;
	function copyCommand() {
		navigator.clipboard.writeText(`mops i ${config.name}`);
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
				<div class="name">{config.name}</div>
				<div class="version">{config.version} published 1 day ago</div>
			</div> -->
			<!-- <div class="install">
				<div class="text">Install</div>
				<div class="command">mops i {config.name}</div>
			</div> -->
			{@html readmeHtml}
		</div>
		<div class="right-panel">
			<div class="detail">
				<div class="label">Package</div>
				<div class="value">{config.name}</div>
			</div>
			<div class="detail">
				<div class="label">Version</div>
				<div class="value">{config.version}</div>
			</div>
			<div class="detail">
				<div class="label">Install</div>
				<div class="value install-command" on:click="{copyCommand}">mops i {config.name} <div class="icon">{clipboardIcon}</div></div>
			</div>
			{#if config.repository}
				<div class="detail">
					<div class="label">Repository</div>
					<a class="value" href="{config.repository}" target="_blank">{config.repository.replace(/https?:\/\/(www\.)?/, '')}</a>
				</div>
			{/if}
			{#if config.documentation}
				<div class="detail">
					<div class="label">Documentation</div>
					<a class="value" href="{config.documentation}" target="_blank">{config.documentation.replace(/https?:\/\/(www\.)?/, '')}</a>
				</div>
			{/if}
			{#if config.owner}
				<div class="detail">
					<div class="label">Owner</div>
					<a class="value">{config.owner}</a>
				</div>
			{/if}
		</div>
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
		width: 200px;
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