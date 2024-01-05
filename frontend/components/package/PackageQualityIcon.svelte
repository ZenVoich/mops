<script lang="ts">
	import {PackageSummary} from '/declarations/main/main.did.js';

	export let pkg: PackageSummary;

	let maxBasePoints = 6;
	let maxExtraPoints = 3;

	let outerCircleDashOffset = 0;
	// let innerCircleDashOffset = 0;
	let innerLineY = 0;

	$: {
		let basePoints =
			Number(pkg.quality.hasDescription)
			+ Number(pkg.quality.hasDocumentation)
			+ Number(pkg.quality.hasKeywords)
			+ Number(pkg.quality.hasLicense)
			+ Number(pkg.quality.hasRepository)
			+ Number(!('tooOld' in pkg.quality.depsStatus));
		let extraPoints = Number(pkg.quality.hasTests) + Number(pkg.quality.hasReleaseNotes) + Number('allLatest' in pkg.quality.depsStatus);

		if (basePoints !== maxBasePoints) {
			extraPoints = 0;
		}

		function convertRange(value: number, r1: [number, number], r2: [number, number]) {
			return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
		}

		outerCircleDashOffset = convertRange(maxBasePoints - basePoints, [0, maxBasePoints], [18, 100]);
		// innerCircleDashOffset = convertRange(maxExtraPoints - extraPoints, [0, maxExtraPoints], [68, 100]);
		innerLineY = convertRange(maxExtraPoints - extraPoints, [0, maxExtraPoints], [13, 27]);
	}
</script>

<svg class="quality-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
	<line class="inner-line" x1="20" y1="30" x2="20" y2={innerLineY} stroke="var(--color-primary)" stroke-width="20"></line>
	<circle class="outer-circle-bg" cx="20" cy="20" r="13" fill="none" stroke="var(--color-secondary)" stroke-width="12"></circle>
	<circle class="outer-circle" class:full={outerCircleDashOffset == 18} cx="20" cy="20" r="13" fill="none" stroke="var(--color-primary)" stroke-width="12" stroke-dasharray="100 100" stroke-dashoffset={outerCircleDashOffset}></circle>
	<!-- <circle class="inner-circle" cx="20" cy="20" r="5" fill="none" stroke="var(--color-primary)" stroke-width="10" stroke-dasharray="100 100" stroke-dashoffset={innerCircleDashOffset}></circle> -->
</svg>

<style>
	.quality-icon {
		width: 13px;
	}

	/* .outer-circle:not(.full) {
		opacity: 0.8;
	} */

	.outer-circle-bg {
		opacity: 0.7;
	}

	.outer-circle,
	.inner-circle {
		transform: rotate(-90deg);
		transform-origin: center;
	}
</style>