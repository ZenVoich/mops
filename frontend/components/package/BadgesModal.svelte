<script lang="ts">
	import Modal from '../Modal.svelte';

	export let packageName: string;
	export let active = false;
</script>

<Modal bind:active="{active}" size="medium" title="Package Badges" popup={true}>
	<div class="row">
		<code class="code">
			[![documentation](http://localhost:4943/badge/documentation/{packageName}?canisterId=2d2zu-vaaaa-aaaak-qb6pq-cai)]
		</code>
		<div class="preview">
			<img src="http://localhost:4943/badge/documentation/{packageName}?canisterId=2d2zu-vaaaa-aaaak-qb6pq-cai">
		</div>
	</div>
</Modal>

<style>
	.row {
		display: flex;
		gap: 10px;
	}

	.row > * {
		flex-grow: 1;
	}

	.code {
		padding: 10px;
		flex-basis: 50%;
	}

	.preview {
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>