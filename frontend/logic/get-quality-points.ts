import {PackageQuality} from '/declarations/main/main.did';

export let getQualityPoints = (quality : PackageQuality) => {
	let maxBasePoints = 6;

	let basePoints =
		Number(quality.hasDescription)
		+ Number(quality.hasDocumentation)
		+ Number(quality.hasKeywords)
		+ Number(quality.hasLicense)
		+ Number(quality.hasRepository)
		+ Number(!('tooOld' in quality.depsStatus));
	let extraPoints = Number(quality.hasTests) + Number(quality.hasReleaseNotes) + Number('allLatest' in quality.depsStatus);

	if (basePoints !== maxBasePoints) {
		extraPoints = 0;
	}

	return {
		base: basePoints,
		extra: extraPoints,
		total: basePoints + extraPoints,
	};
};