import chalk from 'chalk';
import {checkConfigFile, readConfig} from '../mops.js';
import {add} from './add.js';
import {getAvailableUpdates} from './available-updates.js';

export async function update(pkg?: string) {
	if (!checkConfigFile()) {
		return;
	}
	let config = readConfig();

	let available = await getAvailableUpdates(config, pkg);

	if (available.length === 0) {
		console.log(chalk.green('All dependencies are up to date!'));
	}
	else {
		for (let dep of available) {
			let dev = !!config['dev-dependencies']?.[dep[0]];
			await add(`${dep[0]}@${dep[2]}`, {dev});
		}
	}
}