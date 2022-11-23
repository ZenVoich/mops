import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import {checkApiCompatibility, mainActor, readDfxJson, writeConfig} from '../mops.js';
import {installAll} from './install-all.js';
import { readVesselConfig } from '../vessel.js';

export async function init(name = '') {
	let configFile = path.join(process.cwd(), 'mops.toml');
	let exists = fs.existsSync(configFile);
	if (exists) {
		console.log(chalk.yellow('mops.toml already exists'));
		return;
	}

	console.log('Initializing...');

	let config = {};
	let vesselConfig = {};

	const vesselFilePath = path.join(process.cwd(), 'vessel.dhall');

	if (fs.existsSync(vesselFilePath)){
		console.log('Reading vessel.dhall file');
		vesselConfig = await readVesselConfig()|| {};
	}

	if (vesselConfig.dependencies){
		config.dependencies = {};

		for (const dep of (vesselConfig.dependencies || [])){
			config.dependencies[dep.name] = dep;
		}
	}

	// lib mode
	if (name) {
		config.package = {
			name,
			version: '0.1.0',
			description: '',
			repository: '',
			moc: vesselConfig.compiler || ''
		};

		writeConfig(config);

		if (Object.keys(config.dependencies).length)
			await installAll({verbose: true});
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

		if (!config.dependencies)
			config.dependencies = {};

		defaultPackages.forEach(([name, version]) => {
			config.dependencies[name] =  version;
		});

		writeConfig(config);

		await installAll({verbose: true});
	}

	console.log(chalk.green('mops.toml has been created'));
}