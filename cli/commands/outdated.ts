import chalk from 'chalk';
import {checkConfigFile, readConfig} from '../mops.js';
import {getAvailableUpdates} from './available-updates.js';

export async function outdated() {
	if (!checkConfigFile()) {
		return;
	}
	let config = readConfig();

	let available = await getAvailableUpdates(config);

	if (available.length === 0) {
		console.log(chalk.green('All dependencies are up to date!'));
	}
	else {
		console.log('Available updates:');
		for (let dep of available) {
			console.log(`${dep[0]} ${chalk.yellow(dep[1])} -> ${chalk.green(dep[2])}`);
		}
	}
}