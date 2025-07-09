export let formatNumber = (n: number | bigint, decimals: number = 0): string => {
	return Number(n).toLocaleString('en-US', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals || 0,
	}).replaceAll(',', "'");
};