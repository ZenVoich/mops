import chalk from 'chalk';
import logUpdate from 'log-update';
import {checkConfigFile, readConfig} from '../mops.js';
import {install} from './install.js';
import {installFromGithub} from '../vessel.js';

export async function installAll({verbose} = {}) {
	if (!checkConfigFile()) {
		return;
	}

	let config = readConfig();
	const deps = Object.values(config.dependencies || {});

	for (let {name, repo, version} of deps) {
		if (repo) {
			await installFromGithub(name, repo, {verbose});
		}
		else {
			await install(name, version, {verbose});
		}
	}

	logUpdate.clear();
	console.log(chalk.green('All packages installed'));
}