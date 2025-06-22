export function getDocsCoverageColor(docsCoverage : number) {
	if (docsCoverage >= 90) {
		return 'var(--color-quality-good)';
	}
	else if (docsCoverage >= 50) {
		return 'var(--color-quality-medium)';
	}
	else {
		return 'var(--color-quality-bad)';
	}
}