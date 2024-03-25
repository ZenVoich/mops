<script lang="ts">
	import {markdownToHtml} from '$lib/markdown-to-html';
	import releasesJson from '../../../releases.json';
	import Header from '../components/Header.svelte';
	import Install from '../components/Install.svelte';

	let releases = Object.entries(releasesJson.versions).sort(([_, a], [__, b]) => b.time - a.time);
</script>

<svelte:head>
	<title>Mops CLI Releases</title>
</svelte:head>

<Header></Header>

<Install></Install>

<div class="releases">
	{#each releases as [version, release]}
		<div class="release">
			<h2>{version}</h2>
			<div class="meta">
				{new Date(release.time).toISOString().split('T')[0]}
				<span class="bullet">•</span>
				{release.hash.slice(0, 7)}
			</div>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<p>{@html markdownToHtml(release.relseaseNotes)}</p>
		</div>
	{/each}
</div>

<style>
	h2 {
		margin-bottom: 0.5rem;
	}

	.releases {
		margin: 1rem;
	}

	.release {
		margin-bottom: 2.5rem;
	}

	.meta {
		color: gray;
		font-size: 0.8rem;
		margin-bottom: 0.5rem;
	}
</style>