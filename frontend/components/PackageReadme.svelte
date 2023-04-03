<script lang="ts">
	import {micromark} from 'micromark';
	import {createStarryNight} from '@wooorm/starry-night';
	import moGrammar from '@wooorm/starry-night/lang/source.mo';
	import {toHtml} from 'hast-util-to-html';
	import '@wooorm/starry-night/style/light.css';

	export let readme = '';
	export let repository = '';
	let readmeHtml = 'Loading...';

	let render = async (readme: string) => {
		let div = document.createElement('div');
		div.innerHTML = micromark(readme);

		// replace relative url to github absolute url
		let relToAbs = (url: string) => {
			if (url && !url.startsWith('http')) {
				let sep = url.startsWith('/') ? '' : '/';
				// todo: master branch?
				return repository + sep + 'raw/main/' + url;
			}
			return url;
		};
		div.querySelectorAll('img').forEach((img) => {
			img.src = relToAbs(img.getAttribute('src'));
		});
		div.querySelectorAll('a').forEach((a) => {
			a.href = relToAbs(a.getAttribute('href'));
		});

		// syntax highlight
		let starryNight = await createStarryNight([moGrammar]);
		div.querySelectorAll('pre code.language-motoko, pre code.language-mo').forEach((el) => {
			el.innerHTML = toHtml(starryNight.highlight(el.textContent, 'source.mo'));
		});
		readmeHtml = div.innerHTML;
	};

	$: render(readme);
</script>

{@html readmeHtml}

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