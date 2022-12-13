#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {program} from 'commander';
import chalk from 'chalk';

import {init} from './commands/init.js';
import {install} from './commands/install.js';
import {publish} from './commands/publish.js';
import {importPem} from './commands/import-identity.js';
import {sources} from './commands/sources.js';
import {checkApiCompatibility, getHighestVersion, getNetwork, parseGithubURL, readConfig, setNetwork, writeConfig} from './mops.js';
import {whoami} from './commands/whoami.js';
import {installAll} from './commands/install-all.js';
import logUpdate from 'log-update';
import {installFromGithub} from './vessel.js';

let cwd = process.cwd();
let configFile = path.join(cwd, 'mops.toml');

program.name('mops');

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
			config = readConfig(configFile);
		}
		else {
			console.log(chalk.red('Error: ') + `mops.toml not found. Please run ${chalk.green('mops init')} first`);
			return;
		}
		if (!config.dependencies) {
			config.dependencies = {};
		}

		let compatible = await checkApiCompatibility();
		if (!compatible) {
			return;
		}

		if (!pkg) {
			installAll(options);
			return;
		}

		let pkgDetails;
		let existingPkg = config.dependencies[pkg];

		if (pkg.startsWith('https://github.com') || pkg.split('/') > 1) {
			const {org, gitName, branch} = parseGithubURL(pkg);

			pkgDetails = {
				name: parseGithubURL(pkg).gitName,
				repo: `https://github.com/${org}/${gitName}#${branch}`,
				version: ''
			};

			existingPkg = config.dependencies[pkgDetails.name];

		}
		else if (!existingPkg || !existingPkg.repo) {
			let versionRes = await getHighestVersion(pkg);
			if (versionRes.err) {
				console.log(chalk.red('Error: ') + versionRes.err);
				return;
			}

			pkgDetails = {
				name: pkg,
				repo: '',
				version:  versionRes.ok
			};

		}
		else {
			options.silent || logUpdate(`Installing ${existingPkg.name}@${existingPkg.version} (cache) from Github`);
			return;
		}

		const {name, repo, version} = pkgDetails;

		if (repo) {
			// pkg name conflict with an installed mops pkg
			if (existingPkg && !existingPkg.repo) {
				console.log(chalk.red('Error: ') + `Conflicting Package Name '${name}`);
				console.log('Consider entering the repo url and assigning a new name in the \'mops.toml\' file');
				return;
			}

			await installFromGithub(name, repo, {verbose: options.verbose});
		}
		else {
			await install(name, version, {verbose: options.verbose});
		}

		config.dependencies[name] = pkgDetails;
		writeConfig(config);

		logUpdate.clear();
		console.log(
			chalk.green('Package installed ') + `${name} = "${repo || version}"`
		);
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