<script lang="ts">
	import {link, routeParams} from 'svelte-spa-history-router';
	import pako from 'pako';
	import untar from 'js-untar';
	import {createStarryNight} from '@wooorm/starry-night';
	import moGrammar from '@wooorm/starry-night/lang/source.mo';
	import {toHtml} from 'hast-util-to-html';
	import {onMount} from 'svelte';

	export let docsData: Uint8Array;
	let docsHtml = 'Loading...';
	let files: any[] = [];
	let definitions: any[] = [];
	let fileNameShadow = false;

	function getDefaultFileName(files: any[]): string {
		return files[0]?.name.replace('.adoc', '');
	}

	$: selectedFileName = $routeParams.file ? $routeParams.file : getDefaultFileName(files);

	function isFileSelected(file: any, selectedFileName = getDefaultFileName(files)) {
		return file.name.replace('.adoc', '') == selectedFileName;
	}

	let unpack = async (docsData: Uint8Array) => {
		let decompressed = pako.inflate(docsData);
		files = await untar(decompressed.buffer);
	};

	let render = async (files: any[], fileName = getDefaultFileName(files)) => {
		let file = files.find((file) => file.name.replace('.adoc', '') == fileName);
		if (!file) {
			return;
		}

		let div = document.createElement('div');

		let text = new TextDecoder().decode(file.buffer);
		// @ts-ignore
		let asciidoctor = window.Asciidoctor();
		let doc = asciidoctor.load(text);
		definitions = Object.keys(doc.getRefs()).slice(1);
		div.innerHTML = doc.convert();

		// syntax highlight
		let starryNight = await createStarryNight([moGrammar]);
		div.querySelectorAll('pre code.language-motoko, pre code.language-mo').forEach((el) => {
			el.innerHTML = toHtml(starryNight.highlight(el.textContent, 'source.mo'));
		});

		docsHtml = div.innerHTML;

		requestAnimationFrame(() => {
			scrollToDefiition();
		});
	};

	let docHeaderEl: HTMLElement;
	let filesEl: HTMLElement;
	let defsEl: HTMLElement;

	let filesPanelHeight = '';
	let defsPanelHeight = '';
	let defsPanelTop = '';
	let footerHeight = document.querySelector('#app-footer').getBoundingClientRect().height;
	let margin = 20;
	let filesDefsDiff = 0;

	// adjust side panel's height on scroll
	let onScroll = () => {
		if (!filesDefsDiff) {
			filesDefsDiff = defsEl.offsetTop - filesEl.offsetTop;
		}

		let filesTop = Math.max(0, filesEl.getBoundingClientRect().top);
		let footerSizeFiles = Math.max(0, document.body.scrollTop + document.body.clientHeight + footerHeight + margin - document.body.scrollHeight);
		let footerSizeDefs = Math.max(0, document.body.scrollTop + document.body.clientHeight + footerHeight + margin + filesDefsDiff - document.body.scrollHeight);

		filesPanelHeight = `calc(100vh - ${filesTop + footerSizeFiles}px)`;
		defsPanelHeight = `calc(100vh - ${filesTop + footerSizeDefs}px)`;

		if (filesTop < 1) {
			defsPanelTop = `${filesDefsDiff}px`;
		}
		else {
			defsPanelTop = '';
		}

		fileNameShadow = filesTop < 1;
	};

	filesEl && onScroll();

	onMount(() => {
		window.addEventListener('scroll', onScroll);

		return () => {
			window.removeEventListener('scroll', onScroll);
		};
	});

	function definitionOnClick(e: MouseEvent) {
		e.preventDefault();
		let id = (e.currentTarget as HTMLElement).getAttribute('href');
		history.replaceState({}, '', id);
		scrollToDefiition();
	}

	function scrollToDefiition() {
		let id = window.location.hash.slice(1);
		let el = document.querySelector(`[id="${id}"]`) as HTMLElement;
		if (!el) {
			return;
		}
		document.body.scroll({
			top: el.offsetTop - docHeaderEl.offsetHeight - 10,
			behavior: 'smooth',
		});
		el.classList.add('highlight');
		setTimeout(() => {
			el.classList.remove('highlight');
		}, 600);
	}

	$: unpack(docsData);
	$: render(files, $routeParams.file);
</script>

<div id="package-docs" class="package-docs">
	<div class="files" style:max-height={filesPanelHeight} bind:this={filesEl}>
		{#each files as file}
			<a
				class="file"
				class:selected={isFileSelected(file, $routeParams.file)}
				href="/{$routeParams.packageId}/{$routeParams.tab}/{file.name.replace('.adoc', '')}"
				use:link
			>
				{file.name.replace('.adoc', '')}
			</a>
		{/each}
	</div>

	<div class="middle-right">
		<div class="doc-header" class:shadow={fileNameShadow} bind:this={docHeaderEl}>
			<div class="file-name"><code>{selectedFileName}</code></div>
		</div>

		<div class="content-and-definitions">
			<div class="content">
				{@html docsHtml}
			</div>

			<div class="definitions" style:max-height={defsPanelHeight} style:top={defsPanelTop} bind:this={defsEl}>
				{#each definitions as definition}
					<a
						class="definition"
						class:in-viewport={false}
						href="#{definition}"
						on:click={definitionOnClick}
					>
						{definition}
					</a>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.package-docs {
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
	}

	.content-and-definitions {
		display: flex;
	}

	.doc-header  {
		position: sticky;
		top: -1px;
		z-index: 1;
		background: white;
		margin-bottom: 25px;
		padding: 10px;
	}

	.doc-header.shadow {
		box-shadow: -4px 2px 3px 0px #c7c7c7;
	}
	.doc-header.shadow .file-name {
		border-bottom-color: transparent;
	}

	.doc-header .file-name {
		display: flex;
		padding: 8px 0;
		border-bottom: 1px solid rgb(111 111 111);
		font-size: 2em;
		font-weight: bold;
		padding-left: 10px;
	}

	.files, .definitions {
		position: sticky;
		top: 0;
		max-height: calc(100vh - 330px);
		overflow: auto;
		width: 260px;
		flex-shrink: 0;
	}

	:is(.files, .definitions)::-webkit-scrollbar {
		width: 10px;
	}

	:is(.files, .definitions)::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.03);
	}

	:is(.files, .definitions)::-webkit-scrollbar-thumb {
		background-color: lightgrey;
		border-radius: 5px;
	}

	.files {
		padding-right: 2px;
		background: white;
		z-index: 2;
	}

	.file, .definition {
		display: block;
		padding: 6px 12px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--color-primary);
	}

	.definitions {
		border-left: 2px solid rgb(246, 246, 246);
		padding-left: 2px;
	}

	.definition {
		font-weight: normal;
	}

	.file:hover {
		background: rgb(247, 247, 247);
	}

	.file.selected {
		background: var(--color-secondary);
		color: black;
	}

	.content {
		flex-basis: 0;
		flex-grow: 1;
		padding: 20px;
		padding-top: 0;
		min-width: 0;
		/* extra space for scroll */
		min-height: 1500px;
	}

	:global(h2, h3) {
		transition: background-color cubic-bezier(0, 0.79, 0.56, 0.5) 0.6s;
	}

	:global(h2.highlight, h3.highlight) {
		background: rgb(236 238 0 / 30%);
	}

	:global(code) {
		padding: 3px;
		border-radius: 3px;
		overflow-x: auto;
		background: rgb(236 238 238);
	}

	:global(pre > code) {
		display: block;
		padding: 10px;
		tab-size: 4;
		background: rgb(246 248 248);
		line-height: 1.5;
	}
</style>