<script lang="ts">
	import Header from './Header.svelte';
</script>

<div class="main">
	<Header></Header>
	<div class="content">main</div>
</div>

<style>
	.main {
		display: flex;
		flex-direction: column;
		/* background: hsl(229deg, 17%, 29%); */
	}

	.content {
		font-weight: 500;
		font-size: 30px;
		color: #dfdfdf;
		text-align: center;
	}
</style>