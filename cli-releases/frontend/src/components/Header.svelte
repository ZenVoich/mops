<script lang="ts">
	import mopsSvg from '../mops.svg';
</script>

<header>
	<div class="left">
		<img src="{mopsSvg}" alt="mops logo">
		<b>CLI Releases</b>
	</div>
	<div class="right">
		<a href="https://mops.one">mops.one</a>
	</div>
</header>

<style>
	header {
		position: relative;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 14px 16px;
		box-shadow: 0 0 5px #a7a7a7;
	}

	.left {
		align-items: center;
		display: flex;
		margin-right: 1rem;
		min-width: 0;
	}

	img {
		flex: 0 0 auto;
		height: 2rem;
		margin-right: .5rem;
	}

	a {
		/* color: #7c8659; */
		color: gray;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>