<script lang="ts">
	import {onMount} from 'svelte';
	import {debounce} from 'throttle-debounce';
	import {currentURL, routeParams, push} from 'svelte-spa-history-router';

	import {PackageDetails} from '/declarations/main/main.did.js';
	import {mainActor, storageActor} from '/logic/actors';
	import {micromark} from 'micromark';

	import Header from './Header.svelte';
	import Loader from './Loader.svelte';
	import Date from './Date.svelte';
	import NotFound from './NotFound.svelte';
	import Footer from './Footer.svelte';
	import PackageCard from './PackageCard.svelte';

	$: pkgName = $currentURL.pathname.split('/')[1] ? decodeURI($currentURL.pathname.split('/')[1]) : '';
	$: $currentURL && load();

	let readmeHtml: string;
	let packageDetails: PackageDetails;
	let loaded = false;
	let installHovered = false;
	let copiedToClipboard = false;

	let load = debounce(10, async () => {
		if (!pkgName || loaded && pkgName === packageDetails?.config.name) {
			return;
		}
		loaded = false;

		let packageDetailsRes = await mainActor().getPackageDetails(pkgName, 'highest');
		if ('ok' in packageDetailsRes) {
			packageDetails = packageDetailsRes.ok;
		}
		else {
			packageDetails = null;
			loaded = true;
			return;
		}

		let res = await storageActor(packageDetails.publication.storage).downloadChunk(`${packageDetails.config.name}@${packageDetails.config.version}/${packageDetails.config.readme}`, 0n);
		if ('ok' in res) {
			let readme = new TextDecoder().decode(new Uint8Array(res.ok));
			readmeHtml = micromark(readme);
			let div = document.createElement('div');
			div.innerHTML = readmeHtml;
			div.querySelectorAll('img').forEach((img) => {
				let src = img.getAttribute('src');
				if (!src.startsWith('http')) {
					let sep = src.startsWith('/') ? '' : '/';
					// todo: master branch?
					img.src = packageDetails.config.repository + sep + 'raw/main/' + src;
				}
			});
			readmeHtml = div.innerHTML;
		}
		else {
			readmeHtml = '<i>Not found README.md</i>';
		}
		loaded = true;
	});

	let installHoverTimer: any;
	function installMouseenter() {
		clearTimeout(installHoverTimer);
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
		navigator.clipboard.writeText(`mops add ${packageDetails.config.name}`);
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

	$: selectedTab = $routeParams.tab || '';
	function selectTab(tab: string) {
		selectedTab = tab;
		if (tab) {
			push(`/${$routeParams.package}/${tab}`);
		}
		else {
			push(`/${$routeParams.package}`);
		}
	}

	function isTabSelected(tab: string, selectedTab: string): boolean {
		return selectedTab == tab;
	}

	onMount(load);
</script>

<svelte:head>
	{#if packageDetails}
		<title>{packageDetails.config.name}  &nbsp;&bull;&nbsp; Motoko Package</title>
	{:else}
		<title>Motoko Package</title>
	{/if}
</svelte:head>

<Header></Header>

<div class="package">
	{#if loaded}
		{#if packageDetails}
			<div class="header">
				<div class="header-content">
					<div class="name">{packageDetails.config.name}</div>
					<div class="version">{packageDetails.config.version} published <Date date="{Number(packageDetails.publication.time / 1000000n)}"></Date></div>

					<div class="install">
						<div class="command-container" class:hover="{installHovered}" on:mouseenter="{installMouseenter}" on:mouseleave="{installMouseleave}">
							<div class="text" on:click="{copyCommand}">Install</div>
							<div class="command" on:click="{copyCommand}">mops add {packageDetails.config.name}</div>
						</div>
						<div class="clipboard-text">{copiedToClipboard ? 'Copied to clipboard!' : 'Click to copy to clipboard'}</div>
					</div>
				</div>
			</div>

			<!-- tabs -->
			<div class="tabs">
				<div class="tab" class:selected={isTabSelected('', selectedTab)} on:click={() => selectTab('')}>Readme</div>
				<div class="tab" class:selected={isTabSelected('dependencies', selectedTab)} on:click={() => selectTab('dependencies')}>Dependencies ({packageDetails.deps.length + packageDetails.devDeps.length})</div>
				<div class="tab" class:selected={isTabSelected('dependents', selectedTab)} on:click={() => selectTab('dependents')}>Dependents ({packageDetails.dependents.length})</div>
			</div>

			<div class="body">

				<div class="content">
					{#if selectedTab == ''}
						{@html readmeHtml}
					{:else if selectedTab == 'dependencies'}
						<h3>Dependencies</h3>
							<div class="packages">
							{#each packageDetails.deps as pkg}
								<PackageCard {pkg} showVersion={true} />
							{/each}
						</div>
						<h3>Dev Dependencies</h3>
							<div class="packages">
							{#each packageDetails.devDeps as pkg}
								<PackageCard {pkg} showVersion={true} />
							{/each}
						</div>
					{:else if selectedTab == 'dependents'}
						<div class="packages">
							{#each packageDetails.dependents as pkg}
								<PackageCard {pkg} showDownloads={true} />
							{/each}
						</div>
					{/if}
				</div>

				<div class="right-panel">
					<div class="detail">
						<div class="label">Downloads</div>
						<div class="value">{packageDetails.downloadsTotal}</div>
					</div>
					{#if packageDetails.config.repository}
						<div class="detail">
							<div class="label">Repository</div>
							<a class="value repository" href="{packageDetails.config.repository}" target="_blank">
								<img class="github-icon" src="/img/github.svg" alt="GitHub logo" loading="lazy" />
								{packageDetails.config.repository.replace(/https?:\/\/(www\.)?(github\.com\/)?/, '')}
							</a>
						</div>
					{/if}
					{#if packageDetails.config.documentation}
						<div class="detail">
							<div class="label">Documentation</div>
							<a class="value" href="{packageDetails.config.documentation}" target="_blank">{packageDetails.config.documentation.replace(/https?:\/\/(www\.)?/, '')}</a>
						</div>
					{/if}
					{#if packageDetails.config.license}
						<div class="detail">
							<div class="label">License</div>
							<a class="value" href="https://spdx.org/licenses/{packageDetails.config.license}.html" target="_blank">{packageDetails.config.license}</a>
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
			<div class="not-found">
				<NotFound>Package "{pkgName}" not found</NotFound>
			</div>
		{/if}
	{:else}
		<Loader></Loader>
	{/if}
</div>

<Footer />

<style>
	.package {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.not-found {
		margin-top: 20px;
	}

	.header {
		display: flex;
		justify-content: center;
		width: 100%;
		background: var(--color-secondary);
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

	.tabs {
		display: flex;
		flex-wrap: wrap;
		width: 100%;
		max-width: 900px;
	}

	.tab {
		padding: 10px 60px;
		border-bottom: 1px solid var(--color-primary);
		background: white;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.tab.selected {
		background: var(--color-secondary);
	}

	.packages {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.body {
		display: flex;
		margin-top: 20px;
		width: 100%;
		max-width: 900px;
	}

	.content {
		flex-grow: 1;
		background: white;
		padding: 20px;
		padding-top: 0;
		min-width: 0;
		word-break: break-word;
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

	.repository {
		display: flex;
		align-items: center;
		line-height: 1;
		gap: 5px;
		white-space: normal;
	}

	.github-icon {
		width: 20px;
		height: 20px;
		filter: hue-rotate(45deg) contrast(0.6);
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
		overflow-x: auto;
	}

	:global(pre > code) {
		display: block;
		padding: 10px;
		tab-size: 4;
	}

	@media (max-width: 750px) {
		.body {
			flex-wrap: wrap;
		}

		.right-panel {
			margin-left: 20px;
			margin-bottom: 20px;
		}
	}
</style>