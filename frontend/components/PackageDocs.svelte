<script lang="ts">
	import {link, routeParams} from 'svelte-spa-history-router';
	import pako from 'pako';
	import untar from 'js-untar';
	import {createStarryNight} from '@wooorm/starry-night';
	import moGrammar from '@wooorm/starry-night/lang/source.mo';
	import {toHtml} from 'hast-util-to-html';

	export let docsData: Uint8Array;
	let docsHtml = 'Loading...';
	let files: any[] = [];
	// let selectedFileName: string;
	let definitions: any[] = [];

	function getDefaultFileName(files: any[]): string {
		return files[0]?.name.replace('.adoc', '');
	}

	function isFileSelected(file: any, selectedFileName = getDefaultFileName(files)) {
		return file.name.replace('.adoc', '') == selectedFileName;
	}

	let unpack = async (docsData: Uint8Array) => {
		let decompressed = pako.inflate(docsData);
		files = await untar(decompressed.buffer);
		// selectedFileName = files[0]?.name.replace('.adoc', '');
	};

	let render = async (files: any[], fileName = getDefaultFileName(files)) => {
		let file = files.find((file) => file.name.replace('.adoc', '') == fileName);
		if (!file) {
			return;
		}

		let div = document.createElement('div');

		// @ts-ignore
		let asciidoctor = window.Asciidoctor();
		let text = new TextDecoder().decode(file.buffer);
		div.innerHTML = asciidoctor.convert(text);

		// syntax highlight
		let starryNight = await createStarryNight([moGrammar]);
		div.querySelectorAll('pre code.language-motoko, pre code.language-mo').forEach((el) => {
			el.innerHTML = toHtml(starryNight.highlight(el.textContent, 'source.mo'));
		});

		docsHtml = div.innerHTML;
	};

	$: unpack(docsData);
	// $: selectedFileName = $routeParams.file;
	// $: if ($routeParams.file) {
	// }
	$: render(files, $routeParams.file);
</script>

<div class="package-docs">
	<div class="files">
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

	<div class="content">
		{@html docsHtml}
	</div>

	<div class="definitions">
		{#each definitions as definition}
			<div class="definition">
				{definition.name}
			</div>
		{/each}
	</div>
</div>

<style>
	.package-docs {
		display: flex;
		flex-direction: row;
	}

	.files {
		width: 450px;
		background: hsl(34.35deg 100% 50% / 5.1%);
	}

	.file {
		display: block;
		padding: 6px 12px;
	}

	.file.selected {
		background: antiquewhite;
	}

	.content {
		flex-basis: 100%;
		padding: 20px;
		padding-top: 0;
	}

	.definitions {
		width: 450px;
		background: aliceblue;
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
	}
</style>