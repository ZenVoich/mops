import {micromark} from 'micromark';
import {gfmTable, gfmTableHtml} from 'micromark-extension-gfm-table';
import {gfmAutolinkLiteral, gfmAutolinkLiteralHtml} from 'micromark-extension-gfm-autolink-literal';
import {toHtml} from 'hast-util-to-html';

import {getStarryNight} from './get-starry-night';

export let markdownToHtml = async (markdown: string, repositoryUrl?: string) => {
	// make links to issues and PRs clickable
	if (repositoryUrl) {
		markdown = markdown.replace(/\(#(\d+)\)/g, `([#$1](${repositoryUrl}/issues/$1))`);
	}

	let div = document.createElement('div');
	div.innerHTML = micromark(markdown, {
		extensions: [gfmTable(), gfmAutolinkLiteral()],
		htmlExtensions: [gfmTableHtml(), gfmAutolinkLiteralHtml()],
	});

	// replace relative url to github absolute url
	if (repositoryUrl) {
		let relToAbs = (url: string) => {
			if (url && !url.startsWith('http')) {
				let sep = url.startsWith('/') ? '' : '/';
				// todo: master branch?
				return repositoryUrl + sep + 'raw/main/' + url;
			}
			return url;
		};
		div.querySelectorAll('img').forEach((img) => {
			img.src = relToAbs(img.getAttribute('src'));
		});
		div.querySelectorAll('a').forEach((a) => {
			a.href = relToAbs(a.getAttribute('href'));
		});
	}

	// syntax highlight
	let starryNight = await getStarryNight();
	div.querySelectorAll('pre code.language-motoko, pre code.language-mo').forEach((el) => {
		el.innerHTML = toHtml(starryNight.highlight(el.textContent, 'source.mo'));
	});

	return div.innerHTML;
};