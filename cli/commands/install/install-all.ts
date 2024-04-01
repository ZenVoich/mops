import process from 'node:process';
import chalk from 'chalk';
import {createLogUpdate} from 'log-update';
import {checkConfigFile, readConfig} from '../../mops.js';
import {notifyInstalls} from '../../notify-installs.js';
import {checkIntegrity} from '../../integrity.js';
import {installDeps} from './install-deps.js';
import {checkRequirements} from '../../check-requirements.js';

type InstallAllOptions = {
	verbose ?: boolean;
	silent ?: boolean;
	lock ?: 'check' | 'update' | 'ignore';
	threads ?: number;
}

export async function installAll({verbose = false, silent = false, threads, lock} : InstallAllOptions = {}) {
	if (!checkConfigFile()) {
		return;
	}

	let config = readConfig();
	let deps = Object.values(config.dependencies || {});
	let devDeps = Object.values(config['dev-dependencies'] || {});
	let allDeps = [...deps, ...devDeps];

	let res = await installDeps(allDeps, {silent, verbose, threads});
	if (!res) {
		return;
	}
	let installedDeps = res;

	let logUpdate = createLogUpdate(process.stdout, {showCursor: true});

	if (!silent && lock !== 'ignore') {
		logUpdate('Checking integrity...');
	}

	await Promise.all([
		notifyInstalls(Object.keys(installedDeps)),
		checkIntegrity(lock),
	]);

	if (!silent) {
		logUpdate.clear();
		await checkRequirements();
		console.log(chalk.green('Packages installed'));
	}
}