#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {program} from 'commander';
import chalk from 'chalk';
import TOML from '@iarna/toml';

import {init} from './commands/init.js';
import {install} from './commands/install.js';
import {publish} from './commands/publish.js';
import {importPem} from './commands/import-pem.js';
import {packtool} from './commands/packtool.js';
import {getLastVersion, setNetwork} from './mops.js';
import {whoami} from './commands/whoami.js';
import {installAll} from './commands/install-all.js';
import logUpdate from 'log-update';

let cwd = process.cwd();
let configFile = path.join(cwd, 'mops.toml');

function wirteConfig(config) {
	fs.writeFileSync(configFile, TOML.stringify(config).trim());
}

// init
program
	.command('init')
	.description('Create mops.toml')
	.option('-p, --package <name>', '')
	.action(async (options) => {
		await init(options);
	});

// install
program
	.command('install [pkg]')
	.alias('i')
	.description('Install package and save it as a dependency in the mops.toml file')
	.action(async (pkg) => {
		let config = {};
		let exists = fs.existsSync(configFile);
		if (exists) {
			let text = fs.readFileSync(configFile).toString();
			config = TOML.parse(text);
		}
		else {
			console.log(chalk.red('Error: ') + `mops.toml not found. Please run ${chalk.green('mops init')} first`);
			return;
		}
		if (!config.deps) {
			config.deps = {};
		}

		if (!pkg) {
			installAll();
		}
		else {
			let version = await getLastVersion(pkg);
			await install(pkg, version);

			config.deps[pkg] = version;
			wirteConfig(config);
			logUpdate.clear();
			console.log(chalk.green('Package installed ') + `${pkg} = '${version}'`);
		}
	});

// publish
program
	.command('publish')
	.description('Publish package to the mops registry')
	.action(async () => {
		await publish();
	});

// set-network
program
	.command('set-network <network>')
	.description('Set network local|dev|ic')
	.action(async (network) => {
		await setNetwork(network);
	});

// import-pem
program
	.command('import-pem <data>')
	.description('Import .pem file data to use as identity')
	.action(async (data) => {
		await importPem(data);
	});

// packtool
program
	.command('packtool')
	.description('for dfx packtool')
	.action(async () => {
		await packtool();
	});

program
	.command('whoami')
	.description('prints your principal')
	.action(async () => {
		whoami();
	});

program.parse();