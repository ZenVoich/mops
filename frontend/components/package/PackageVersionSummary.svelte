<script lang="ts">
	import {link} from 'svelte-spa-history-router';

	import {DepChange, PackageSummaryWithChanges} from '/declarations/main/main.did.js';
	import {markdownToHtml} from '/logic/markdown-to-html';
	import Date from '../Date.svelte';

	export let summary: PackageSummaryWithChanges;

	let dd: [string, DepChange[]][] = [['Dependencies', summary.changes.deps], ['Dev Dependencies', summary.changes.devDeps]];
</script>

<div class="version-summary">
	<div class="header">
		<a class="version" href="/{summary.config.name}@{summary.config.version}" use:link>{summary.config.version}</a>
		<div class="version-published"><Date date="{Number(summary.publication.time / 1000000n)}"></Date></div>
	</div>
	{#if summary.changes.notes}
		<div class="title">📄 Release notes</div>
		<div class="notes">
			{#await markdownToHtml(summary.changes.notes, summary.config.repository)}
				Loading...
			{:then html}
				{@html html}
			{/await}
		</div>
	{/if}

	{#each dd as item}
		{#if item[1].length > 0}
			<div class="title">📦 {item[0]}</div>
			<ul class="deps">
				{#each item[1] as dep}
					<li class="dependency">
						{#if !dep.oldVersion}
							Added <a href="/{dep.name}" use:link>{dep.name}</a> {dep.newVersion}
						{:else if !dep.newVersion}
							Removed <a href="/{dep.name}" use:link>{dep.name}</a> <span class="old-version">{dep.oldVersion}</span>
						{:else}
							Updated <a href="/{dep.name}" use:link>{dep.name}</a> <span class="old-version">{dep.oldVersion}</span> ➜ {dep.newVersion}
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/each}

	{#if summary.changes.tests.addedNames.length > 0 || summary.changes.tests.removedNames.length > 0}
		<div class="title">🧪 Tests
			<span class="added-tests" class:zero="{summary.changes.tests.addedNames.length == 0}">+{summary.changes.tests.addedNames.length}</span>
			/ <span class="removed-tests" class:zero="{summary.changes.tests.removedNames.length == 0}">-{summary.changes.tests.removedNames.length}</span>
		</div>
	{/if}
</div>

<style>
	.version-summary {
		margin-bottom: 10px;
		padding-bottom: 30px;
		border-bottom: 1.5px dashed lightgray;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.version {
		font-size: 24px;
	}

	.title {
		margin-top: 25px;
		font-size: 20px;
		font-weight: 500;
	}

	.old-version {
		color: gray;
		text-decoration: line-through;
	}

	.added-tests {
		color: rgb(6, 136, 6);
	}

	.removed-tests {
		color: rgb(197, 13, 13);
	}

	.zero {
		color: inherit;
	}
</style>