import fs from 'fs';
import path from 'path';

interface OwnerPoints {
	[principal : string] : number;
}

interface YamlEntry {
	principal : string;
	tokens : number;
	memo : number;
	vestingPeriod : number;
}

function generateAirdropYaml() {
	// Read points.json
	let ownerPointsPath = path.join(__dirname, 'points.json');
	let ownerPointsData : OwnerPoints = JSON.parse(fs.readFileSync(ownerPointsPath, 'utf8'));

	// Calculate total points
	let totalPoints = Object.values(ownerPointsData).reduce((sum, points) => sum + points, 0);
	console.log(`Total points: ${totalPoints}`);

	// Max total tokens
	let maxTotalTokens = 5_000_000;

	// Generate entries with initial token allocation
	let entries : YamlEntry[] = [];
	let memoCounter = 10;
	let totalDistributed = 0;

	// Create 3 entries for each principal (0, 3, 6 months vesting)
	// SNS limits dev neuron count to 100, so we have to reduce the number of entries
	let vestingPeriods = [5];

	for (let [principal, points] of Object.entries(ownerPointsData)) {
		// Calculate tokens for this principal
		let totalTokensForPrincipal = Math.floor((points / totalPoints) * maxTotalTokens);

		// Divide tokens equally among vesting periods
		let tokensPerVesting = Math.floor(totalTokensForPrincipal / vestingPeriods.length);
		let remainder = totalTokensForPrincipal % vestingPeriods.length;

		for (let i = 0; i < vestingPeriods.length; i++) {
			let vestingPeriod = vestingPeriods[i];
			let tokens = tokensPerVesting;

			// Distribute remainder to first entries
			if (i < remainder) {
				tokens += 1;
			}

			if (tokens > 0) {
				entries.push({
					principal,
					tokens,
					memo: memoCounter,
					vestingPeriod,
				});
				totalDistributed += tokens;
				memoCounter++;
			}
		}
	}

	// Calculate and distribute remaining tokens
	let remainingTokens = maxTotalTokens - totalDistributed;
	console.log(`Total distributed before remainder: ${totalDistributed}`);
	console.log(`Remaining tokens to distribute: ${remainingTokens}`);

	for (let i = 0; i < entries.length && remainingTokens > 0; i++) {
		entries[i].tokens += 1;
		remainingTokens--;
	}

	// Generate YAML entries
	let yamlEntries : string[] = [];
	for (let entry of entries) {
		yamlEntries.push(
			`        - principal: ${entry.principal}\n` +
			`          stake: ${entry.tokens} tokens\n` +
			`          memo: ${entry.memo}\n` +
			'          dissolve_delay: 0 month\n' +
			`          vesting_period: ${entry.vestingPeriod} month`
		);
	}

	// Create the full YAML content
	let yamlContent = yamlEntries.join('\n');

	// Write to file
	let outputPath = path.join(__dirname, 'airdrop.yaml');
	fs.writeFileSync(outputPath, yamlContent);

	console.log(`Generated airdrop YAML with ${yamlEntries.length} entries`);
	console.log(`Total tokens distributed: ${entries.reduce((sum, entry) => sum + entry.tokens, 0)}`);
}

generateAirdropYaml();
