import chalk from 'chalk';
import logUpdate from 'log-update';
import {checkConfigFile, readConfig} from '../mops.js';
import {install} from './install.js';

export async function installAll({verbose} = {}) {
	if (!checkConfigFile()) {
		return;
	}

	let config = readConfig();
	let deps = Object.entries(config.dependencies || {});

	for (let [pkg, ver] of deps) {
		await install(pkg, ver, verbose);
	}

	logUpdate.clear();
	console.log(chalk.green('All packages installed'));
}