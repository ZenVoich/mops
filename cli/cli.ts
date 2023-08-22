#!/usr/bin/env node

import fs from 'node:fs';
import {program, Argument, Option} from 'commander';
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
import {test} from './commands/test/test.js';
import {template} from './commands/template.js';
import {selfUpdate} from './commands/self-update.js';
import {remove} from './commands/remove.js';
import {getUserProp, setUserProp} from './commands/user.js';
import {bump} from './commands/bump.js';
import {sync} from './commands/sync.js';
import {outdated} from './commands/outdated.js';
import {update} from './commands/update.js';
// import {docs} from './commands/docs.js';

program.name('mops');

// --version
let packageJson = JSON.parse(fs.readFileSync(new URL('package.json', import.meta.url)).toString());
program.version(`CLI ${packageJson.version}\nAPI ${apiVersion}`, '-v --version');

// init
program
	.command('init')
	.description('Initialize a new project or package in the current directory')
	.option('-y, --yes', 'Accept all defaults')
	.action(async (options) => {
		await init(options);
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
	.option('--no-test', 'Do not run tests')
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
	.description('Set network local|staging|ic')
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
	.command('cache')
	.description('Manage cache')
	.addArgument(new Argument('<sub>').choices(['size', 'clean']))
	.action(async (sub) => {
		if (sub == 'clean') {
			await cleanCache();
			console.log('Cache cleaned');
		}
		else if (sub == 'size') {
			let size = await cacheSize();
			console.log('Cache size is ' + size);
		}
	});

// test
program
	.command('test [filter]')
	.description('Run tests')
	.addOption(new Option('-r, --reporter <reporter>', 'Test reporter').choices(['verbose', 'compact', 'files', 'silent']).default('verbose'))
	.addOption(new Option('--mode <mode>', 'Test mode').choices(['interpreter', 'wasi']).default('interpreter'))
	.option('-w, --watch', 'Enable watch mode')
	.action(async (filter, options) => {
		await test(filter, options);
	});

// template
program
	.command('template')
	.description('Apply template')
	.action(async () => {
		if (!checkConfigFile()) {
			process.exit(1);
		}
		await template();
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
	.command('user')
	.addArgument(new Argument('<sub>').choices(['set', 'get']))
	.addArgument(new Argument('<prop>').choices(['name', 'site', 'email', 'github', 'twitter']))
	.addArgument(new Argument('[value]'))
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
		await bump(part);
	});

// sync
program
	.command('sync')
	.description('Add missing packages and remove unused packages')
	.action(async () => {
		await sync();
	});

// outdated
program
	.command('outdated')
	.description('Print outdated dependencies specified in mops.toml')
	.action(async () => {
		await outdated();
	});

// update
program
	.command('update [pkg]')
	.description('Update dependencies specified in mops.toml')
	.action(async (pkg) => {
		await update(pkg);
	});

program.parse();