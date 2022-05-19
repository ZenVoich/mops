import TOML from '@iarna/toml';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

export async function init(options = {}) {
	let configFile = path.join(process.cwd(), 'mops.toml');
	let exists = fs.existsSync(configFile);
	if (exists) {
		console.log(chalk.yellow('mops.toml already exists'));
		return;
	}
	let config = {};
	if (options.package) {
		config = {
			package: {
				name: options.package,
				version: '0.1.0',
				description: '',
				repository: '',
			}
		};
	}
	// else {
	// 	config.deps = {};
	// }

	fs.writeFileSync(configFile, TOML.stringify(config).trim());

	console.log(chalk.green('mops.toml has been created'));
}