<script lang="ts">
	import Logo from "./links/Logo.svelte";
	import GitHub from "./links/GitHub.svelte";
</script>

<footer>
	<Logo size="small" />
	<GitHub />
</footer>

<style>
	footer {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 10px;

		padding: 20px 0 15px;
		border-top: 1px solid whitesmoke;
	}
</style>