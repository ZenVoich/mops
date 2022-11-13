import TOML from '@iarna/toml';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import {checkApiCompatibility, mainActor, readDfxJson} from '../mops.js';
import {installAll} from './install-all.js';

export async function init(name = '') {
	let configFile = path.join(process.cwd(), 'mops.toml');
	let exists = fs.existsSync(configFile);
	if (exists) {
		console.log(chalk.yellow('mops.toml already exists'));
		return;
	}

	console.log('Initializing...');

	let config = {};

	// lib mode
	if (name) {
		config = {
			package: {
				name: name,
				version: '0.1.0',
				description: '',
				repository: '',
			}
		};
		fs.writeFileSync(configFile, TOML.stringify(config).trim());
	}

	// project mode
	if (!name) {
		let compatible = await checkApiCompatibility();
		if (!compatible) {
			return;
		}

		let dfxJson = readDfxJson();
		let dfxVersion = dfxJson?.dfx || '';

		let actor = await mainActor();
		let defaultPackages = await actor.getDefaultPackages(dfxVersion);

		defaultPackages.forEach(([name, version]) => {
			config.dependencies = {
				...config.dependencies,
				[name]: version,
			};
		});

		fs.writeFileSync(configFile, TOML.stringify(config).trim());
		await installAll({verbose: true});
	}

	console.log(chalk.green('mops.toml has been created'));
}