<script lang="ts">
	import {micromark} from 'micromark';
	import {gfmTable, gfmTableHtml} from 'micromark-extension-gfm-table';
	import {gfmAutolinkLiteral, gfmAutolinkLiteralHtml} from 'micromark-extension-gfm-autolink-literal';
	import {toHtml} from 'hast-util-to-html';
	import '@wooorm/starry-night/style/light.css';
	import {getStarryNight} from '/logic/get-starry-night';

	export let readme = '';
	export let repository = '';
	let readmeHtml = 'Loading...';

	let render = async (readme: string) => {
		let div = document.createElement('div');
		div.innerHTML = micromark(readme, {
			extensions: [gfmTable(), gfmAutolinkLiteral()],
			htmlExtensions: [gfmTableHtml(), gfmAutolinkLiteralHtml()],
		});

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
		let starryNight = await getStarryNight();
		div.querySelectorAll('pre code.language-motoko, pre code.language-mo').forEach((el) => {
			el.innerHTML = toHtml(starryNight.highlight(el.textContent, 'source.mo'));
		});
		readmeHtml = div.innerHTML;
	};

	$: render(readme);
</script>

<div class="readme">
	{@html readmeHtml}
</div>

<style>
	.readme {
		line-height: 1.5;
	}

	:global(.readme img) {
		max-width: 100%;
	}
</style>