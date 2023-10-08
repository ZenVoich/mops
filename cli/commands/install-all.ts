import chalk from 'chalk';
import logUpdate from 'log-update';
import {checkConfigFile, readConfig} from '../mops.js';
import {install} from './install.js';
import {installFromGithub} from '../vessel.js';
import {notifyInstalls} from '../notify-installs.js';

export async function installAll({verbose = false, silent = false} = {}) {
	if (!checkConfigFile()) {
		return;
	}

	let config = readConfig();
	let deps = Object.values(config.dependencies || {});
	let devDeps = Object.values(config['dev-dependencies'] || {});
	let allDeps = [...deps, ...devDeps];
	let installedPackages = {};

	for (let {name, repo, path, version} of allDeps) {
		if (repo) {
			await installFromGithub(name, repo, {verbose, silent});
		}
		else if (!path) {
			let res = await install(name, version, {verbose, silent});
			if (res === false) {
				return;
			}
			installedPackages = {...installedPackages, ...res};
		}
	}

	await notifyInstalls(Object.keys(installedPackages));

	if (!silent) {
		logUpdate.clear();
		console.log(chalk.green('All packages installed'));
	}
}