<script lang="ts">
	import {link, routeParams} from 'svelte-spa-history-router';
	import pako from 'pako';
	import untar from 'js-untar';
	import {toHtml} from 'hast-util-to-html';
	import {onMount} from 'svelte';
	import '@wooorm/starry-night/style/light.css';
	import {getStarryNight} from '/logic/get-starry-night';

	type DefinitionKind = 'module' | 'class' | 'type' | 'func' | 'value' | 'type-actor';
	type Definition = {
		id: string;
		name: string;
		kind: DefinitionKind;
	}

	export let docsData: Uint8Array;

	let docsHtml = 'Loading...';
	let files: any[] = [];
	let definitions: Definition[] = [];
	let fileNameShadow = false;

	function getDefaultFileName(files: any[]): string {
		return files[0]?.name.replace('.adoc', '') || '';
	}

	$: selectedFileName = $routeParams.file ? $routeParams.file : getDefaultFileName(files);

	function isFileSelected(file: any, selectedFileName = getDefaultFileName(files)) {
		return file.name.replace('.adoc', '') == selectedFileName;
	}

	let unpack = async (docsData: Uint8Array) => {
		let decompressed = pako.inflate(docsData);
		files = await untar(decompressed.buffer);
	};

	function getModuleNesting(id: string): number {
		return [...id.replace('type.', '').matchAll(/\./g)].length;
	}

	let render = async (files: any[], fileName = getDefaultFileName(files)) => {
		let file = files.find((file) => file.name.replace('.adoc', '') == fileName);
		if (!file) {
			return;
		}

		let div = document.createElement('div');

		// adoc to html
		let text = new TextDecoder().decode(file.buffer);
		// @ts-ignore
		let asciidoctor = window.Asciidoctor();
		let doc = asciidoctor.load(text);

		// definitions
		let getKind = (line: string): DefinitionKind => {
			if (line.match(/^\w+$/i)) {
				return 'module';
			}
			if (line.startsWith('class')) {
				return 'class';
			}
			if (line.match(/type \w+ = actor {/)) {
				return 'type-actor';
			}
			if (line.startsWith('type')) {
				return 'type';
			}
			if (line.startsWith('func') || line.includes(' -> ')) {
				return 'func';
			}
			return 'value';
		};
		definitions = Object.values(doc.getRefs()).slice(1).map((def: any) => {
			return {
				id: def.id,
				name: def.id.replace('type.', '').split('.').at(-1),
				kind: def.blocks[0]?.node_name === 'listing' ? getKind(def.blocks[0]?.lines[0]) : 'value',
			};
		});

		div.innerHTML = doc.convert();

		// nested fields
		div.querySelectorAll('h3').forEach((el) => {
			if (getModuleNesting(el.id)) {
				let section = el.closest('.sectionbody') as HTMLElement;
				if (section) {
					// sticky sub header
					// let sectionTitle = section.previousElementSibling as HTMLElement;
					// sectionTitle.style.position = 'sticky';
					// sectionTitle.style.top = '72px';
					// sectionTitle.style.background = 'white';
					// sectionTitle.style.borderBottom = '1px solid gray';

					section.style.marginLeft = '0px';
					section.style.paddingLeft = '20px';
					section.style.borderLeft = '1px solid rgb(222 222 222)';
				}
			}
		});

		let starryNight = await getStarryNight();
		div.querySelectorAll('pre code.language-motoko, pre code.language-mo').forEach((el) => {
			let text = el.textContent;

			// beautify
			let indentLevel = 0;
			if (el.closest('.sectionbody > :first-child.listingblock.no-repl')) {
				text = text.replaceAll(/(;)\s|(\{)\s|\s(\})/g, '$1$2$3')
					.replace(/\{|\}|;/g, (m0) => {
						if (m0 == '{') {
							indentLevel++;
						}
						if (m0 == '}') {
							indentLevel--;
						}

						let indent = '\t'.repeat(indentLevel);

						if (m0 == ';' || m0 == '{') {
							return `${m0}\n${indent}`;
						}
						return `\n${indent}${m0}`;
					})
					.replace(/([^;])(\n\t*})/g, '$1;$2')
					.replaceAll('}\t;', '};');

				if (!text.trim().endsWith(';')) {
					text += ';';
				}
			}

			// syntax highlight
			el.innerHTML = toHtml(starryNight.highlight(text, 'source.mo'));
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
	let bottomSpace = 0;
	let filesDefsDiff = 0;

	// adjust side panels' height on scroll
	let onScroll = () => {
		if (!filesDefsDiff) {
			filesDefsDiff = defsEl.offsetTop - filesEl.offsetTop;
		}

		let filesTop = Math.max(0, filesEl.getBoundingClientRect().top);
		let scrollTopWithFooter = document.body.scrollTop + document.body.clientHeight + footerHeight + margin;
		let footerSizeFiles = Math.max(bottomSpace, scrollTopWithFooter - document.body.scrollHeight);
		let footerSizeDefs = Math.max(bottomSpace, scrollTopWithFooter + filesDefsDiff - document.body.scrollHeight);

		let defsExtra = filesDefsDiff;
		if (document.body.scrollHeight < scrollTopWithFooter + filesDefsDiff) {
			defsExtra -= scrollTopWithFooter + filesDefsDiff - document.body.scrollHeight;
		}
		defsExtra = Math.max(0, defsExtra);

		filesPanelHeight = `calc(100vh - ${filesTop + footerSizeFiles}px)`;
		defsPanelHeight = `calc(100vh - ${filesTop + footerSizeDefs}px - ${defsExtra}px)`;

		if (filesTop < 1) {
			defsPanelTop = `${filesDefsDiff}px`;
		}
		else {
			defsPanelTop = '';
		}

		fileNameShadow = filesTop < 1;
	};

	onMount(() => {
		filesEl && onScroll();
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
		}, 700);
	}

	$: unpack(docsData);
	$: render(files, $routeParams.file);
</script>

<div id="package-docs" class="package-docs">
	<div class="files" style:max-height={filesPanelHeight} bind:this={filesEl}>
		<div class="files-scrollable">
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
				<div class="definitions-scrollable">
					{#each definitions as definition}
						<a
							class="definition nesting-{getModuleNesting(definition.id)}"
							class:in-viewport={false}
							href="#{definition.id}"
							on:click={definitionOnClick}
						>
							<span class="def-kind def-kind-{definition.kind}">{definition.kind.split('-')[0]}</span> <span class="def-name">{definition.name}</span>
						</a>
					{/each}
				</div>
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
		display: flex;
		position: sticky;
		top: 0;
		max-height: calc(100vh - 330px);
		width: 265px;
		flex-shrink: 0;
	}

	.files-scrollable,
	.definitions-scrollable {
		overflow: auto;
		margin: 15px 0;
		flex-grow: 1;
	}

	:is(.files-scrollable, .definitions-scrollable)::-webkit-scrollbar {
		width: 10px;
	}

	:is(.files-scrollable, .definitions-scrollable)::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.03);
	}

	:is(.files-scrollable, .definitions-scrollable)::-webkit-scrollbar-thumb {
		background-color: lightgrey;
		border-radius: 5px;
	}

	.file, .definition {
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

	/* definitions */
	.definitions-scrollable {
		border-left: 2px solid rgb(246, 246, 246);
		padding-left: 2px;
	}

	.definition {
		font-weight: normal;
	}

	.definition:hover .def-name {
		filter: brightness(1.3) contrast(1.3);
	}
	.definition:hover .def-kind-func + .def-name {
		filter: brightness(1.2) contrast(1.25);
	}

	.definition.nesting-1 { margin-left: 20px; }
	.definition.nesting-2 { margin-left: 40px; }

	.def-kind {
		color: #9f9f9f;
		opacity: 1;
	}

	.def-kind-module + .def-name,
	.def-kind-type-actor + .def-name,
	.def-kind-type + .def-name {
		color: hsl(213 60% 40% / 1);
	}
	.def-kind-type-actor + .def-name {
		font-weight: 500;
	}
	.def-kind-class + .def-name {
		color: hsl(0deg 50% 45%);
	}
	.def-kind-module + .def-name {
		font-weight: 700;
	}
	.def-kind-class + .def-name {
		font-weight: 500;
	}
	.def-kind-func + .def-name {
		color: hsl(35 78% 38% / 1);
	}
	.def-kind-value + .def-name {
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
		line-height: 1.5;
	}

	:global(h2) {
		margin-top: 1em;
		margin-bottom: 0.7em;
	}

	:global(h2, h3) {
		transition: background-color cubic-bezier(0, 0.79, 0.76, 0.5) 700ms;
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
		line-height: 1.55;
	}

	@media (max-width: 1300px) {
		.definitions {
			display: none;
		}
	}

	@media (max-width: 1030px) {
		.package-docs {
			flex-wrap: wrap;
		}

		.files {
			position: static;
			flex-grow: 1;
			height: 185px;
		}
	}
</style>