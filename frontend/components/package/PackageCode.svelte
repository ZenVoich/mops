<script lang="ts">
	import {routeParams} from 'svelte-spa-history-router';
	import {toHtml} from 'hast-util-to-html';
	import {onMount} from 'svelte';
	import {downloadFile} from 'ic-mops/api/downloadPackageFiles';
	import '@wooorm/starry-night/style/light';
	import {getStarryNight} from '/logic/get-starry-night';

	import {PackageDetails} from '/declarations/main/main.did.js';
	import PackageCodeTreeView from './PackageCodeTreeView.svelte';
	import {filesize} from 'filesize';
	import {mainActor} from '/logic/actors';

	export let packageDetails : PackageDetails;
	export let fileIds : string[];

	let pkgId = `${packageDetails.config.name}@${packageDetails.config.version}`;

	let files : string[] = fileIds.map((id) => id.replace(pkgId + '/', ''));
	let tree = buildTree(files);

	let cachedFilesContent = new Map<string, string>();
	let cachedFilesContentHtml = new Map<string, string>();
	let fileContent = '';
	let fileContentHtml : null | string = null;

	$: selectedFileName = $routeParams.file ? $routeParams.file : '';

	type Tree = {
		name : string;
		path : string;
		children : Tree;
	}[];

	function buildTree(filenames : string[]) : Tree {
		const root : Tree = [];

		filenames.forEach(filename => {
			const parts = filename.split('/');
			let currentLevel = root;

			parts.forEach((part, index) => {
				const path = parts.slice(0, index + 1).join('/');
				let node = currentLevel.find(c => c.name === part);

				if (!node) {
					node = {name: part, path, children: []};
					currentLevel.push(node);
				}

				currentLevel = node.children;
			});
		});

		return root;
	}

	let fileHashes = new Map<string, string>();

	async function loadFileHashes() {
		let main = await mainActor();
		let res = await main.getFileHashesQuery(packageDetails.config.name, packageDetails.config.version);
		if ('ok' in res) {
			fileHashes = new Map(res.ok.map(([name, hash]) => [name, Array.from(hash).map((byte) => byte.toString(16).padStart(2, '0')).join('')]));
		}
	}

	function getFileHash(filename : string, _d : any) {
		return fileHashes.get(pkgId + '/' + filename) || '';
	}

	loadFileHashes();

	async function loadSelectedFile() {
		if (cachedFilesContentHtml.has(selectedFileName)) {
			fileContentHtml = cachedFilesContentHtml.get(selectedFileName);
			fileContent = cachedFilesContent.get(selectedFileName);
			return;
		}

		fileContentHtml = null;

		let {data} = await downloadFile(packageDetails.publication.storage.toText(), pkgId + '/' + selectedFileName);
		fileContent = new TextDecoder().decode(new Uint8Array(data));

		// syntax highlight
		let starryNight = await getStarryNight();

		if (selectedFileName.endsWith('.mo')) {
			fileContentHtml = toHtml(starryNight.highlight(fileContent, 'source.mo'));
		}
		else if (selectedFileName.endsWith('.md')) {
			fileContentHtml = toHtml(starryNight.highlight(fileContent, 'text.md'));
		}
		else if (selectedFileName.endsWith('.toml')) {
			fileContentHtml = toHtml(starryNight.highlight(fileContent, 'source.toml'));
		}
		else {
			fileContentHtml = fileContent;
		}

		cachedFilesContent.set(selectedFileName, fileContent);
		cachedFilesContentHtml.set(selectedFileName, fileContentHtml);
	}

	$: {
		if (selectedFileName) {
			loadSelectedFile();
		}
	}

	// calculate el heights
	let filesEl : HTMLElement;
	let contentEl : HTMLElement;

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
			{#each tree as node}
				<PackageCodeTreeView {node} root={true}></PackageCodeTreeView>
			{/each}
		</div>
	</div>

	<div class="middle-right">
		<div class="header" hidden={!selectedFileName}>
			<div class="file-name"><code>{selectedFileName}</code></div>
			<div class="file-size">{filesize(fileContent.length, {standard: 'iec', round: 1})}</div>
			<div class="bullet">•</div>
			<div class="file-hash">{getFileHash(selectedFileName, fileHashes)}</div>
		</div>

		<div class="code-view" bind:this={contentEl}>
			<div class="code-view-wrap">
				<div class="line-numbers">
					{#each fileContent.split('\n') as _line, i}
						<div class="line-number">{i + 1}</div>
					{/each}
				</div>
				<div class="content" hidden={!selectedFileName || fileContentHtml == null}>
					{@html fileContentHtml}
				</div>
			</div>
		</div>

		<div class="loading-text" hidden={!selectedFileName || fileContentHtml != null}>
			Loading...
		</div>

		<div class="no-file-selected" hidden={selectedFileName}>
			<div class="file-name">Select a file to view its content</div>
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

	.header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 0;
		border-bottom: 1px solid rgb(111 111 111);
		padding-left: 10px;
	}

	.header .file-name {
		font-size: 2em;
		font-weight: bold;
	}

	.header .file-size {
		margin-left: auto;
	}

	.header :is(.file-size, .file-hash, .bullet) {
		white-space: nowrap;
		font-size: 13px;
	}

	.header .file-hash {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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

	/* files */
	.files {
		background: white;
		z-index: 2;
	}

	.files-scrollable {
		padding-right: 2px;
	}

	.no-file-selected, .loading-text {
		margin-left: 10px;
		margin-top: 10px;
	}

	/* code */
	.code-view {
		font-family: monospace;
		line-height: 1.5;
		overflow: auto;
	}

	.code-view-wrap {
		display: flex;
	}

	.line-numbers {
		position: sticky;
		left: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		padding: 8px 10px;
		background: rgb(246 248 248);
		color: #8e8e8e;
		border-right: 1px solid rgb(185 185 185);
		user-select: none;
	}

	.content {
		flex-grow: 1;
		padding: 8px 15px;
		white-space: pre;
		background: rgb(246 248 248);
	}

	@media (max-width: 1030px) {
		.package-code {
			flex-wrap: wrap;
		}

		.content {
			min-height: 250px;
		}

		.files {
			position: static;
			flex-grow: 1;
			height: 185px;
		}
	}
</style>