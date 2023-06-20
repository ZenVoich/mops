#!/usr/bin/env node

import fs from 'fs';
import {program} from 'commander';
import chalk from 'chalk';
import {Principal} from '@dfinity/principal';

import {init} from './commands/init.js';
import {publish} from './commands/publish.js';
import {importPem} from './commands/import-identity.js';
import {sources} from './commands/sources.js';
import {checkApiCompatibility, getNetwork, setNetwork, apiVersion, checkConfigFile, mainActor} from './mops.js';
import {whoami} from './commands/whoami.js';
import {installAll} from './commands/install-all.js';
import {search} from './commands/search.js';
import {add} from './commands/add.js';
import {cacheSize, cleanCache} from './cache.js';
import {test} from './commands/test.js';
import {template} from './commands/template.js';
import {selfUpdate} from './commands/self-update.js';
import {remove} from './commands/remove.js';
import {getUserProp, setUserProp} from './commands/user.js';
import {bump} from './commands/bump.js';
// import {docs} from './commands/docs.js';

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
		if (!checkConfigFile()) {
			process.exit(1);
		}
		await add(pkg, options);
	});

// remove
program
	.command('remove <pkg>')
	.alias('rm')
	.description('Remove package and update mops.toml')
	.option('--dev', 'Remove from dev-dependencies instead of dependencies')
	.option('--verbose', 'Show more information')
	.option('--dry-run', 'Do not actually remove anything')
	.action(async (pkg, options) => {
		if (!checkConfigFile()) {
			process.exit(1);
		}
		await remove(pkg, options);
	});

// install
program
	.command('install [pkg]')
	.alias('i')
	.description('Install all dependencies specified in mops.toml')
	.option('--verbose')
	.action(async (pkg, options) => {
		if (!checkConfigFile()) {
			process.exit(1);
		}

		let compatible = await checkApiCompatibility();
		if (!compatible) {
			return;
		}

		if (pkg) {
			// @deprecated
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
	.option('--no-docs', 'Do not generate docs')
	.action(async (options) => {
		if (!checkConfigFile()) {
			process.exit(1);
		}
		let compatible = await checkApiCompatibility();
		if (compatible) {
			await publish(options);
		}
	});

// set-network
program
	.command('set-network <network>')
	.alias('sn')
	.description('Set network local|dev|ic')
	.action(async (network) => {
		await setNetwork(network);
		console.log(`Selected '${network}' network`);
	});

// get-network
program
	.command('get-network')
	.alias('gn')
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
		await whoami();
	});

// sources
program
	.command('sources')
	.description('for dfx packtool')
	.option('--verbose')
	.action(async (options) => {
		if (!checkConfigFile()) {
			process.exit(1);
		}
		await installAll({silent: true});
		let sourcesArr = await sources(options);
		console.log(sourcesArr.join('\n'));
	});

// whoami
program
	.command('whoami')
	.description('Print your principal')
	.action(async () => {
		await whoami();
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
		if (!checkConfigFile()) {
			process.exit(1);
		}
		await template(options);
	});

// docs
// program
// 	.command('docs')
// 	.description('Generate documentation (experimental)')
// 	.action(async () => {
// 		if (!checkConfigFile()) {
// 			process.exit(1);
// 		}
// 		await docs();
// 	});

// self update
program
	.command('self-update')
	.description('Update mops CLI to the latest version')
	.option('--detached')
	.option('--force')
	.action(async (options) => {
		if (options.force) {
			selfUpdate(options);
		}
		else {
			console.log('Please run \'npm i -g ic-mops\'');
		}
	});

// user
program
	.command('user set|get <prop> [value]')
	.description('User settings')
	.action(async (sub, prop, value) => {
		if (sub == 'get') {
			await getUserProp(prop);
		}
		else if (sub == 'set') {
			if (!value) {
				console.log('error: missing required argument "value"');
				return;
			}
			await setUserProp(prop, value);
		}
		else {
			console.log('Unknown sub command. Available sub commands: set, get');
		}
	});

// airdrop
program
	.command('airdrop <check|claim> [canister]')
	.action(async (sub, canister) => {
		let main = await mainActor(true);
		if (sub === 'check') {
			let amount = await main.getAirdropAmount();
			if (amount === 0n) {
				console.log('No airdrop available');
				return;
			}
			console.log(`You can claim ${Number(amount) / 1_000_000_000_000} TCycles`);
		}
		else if (sub === 'claim') {
			let principal;
			try {
				principal = Principal.fromText(canister);
			}
			catch (err) {
				console.log('Invalid canister id');
				console.log(err);
				return;
			}
			console.log('Sending cycles to the canister ' + canister);
			let res = await main.claimAirdrop(principal);
			console.log(res);
		}
		else {
			console.log('Unknown sub command. Available sub commands: check, claim');
		}
	});

// bump
program
	.command('bump [major|minor|patch]')
	.description('Bump current package version')
	.action(async (part) => {
		bump(part);
	});

program.parse();