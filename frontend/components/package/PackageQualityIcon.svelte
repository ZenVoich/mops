<script lang="ts">
	import {PackageSummary} from '/declarations/main/main.did.js';

	export let pkg: PackageSummary;

	let maxBasePoints = 7;
	let maxExtraPoints = 2;

	let basePoints = Number(pkg.quality.hasDescription) + Number(pkg.quality.hasDocumentation) + Number(pkg.quality.hasKeywords) + Number(pkg.quality.hasLicense) + Number(pkg.quality.hasRepository);
	let extraPoints = Number(pkg.quality.hasTests) + Number(pkg.quality.hasReleaseNotes);

	if ('allLatest' in pkg.quality.depsStatus) {
		basePoints += 2;
	}
	else if ('updatesAvailable' in pkg.quality.depsStatus) {
		basePoints += 1;
	}

	if (basePoints !== maxBasePoints) {
		extraPoints = 0;
	}
	extraPoints = 0; // disable extra points for now

	function convertRange(value: number, r1: [number, number], r2: [number, number]) {
		return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
	}

	let outerCircleDashOffset = convertRange(maxBasePoints - basePoints, [0, maxBasePoints], [18, 100]);
	let innerCircleDashOffset = convertRange(2 - extraPoints, [0, maxExtraPoints], [68, 100]);
</script>

<svg class="quality-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
	<circle class="outer-circle-bg" cx="20" cy="20" r="13" fill="none" stroke="var(--color-secondary)" stroke-width="12"></circle>
	<circle class="outer-circle" cx="20" cy="20" r="13" fill="none" stroke="var(--color-primary)" stroke-width="12" stroke-dasharray="100 100" stroke-dashoffset="{outerCircleDashOffset}"></circle>
	<circle class="inner-circle" cx="20" cy="20" r="5" fill="none" stroke="var(--color-primary)" stroke-width="10" stroke-dasharray="100 100" stroke-dashoffset="{innerCircleDashOffset}"></circle>
</svg>

<style>
	.quality-icon {
		width: 15px;
	}

	.outer-circle-bg {
		opacity: 0.7;
	}
</style>