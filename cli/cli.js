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
import {sources} from './commands/sources.js';
import {getLastVersion, getNetwork, setNetwork} from './mops.js';
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
	.command('init [name]')
	.description('Create mops.toml')
	.action(async (name) => {
		await init(name);
	});

// install
program
	.command('install [pkg]')
	.alias('i')
	.alias('add')
	.description('Install package and save it as a dependency in the mops.toml file')
	.option('--verbose', '')
	.action(async (pkg, options) => {
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
			installAll(options);
		}
		else {
			let version = await getLastVersion(pkg);
			await install(pkg, version, options.verbose);

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
		console.log(`Selected '${network}' network`);
	});

// get-network
program
	.command('get-network')
	.description('Get network')
	.action(async () => {
		console.log(getNetwork().network);
	});

// import-pem
program
	.command('import-pem <data>')
	.description('Import .pem file data to use as identity')
	.action(async (data) => {
		await importPem(data);
	});

// sources
program
	.command('sources')
	.description('for dfx packtool')
	.option('--verbose', '')
	.action(async (options) => {
		await sources(options);
	});

// whoami
program
	.command('whoami')
	.description('prints your principal')
	.action(async () => {
		whoami();
	});

program.parse();