<script lang="ts">
	import pako from 'pako';
	import untar from 'js-untar';
	import {createStarryNight} from '@wooorm/starry-night';
	import moGrammar from '@wooorm/starry-night/lang/source.mo';
	import {toHtml} from 'hast-util-to-html';

	export let docsData: Uint8Array;
	let docsHtml = 'Loading...';

	let render = async (docsData: Uint8Array) => {
		let div = document.createElement('div');

		let asciidoctor = window.Asciidoctor();
		let decompressed = pako.inflate(docsData);
		let files = await untar(decompressed.buffer);

		for (const file of files) {
			// console.log(file);

			if (file.name === 'Array.adoc') {
				let text = new TextDecoder().decode(file.buffer);
				div.innerHTML = asciidoctor.convert(text);
			}
		}

		// syntax highlight
		let starryNight = await createStarryNight([moGrammar]);
		div.querySelectorAll('pre code.language-motoko, pre code.language-mo').forEach((el) => {
			el.innerHTML = toHtml(starryNight.highlight(el.textContent, 'source.mo'));
		});

		docsHtml = div.innerHTML;
	};

	$: render(docsData);
</script>

{@html docsHtml}

<style>
	:global(h1, h2) {
		border-bottom: 1px solid rgb(177, 177, 177);
		padding-bottom: 4px;
		margin-top: 0;
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