<script lang="ts">
	import {push} from 'svelte-spa-router';
	import Header from './Header.svelte';

	function installDocs() {
		push('/docs/install')
	}

	function publishDocs() {
		push('/docs/publish')
	}
</script>

<div class="main">
	<Header></Header>

	<div class="content">


		<div class="getting-started">
			<div class="title">Getting Started</div>
			<div class="buttons">
				<div class="button" on:click="{installDocs}">Install Package</div>
				<div class="button" on:click="{publishDocs}">Publish Package</div>
			</div>
		</div>

		<!-- <div class="delimiter"></div>
		<div class="motoko">
			<div class="text">
				<img src="/img/mops.svg" style="width: 100px;">
				<div class="description"><b>MOPS</b> is a Motoko package manager with totally on-chain package registry.</div>
			</div>
		</div> -->

		<div class="delimiter"></div>

		<div class="motoko">
			<img src="/img/motoko.svg" alt="">
			<div class="text">
				<div class="title">Built for Motoko</div>
				<div class="description">The Motoko programming language is a new, modern and type safe language for developers who want to build the next generation of distributed applications to run on the <a href="https://hwvjt-wqaaa-aaaam-qadra-cai.raw.ic0.app/">Internet Computer</a> blockchain network.</div>
			</div>
		</div>
	</div>
</div>

<style>
	.main {
		display: flex;
		flex-direction: column;
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.content > * {
		max-width: 900px;
	}

	.delimiter {
		width: 50%;
		height: 12px;
		background: whitesmoke;
		margin: 30px 0;
		border-radius: 50%;
	}

	/* getting started */
	.getting-started {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 50px;
		gap: 30px;
	}

	.getting-started .title {
		font-weight: 500;
		font-size: 30px;
	}
	.getting-started .buttons {
		display: flex;
		gap: 40px;
	}

	.getting-started .button {
		padding: 14px 18px;
		background: var(--color-primary);
		color: white;
		cursor: pointer;
		border-radius: 40px;
		box-shadow: -1px 2px 4px #555;
		font-size: 18px;
		font-weight: 500;
		user-select: none;
	}

	.getting-started .button:active {
		box-shadow: -1px 1px 2px #555;
	}

	.motoko {
		display: flex;
		align-items: center;
		gap: 50px;
	}

	.motoko img {
		width: 300px;
	}

	.motoko .title {
		margin-bottom: 30px;
		font-weight: 500;
		font-size: 30px;
	}

	.motoko .description {
		font-size: 18px;
	}
</style>