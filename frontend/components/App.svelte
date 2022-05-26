<script lang="ts">
	import Home from './Home.svelte';
	import Router from 'svelte-spa-router';
	import SearchResults from './SearchResults.svelte';
	import Package from './Package.svelte';
	import InstallDoc from './docs/InstallDoc.svelte';
	import PublishDoc from './docs/PublishDoc.svelte';

	let routes = {
		'/': Home,
		'/search/:search': SearchResults,
		'/package/:package': Package,
		'/docs/install': InstallDoc,
		'/docs/publish': PublishDoc,
	};
</script>

<div class="app">
	<Router {routes}/>
</div>

<style global>
	:root {
		--color-primary: hsl(73deg 20% 44%);
		--color-primary-light: hsl(72deg 24% 55%);
	}

	body {
		margin: 0;
		font-family: sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
	}

	button {
		font-weight: 600;
	}

	button:not(:disabled) {
		cursor: pointer;
	}

	.app {
		/* display: flex;
		flex-direction: column;
		width: 100vw;
		height: 100vh; */
	}

	.app-loader {
		height: 100vh;
		width: 100vw;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.app-content {
		flex-grow: 1;
		overflow: auto;
	}

	[hidden] {
		display: none !important;
	}

	a {
		color: #7c8659;
		font-weight: 500;
		text-decoration: none;
	}

	input, button, select, textarea {
		font-family: inherit;
		font-size: inherit;
		padding: 0.4em;
		/* margin: 0 0 0.5em 0; */
		box-sizing: border-box;
		border: 1px solid #ccc;
		border-radius: 2px;
	}

	input:disabled {
		color: #ccc;
	}

	button {
		color: #333;
		background-color: #f4f4f4;
		outline: none;
	}

	button:disabled {
		color: #999;
	}

	button:not(:disabled):active {
		background-color: #ddd;
	}

	select:focus:not(:focus-visible) {
		outline: none;
	}

	button:focus-visible {
		border-color: #666;
	}
</style>