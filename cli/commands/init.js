import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import {checkApiCompatibility, mainActor, readDfxJson, writeConfig} from '../mops.js';
import {installAll} from './install-all.js';
import {readVesselConfig} from '../vessel.js';
import {execSync} from 'child_process';

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
	let vesselDeps;

	const vesselFile = path.join(process.cwd(), 'vessel.dhall');

	if (fs.existsSync(vesselFile)) {
		console.log('Reading vessel.dhall file');
		const res = await readVesselConfig(process.cwd(), {cache: false});
		vesselConfig = {...res};
	}

	if (vesselConfig.dependencies) {
		vesselDeps = {};

		for (const dep of (vesselConfig.dependencies || [])) {
			vesselDeps[dep.name] = dep;
		}
	}

	// lib mode
	if (name) {
		config.package = {
			name,
			version: '0.1.0',
			description: '',
			repository: '',
		};

		if (vesselDeps) {
			config.dependencies = vesselDeps;
		}

		writeConfig(config, configFile);

		if (Object.keys(config.dependencies || {}).length) {
			await installAll({verbose: true});
		}
	}

	// project mode
	if (!name) {
		let compatible = await checkApiCompatibility();
		if (!compatible) {
			return;
		}

		let dfxJson = readDfxJson();
		let dfxVersion = dfxJson?.dfx || '';
		if (!dfxVersion) {
			try {
				let res = execSync('dfx --version').toString();
				let match = res.match(/\d+\.\d+\.\d+/);
				if (match) {
					dfxVersion = match[0];
				}
			}
			catch {}
		}

		let actor = await mainActor();
		let defaultPackages = await actor.getDefaultPackages(dfxVersion);

		if (!config.dependencies) {
			config.dependencies = {};
		}

		if (vesselDeps) {
			config.dependencies = vesselDeps;
		}

		defaultPackages.forEach(([name, version]) => {
			config.dependencies[name] = {version};
		});

		writeConfig(config, configFile);

		await installAll({verbose: true});
	}

	console.log(chalk.green('mops.toml has been created'));
}