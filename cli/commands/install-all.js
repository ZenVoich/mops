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

	for (let {name, repo, path, version} of deps) {
		if (repo) {
			await installFromGithub(name, repo, {verbose});
		}
		else if (!path) {
			let ok = await install(name, version, {verbose});
			if (!ok) {
				return;
			}
		}
	}

	logUpdate.clear();
	console.log(chalk.green('All packages installed'));
}