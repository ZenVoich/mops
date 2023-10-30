<script lang="ts">
	import {PackageSummary} from '/declarations/main/main.did.js';

	export let pkg: PackageSummary;
</script>

<div class="quality-icon">
	<div class="dot"></div>
	<div class="dot"></div>
	<div class="dot"></div>
	<div class="dot"></div>
	<div class="dot"></div>
	<div class="dot"></div>
	<div class="dot"></div>
	<div class="dot"></div>
</div>

<style>
	.quality-icon {
		display: grid;
		grid-auto-flow: dense;
		gap: 1px;
	}

	.dot {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background-color: black;
	}

	.dot:nth-child(2) { grid-column: 1; }
	.dot:nth-child(4) { grid-column: 2; }
	.dot:nth-child(6) { grid-column: 3; }
	.dot:nth-child(8) { grid-column: 4; }
</style>