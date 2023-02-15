import chalk from 'chalk';
import logUpdate from 'log-update';
import {checkConfigFile, readConfig} from '../mops.js';
import {install} from './install.js';
import {installFromGithub} from '../vessel.js';

export async function installAll({verbose, silent} = {}) {
	if (!checkConfigFile()) {
		return;
	}

	let config = readConfig();
	let deps = Object.values(config.dependencies || {});
	let devDeps = Object.values(config['dev-dependencies'] || {});
	let allDeps = [...deps, ...devDeps];

	for (let {name, repo, path, version} of allDeps) {
		if (repo) {
			await installFromGithub(name, repo, {verbose, silent});
		}
		else if (!path) {
			let ok = await install(name, version, {verbose, silent});
			if (!ok) {
				return;
			}
		}
	}

	if (!silent) {
		logUpdate.clear();
		console.log(chalk.green('All packages installed'));
	}
}