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
import {cacheSize, cleanCache} from './cache.js';
import {test} from './commands/test.js';
import {template} from './commands/template.js';
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
	.option('--dev')
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
		await installAll({silent: true});
		let sourcesArr = await sources(options);
		console.log(sourcesArr.join('\n'));
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

// cache
program
	.command('cache [sub-command]')
	.description('Manage cache')
	.action(async (sub) => {
		if (sub == 'clean') {
			await cleanCache();
			console.log('Cache cleaned');
		}
		else if (sub == 'size') {
			let size = await cacheSize();
			console.log('Cache size is ' + size);
		}
		else {
			console.log('Unknown sub command. Available sub commands: clean, size');
		}
	});

// test
program
	.command('test [filter]')
	.description('Run tests')
	.option('--watch', 'Enable watch mode')
	.action(async (filter, options) => {
		await test(filter, options);
	});

// template
program
	.command('template')
	.description('Apply template')
	.action(async (options) => {
		await template(options);
	});

// upgrade
program
	.command('self-update')
	.description('Upgrade mops CLI to the latest version')
	.option('--detached')
	.action(async (options) => {
		upgrade(options);
	});

program.parse();