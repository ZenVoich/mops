import chalk from 'chalk';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {createLogUpdate} from 'log-update';
import {checkConfigFile, readConfig} from '../mops.js';
import {install} from './install.js';
import {installFromGithub} from '../vessel.js';
import {notifyInstalls} from '../notify-installs.js';
import {checkIntegrity} from '../integrity.js';
import {installLocal} from './install-local.js';

type InstallAllOptions = {
	verbose?: boolean;
	silent?: boolean;
	lock?: 'check' | 'update' | 'ignore';
}

export async function installAll({verbose = false, silent = false, lock}: InstallAllOptions = {}) {
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
		else {
			let res = await (path ? installLocal(name, path, {silent, verbose}) : install(name, version, {silent, verbose}));
			if (res === false) {
				return;
			}
			installedPackages = {...installedPackages, ...res};
		}
	}

	let logUpdate = createLogUpdate(process.stdout, {showCursor: true});

	if (!silent && lock !== 'ignore') {
		logUpdate('Checking integrity...');
	}

	await Promise.all([
		notifyInstalls(Object.keys(installedPackages)),
		checkIntegrity(lock),
	]);

	if (!silent) {
		logUpdate.clear();
		console.log(chalk.green('Packages installed'));
	}
}