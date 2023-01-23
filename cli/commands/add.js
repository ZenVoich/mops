import path from 'path';
import chalk from 'chalk';
import logUpdate from 'log-update';
import {checkConfigFile, getHighestVersion, parseGithubURL, readConfig, writeConfig} from '../mops.js';
import {installFromGithub} from '../vessel.js';
import {install} from './install.js';

export async function add(name, {verbose, silent} = {}) {
	if (!checkConfigFile()) {
		return false;
	}

	let config = readConfig();
	if (!config.dependencies) {
		config.dependencies = {};
	}

	let pkgDetails;
	let existingPkg = config.dependencies[name];

	// local package
	if (name.startsWith('./') || name.startsWith('../') || name.startsWith('/')) {
		pkgDetails = {
			name: path.parse(name).name === '.' ? '_' : path.parse(name).name,
			path: name,
			repo: '',
			version: '',
		};
	}
	// github package
	else if (name.startsWith('https://github.com') || name.split('/') > 1) {
		const {org, gitName, branch} = parseGithubURL(name);

		pkgDetails = {
			name: parseGithubURL(name).gitName,
			repo: `https://github.com/${org}/${gitName}#${branch}`,
			version: '',
		};

		existingPkg = config.dependencies[pkgDetails.name];
	}
	// mops package
	else if (!existingPkg || !existingPkg.repo) {
		let ver;
		if (name.includes('@')) {
			[name, ver] = name.split('@');
		}
		else {
			let versionRes = await getHighestVersion(name);
			if (versionRes.err) {
				console.log(chalk.red('Error: ') + versionRes.err);
				return;
			}
			ver = versionRes.ok;
		}

		pkgDetails = {
			name: name,
			repo: '',
			version: ver,
		};

	}
	else {
		silent || logUpdate(`Installing ${existingPkg.name}@${existingPkg.version} (cache) from Github`);
		return;
	}

	if (pkgDetails.repo || pkgDetails.path) {
		// pkg name conflict with an installed mops pkg
		if (existingPkg && !existingPkg.repo) {
			console.log(chalk.red('Error: ') + `Conflicting Package Name '${pkgDetails.name}`);
			console.log('Consider entering the repo url and assigning a new name in the \'mops.toml\' file');
			return;
		}
		if (pkgDetails.repo) {
			await installFromGithub(pkgDetails.name, pkgDetails.repo, {verbose: verbose});
		}
	}
	else {
		let ok = await install(pkgDetails.name, pkgDetails.version, {verbose: verbose});
		if (!ok) {
			return;
		}
	}

	config.dependencies[pkgDetails.name] = pkgDetails;
	writeConfig(config);

	logUpdate.clear();
	console.log(chalk.green('Package installed ') + `${pkgDetails.name} = "${pkgDetails.repo || pkgDetails.path || pkgDetails.version}"`);
}