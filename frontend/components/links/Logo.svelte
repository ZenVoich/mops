<script lang="ts">
	import {link} from 'svelte-spa-history-router';

	export let size: 'small' | 'big' = 'big';
</script>

<a href="/" use:link>
	<img class="logo" src="/img/mops-motoko.svg" alt="mops" class:small={size === 'small'} loading="lazy">
</a>

<style>
	.logo {
		width: 75px;
		height: 75px;
		margin: -10px 0;
		cursor: pointer;
		user-select: none;
		-webkit-user-drag: none;
	}

	.small {
		width: 35px;
		height: 35px;
	}
</style>