<script lang="ts">
	import {onMount} from 'svelte';
	import {debounce} from 'throttle-debounce';
	import {currentURL, routeParams, push, link} from 'svelte-spa-history-router';

	import {PackageDetails} from '/declarations/main/main.did.js';
	import {mainActor, storageActor} from '/logic/actors';

	import Header from './Header.svelte';
	import Loader from './Loader.svelte';
	import Date from './Date.svelte';
	import NotFound from './NotFound.svelte';
	import Footer from './Footer.svelte';
	import PackageCard from './PackageCard.svelte';
	import PackageReadme from './PackageReadme.svelte';
	import PackageDocs from './PackageDocs.svelte';
	import PackageRightPanel from './PackageRightPanel.svelte';
	import githubImg from '/img/github.svg';

	let pkgName: string;
	$: pkgName = $routeParams.packageName;
	$: pkgVersion = $routeParams.version;
	$: $currentURL && load();


	let readme: string;
	let docsData: Uint8Array;
	let packageDetails: PackageDetails;
	let loaded = false;
	let installHovered = false;
	let copiedToClipboard = false;

	$: githubDeps = packageDetails?.config.dependencies.filter(dep => dep.repo);

	let load = debounce(10, async () => {
		if (!pkgName || loaded && pkgName === packageDetails?.config.name && (!pkgVersion || pkgVersion === packageDetails?.config.version)) {
			return;
		}
		loaded = false;

		let ver = pkgVersion || 'highest';
		let packageDetailsRes = await mainActor().getPackageDetails(pkgName, ver);
		if ('ok' in packageDetailsRes) {
			packageDetails = packageDetailsRes.ok;
		}
		else {
			packageDetails = null;
			loaded = true;
			return;
		}

		let dowloadReadme = async () => {
			let res = await storageActor(packageDetails.publication.storage).downloadChunk(`${packageDetails.config.name}@${packageDetails.config.version}/${packageDetails.config.readme}`, 0n);
			if ('ok' in res) {
				readme = new TextDecoder().decode(new Uint8Array(res.ok));
			}
			else {
				readme = '*Not found README.md*';
			}
		};


		let downloadDocs = async () => {
			let docsRes = await storageActor(packageDetails.publication.storage).downloadChunk(`${packageDetails.config.name}@${packageDetails.config.version}/docs.tgz`, 0n);
			if ('ok' in docsRes) {
				docsData = new Uint8Array(docsRes.ok);
			}
			else {
				docsData = null;
			}
		};

		await Promise.all([dowloadReadme(), downloadDocs()]);

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
		let path = `/${$routeParams.packageId}`;
		if (tab) {
			path += `/${tab}`;
		}
		push(path);
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

					<div class="keywords">
						{#each packageDetails.config.keywords as keyword}
							<a class="keyword" href="/search/keyword:{keyword}" use:link>#{keyword}</a>
						{/each}
					</div>
				</div>
			</div>

			<!-- tabs -->
			<div class="tabs">
				<div class="tab" class:selected={isTabSelected('docs', selectedTab)} on:click={() => selectTab('docs')}>Docs</div>
				<div class="tab" class:selected={isTabSelected('', selectedTab)} on:click={() => selectTab('')}>Readme</div>
				<div class="tab" class:selected={isTabSelected('versions', selectedTab)} on:click={() => selectTab('versions')}>Versions ({packageDetails.versionHistory.length})</div>
				<div class="tab" class:selected={isTabSelected('dependencies', selectedTab)} on:click={() => selectTab('dependencies')}>Dependencies ({packageDetails.deps.length + githubDeps.length})</div>
				<div class="tab" class:selected={isTabSelected('dependents', selectedTab)} on:click={() => selectTab('dependents')}>Dependents ({packageDetails.dependents.length})</div>
			</div>

			<div class="body">
				{#if selectedTab == 'docs'}
					<div class="layout-wide">
						{#if docsData}
							<PackageDocs docsData={docsData}></PackageDocs>
						{:else}
							<div class="no-docs">No documentation found</div>
						{/if}
					</div>
				{:else}
					<div class="layout-compact">
						<div class="middle">
							{#if selectedTab == ''}
								<PackageReadme readme={readme} repository={packageDetails.config.repository}></PackageReadme>
							{:else if selectedTab == 'versions'}
								<div class="packages">
									{#each packageDetails.versionHistory as versionSummary}
										<div class="version-summary">
											<a href="/{pkgName}@{versionSummary.config.version}" use:link>{versionSummary.config.version}</a>
											<div class="version-published"><Date date="{Number(versionSummary.publication.time / 1000000n)}"></Date></div>
										</div>
									{/each}
								</div>
							{:else if selectedTab == 'dependencies'}
								<h3>Dependencies</h3>
								<div class="packages">
									{#each packageDetails.deps as pkg}
										<PackageCard {pkg} showVersion={true} />
									{/each}
								</div>
								{#if packageDetails.devDeps.length}
									<h3>Dev Dependencies</h3>
									<div class="packages">
										{#each packageDetails.devDeps as pkg}
											<PackageCard {pkg} showVersion={true} />
										{/each}
									</div>
								{/if}
								{#if githubDeps.length}
									<h3>GitHub Dependencies</h3>
									<div class="packages">
										{#each githubDeps as dep}
											<div class="github-dep">
												<a class="github-dep-repo" href="{dep.repo}" target="_blank">
													<img class="github-icon" src="{githubImg}" alt="GitHub logo" loading="lazy" />
													<div>{dep.repo.replace(/https?:\/\/(www\.)?(github\.com\/)?/, '').split('#')[0]}</div>
												</a>
												<div class="github-dep-tag">{dep.repo.split('#')[1] || ''}</div>
											</div>
										{/each}
									</div>
								{/if}
							{:else if selectedTab == 'dependents'}
								<div class="packages">
									{#each packageDetails.dependents as pkg}
										<PackageCard {pkg} showDownloads={true} />
									{/each}
								</div>
							{/if}
						</div>
						<div class="right">
							<PackageRightPanel {packageDetails}></PackageRightPanel>
						</div>
					</div>
				{/if}
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
		margin-bottom: 20px;
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

	.keywords {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		font-family: 'Open Sans', monospace;
		font-size: 14px;
	}

	.tabs {
		display: flex;
		overflow: auto;
		width: 100%;
		flex-shrink: 0;
		max-width: 1280px;
		margin-top: 25px;
	}

	.tab {
		padding: 10px 20px;
		border-bottom: 1px solid var(--color-primary);
		background: white;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		flex-grow: 1;
		flex-basis: 0;
		text-align: center;
	}

	.tab.selected {
		background: var(--color-secondary);
	}

	.version-summary {
		display: flex;
		justify-content: space-between;
		padding-bottom: 3px;
		border-bottom: 1.5px dashed lightgray;
	}

	.packages {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.github-dep {
		display: flex;
		justify-content: space-between;
		margin-right: 30px;
	}

	.github-dep-repo {
		display: flex;
		gap: 5px;
	}

	.body {
		display: flex;
		justify-content: center;
		margin-top: 20px;
		width: 100%;
	}

	.layout-compact {
		display: flex;
		max-width: 900px;
		flex-grow: 1;
		min-width: 0;
	}

	.layout-compact .middle {
		flex-grow: 1;
		background: white;
		padding: 20px;
		padding-top: 0;
		min-width: 0;
		word-break: break-word;
	}

	.layout-wide {
		display: flex;
		max-width: 1280px;
		flex-grow: 1;
		min-width: 0;
	}

	.github-icon {
		width: 20px;
		height: 20px;
		filter: hue-rotate(45deg) contrast(0.6);
	}

	.no-docs {
		margin: auto;
	}

	@media (max-width: 750px) {
		.layout-compact {
			flex-wrap: wrap;
		}
	}
</style>