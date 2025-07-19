<script lang="ts">
	import Header from './Header.svelte';
	import Token from './Token.svelte';
</script>

<div class="app">
	<Header></Header>
	<div class="content">
		<Token></Token>
	</div>
</div>

<style>
	:root {
		--color-primary: hsl(73deg 20% 44%);
		--color-primary-light: hsl(72deg 24% 55%);
		--color-secondary: rgb(213 217 208);
	}

	:global(body) {
		margin: 0;
		font-family: sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
	}

	.content {
		margin: auto;
		max-width: 900px;
		padding: 24px;
	}
</style>