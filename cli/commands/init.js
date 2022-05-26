import TOML from '@iarna/toml';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

export async function init(name = '') {
	let configFile = path.join(process.cwd(), 'mops.toml');
	let exists = fs.existsSync(configFile);
	if (exists) {
		console.log(chalk.yellow('mops.toml already exists'));
		return;
	}
	let config = {};
	if (name) {
		config = {
			package: {
				name: name,
				version: '0.1.0',
				description: '',
				repository: '',
			}
		};
	}
	// TODO: add last version of 'base' package?
	// else {
	// 	config.dependencies = {};
	// }

	fs.writeFileSync(configFile, TOML.stringify(config).trim());

	console.log(chalk.green('mops.toml has been created'));
}