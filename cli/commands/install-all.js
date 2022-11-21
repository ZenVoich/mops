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
	let deps = Object.entries(config.dependencies || {});

	for (let [pkg, ver] of deps) {
		if (ver.startsWith('https://github.com/')){
			const url = ver.split('#');
			const repo = url[0];
			const version = url[1];

			await installFromGithub({name: pkg, repo, version}, {verbose});
		}else{
			await install(pkg, ver, {verbose});
		}
	}

	logUpdate.clear();
	console.log(chalk.green('All packages installed'));
}