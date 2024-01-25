<script lang="ts">
	import {link, routeParams} from 'svelte-spa-history-router';
	import {toHtml} from 'hast-util-to-html';
	import {onMount} from 'svelte';
	import '@wooorm/starry-night/style/light.css';
	import {getStarryNight} from '/logic/get-starry-night';
	import {downloadFile} from 'ic-mops/api/downloadPackageFiles';

	import {PackageDetails} from '/declarations/main/main.did.js';

	export let packageDetails: PackageDetails;
	export let fileIds: string[];

	let pkgId = `${packageDetails.config.name}@${packageDetails.config.version}`;
	let files: string[] = fileIds.map((id) => id.replace(pkgId + '/', ''));
	$: selectedFileName = $routeParams.file ? $routeParams.file : files[0];
	let fileContentHtml = '';

	function isFileSelected(file: string, selectedFileName = files[0]) {
		return file == selectedFileName;
	}
	let cachedFilesContentHtml = new Map<string, string>();

	async function loadSelectedFile() {
		if (cachedFilesContentHtml.has(selectedFileName)) {
			fileContentHtml = cachedFilesContentHtml.get(selectedFileName);
			return;
		}

		fileContentHtml = 'Loading...';

		await new Promise((resolve) => setTimeout(resolve, 1000));

		let {data} = await downloadFile(packageDetails.publication.storage.toText(), pkgId + '/' + selectedFileName);
		let text = new TextDecoder().decode(new Uint8Array(data));

		// syntax highlight
		let starryNight = await getStarryNight();

		if (selectedFileName.endsWith('.mo')) {
			fileContentHtml = toHtml(starryNight.highlight(text, 'source.mo'));
		}
		else {
			fileContentHtml = text + text + text + text;
		}

		cachedFilesContentHtml.set(selectedFileName, fileContentHtml);
	}

	$: {
		if (selectedFileName) {
			loadSelectedFile();
		}
	}

	// calculate el heights
	let filesEl: HTMLElement;
	let contentEl: HTMLElement;

	let filesPanelHeight = '';
	let footerHeight = document.querySelector('#app-footer').getBoundingClientRect().height;
	let margin = 20;
	let bottomSpace = 0;

	// adjust side panels' height on scroll
	let onResize = () => {
		let filesTop = Math.max(0, filesEl.getBoundingClientRect().top);
		let scrollTopWithFooter = document.body.scrollTop + document.body.clientHeight + footerHeight + margin;
		let footerSizeFiles = Math.max(bottomSpace, scrollTopWithFooter - document.body.scrollHeight);

		filesPanelHeight = `calc(100vh - ${filesTop + footerSizeFiles}px)`;
		console.log(window.innerHeight, contentEl.offsetTop, footerHeight);
		contentEl.style.maxHeight = `calc(${window.innerHeight - contentEl.offsetTop - footerHeight * 2 - margin}px)`;
	};

	onMount(() => {
		filesEl && onResize();
		window.addEventListener('resize', onResize);
		return () => {
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<div id="package-code" class="package-code">
	<div class="files" style:max-height={filesPanelHeight} bind:this={filesEl}>
		<div class="files-scrollable">
			{#each files as file}
				<a
					class="file"
					class:selected={isFileSelected(file, $routeParams.file)}
					href="/{$routeParams.packageId}/{$routeParams.tab}/{file}"
					use:link
				>
					{file}
				</a>
			{/each}
		</div>
	</div>

	<div class="middle-right">
		<div class="header">
			<div class="file-name"><code>{selectedFileName}</code></div>
		</div>

		<div class="content" bind:this={contentEl}>
			{@html fileContentHtml}
		</div>
	</div>
</div>

<style>
	.package-code {
		display: flex;
		flex-direction: row;
		flex-grow: 1;
		min-width: 0;
	}

	.middle-right {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex-grow: 1;
		padding: 10px;
	}

	/* .header {} */

	.header .file-name {
		display: flex;
		padding: 8px 0;
		border-bottom: 1px solid rgb(111 111 111);
		font-size: 2em;
		font-weight: bold;
		padding-left: 10px;
	}

	.files {
		display: flex;
		position: sticky;
		top: 0;
		max-height: calc(100vh - 330px);
		width: 265px;
		flex-shrink: 0;
	}

	.files-scrollable {
		overflow: auto;
		margin: 15px 0;
		flex-grow: 1;
	}

	.files-scrollable::-webkit-scrollbar {
		width: 10px;
	}

	.files-scrollable::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.03);
	}

	.files-scrollable::-webkit-scrollbar-thumb {
		background-color: lightgrey;
		border-radius: 5px;
	}

	.file {
		display: block;
		padding: 6px 12px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--color-primary);
	}

	/* files */
	.files {
		background: white;
		z-index: 2;
	}

	.files-scrollable {
		padding-right: 2px;
	}

	.file:hover {
		background: rgb(247, 247, 247);
	}

	.file.selected {
		background: var(--color-secondary);
		color: black;
	}

	.content {
		white-space: pre;
		font-family: monospace;
		line-height: 1.5;
		padding: 20px;
		overflow: auto;
		background: rgb(246 248 248);
	}

	@media (max-width: 1030px) {
		.package-code {
			flex-wrap: wrap;
		}

		.files {
			position: static;
			flex-grow: 1;
			height: 185px;
		}
	}
</style>