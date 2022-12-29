import chalk from 'chalk';
import logUpdate from 'log-update';
import {getHighestVersion, parseGithubURL, readConfig, writeConfig} from '../mops.js';
import {installFromGithub} from '../vessel.js';
import {install} from './install.js';

export async function add(pkg, {verbose, silent} = {}) {
	let config = readConfig();
	if (!config.dependencies) {
		config.dependencies = {};
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
		let ver;
		if (pkg.includes('@')) {
			[pkg, ver] = pkg.split('@');
		}
		else {
			let versionRes = await getHighestVersion(pkg);
			if (versionRes.err) {
				console.log(chalk.red('Error: ') + versionRes.err);
				return;
			}
			ver = versionRes.ok;
		}

		pkgDetails = {
			name: pkg,
			repo: '',
			version: ver,
		};

	}
	else {
		silent || logUpdate(`Installing ${existingPkg.name}@${existingPkg.version} (cache) from Github`);
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

		await installFromGithub(name, repo, {verbose: verbose});
	}
	else {
		let ok = await install(name, version, {verbose: verbose});
		if (!ok) {
			return;
		}
	}

	config.dependencies[name] = pkgDetails;
	writeConfig(config);

	logUpdate.clear();
	console.log(chalk.green('Package installed ') + `${name} = "${repo || version}"`);
}