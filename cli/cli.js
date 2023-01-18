#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {program} from 'commander';
import chalk from 'chalk';

import {init} from './commands/init.js';
import {publish} from './commands/publish.js';
import {importPem} from './commands/import-identity.js';
import {sources} from './commands/sources.js';
import {checkApiCompatibility, getNetwork, setNetwork, apiVersion} from './mops.js';
import {whoami} from './commands/whoami.js';
import {installAll} from './commands/install-all.js';
import {search} from './commands/search.js';
import {add} from './commands/add.js';
import {upgrade} from './commands/upgrade.js';

let cwd = process.cwd();
let configFile = path.join(cwd, 'mops.toml');

program.name('mops');

// --version
let packageJson = JSON.parse(fs.readFileSync(new URL('package.json', import.meta.url)));
program.version(`CLI ${packageJson.version}\nAPI ${apiVersion}`, '-v --version');

// init
program
	.command('init [name]')
	.description('Create mops.toml')
	.action(async (name) => {
		await init(name);
	});

// add
program
	.command('add <pkg>')
	.description('Install the package and save it to mops.toml')
	.option('--verbose')
	.action(async (pkg, options) => {
		await add(pkg, options);
	});

// install
program
	.command('install [pkg]')
	.alias('i')
	.description('Install all dependencies specified in mops.toml')
	.option('--verbose')
	.action(async (pkg, options) => {
		if (!fs.existsSync(configFile)) {
			console.log(chalk.red('Error: ') + `mops.toml not found. Please run ${chalk.green('mops init')} first`);
			return;
		}

		let compatible = await checkApiCompatibility();
		if (!compatible) {
			return;
		}

		if (pkg) {
			console.log(chalk.yellow('Consider using the \'mops add\' command to install a specific package.'));
			await add(pkg, options);
		}
		else {
			await installAll(options);
		}
	});

// publish
program
	.command('publish')
	.description('Publish package to the mops registry')
	.action(async () => {
		let compatible = await checkApiCompatibility();
		if (compatible) {
			await publish();
		}
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

// import-identity
program
	.command('import-identity <data>')
	.description('Import .pem file data to use as identity')
	.action(async (data) => {
		await importPem(data);
		whoami();
	});

// sources
program
	.command('sources')
	.description('for dfx packtool')
	.option('--verbose')
	.action(async (options) => {
		await sources(options);
	});

// whoami
program
	.command('whoami')
	.description('Print your principal')
	.action(async () => {
		whoami();
	});

// search
program
	.command('search <text>')
	.description('Search for packages')
	.action(async (text) => {
		await search(text);
	});

// search
program
	.command('upgrade')
	.description('Upgrade mops CLI to the latest version')
	.action(async () => {
		upgrade();
	});

program.parse();