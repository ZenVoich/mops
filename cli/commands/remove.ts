import fs from 'node:fs';
import {deleteSync} from 'del';
import chalk from 'chalk';
import {formatDir, formatGithubDir, checkConfigFile, readConfig, writeConfig} from '../mops.js';
import {Config, Dependency} from '../types.js';
import {checkIntegrity} from '../integrity.js';

type RemoveOptions = {
	verbose?: boolean;
	dev?: boolean;
	dryRun?: boolean;
	lock?: 'update' | 'ignore';
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function remove(name: string, {dev = false, verbose = false, dryRun = false, lock}: RemoveOptions = {}) {
	if (!checkConfigFile()) {
		return;
	}

	function getTransitiveDependencies(config: Config, exceptPkgId: string) {
		let deps = Object.values(config.dependencies || {});
		let devDeps = Object.values(config['dev-dependencies'] || {});
		return [...deps, ...devDeps]
			.filter((dep) => {
				let depId = dep.name + '@' + dep.version;
				return depId !== exceptPkgId;
			}).map((dep) => {
				return [dep, ...getTransitiveDependenciesOf(dep.name, dep.version, dep.repo)];
			}).flat();
	}

	function getTransitiveDependenciesOf(name: string, version: string | undefined, repo?: string) {
		let pkgDir = '';
		if (repo) {
			pkgDir = formatGithubDir(name, repo);
		}
		else if (version) {
			pkgDir = formatDir(name, version);
		}
		let configFile = pkgDir + '/mops.toml';
		if (!fs.existsSync(configFile)) {
			verbose && console.log('no config', configFile);
			return [];
		}
		let config = readConfig(configFile);
		let deps: Dependency[] = Object.values(config.dependencies || {}).map((dep) => {
			return [dep, ...getTransitiveDependenciesOf(dep.name, dep.version)];
		}).flat();
		return deps;
	}

	let config = readConfig();
	let deps = dev ? config['dev-dependencies'] : config.dependencies;
	deps = deps || {};
	let pkgDetails = deps[name];

	if (!pkgDetails) {
		return console.log(chalk.red('Error: ') + `No ${dev ? 'dev ' : ''}dependency to remove "${name}"`);
	}

	let version = pkgDetails.version;
	let packageId = `${name}@${version}`;

	// transitive deps ignoring deps of this package
	let transitiveDeps = getTransitiveDependencies(config, packageId);
	let transitiveDepIds = new Set(transitiveDeps.map((dep) => {
		return dep.name + '@' + dep.version;
	}));

	// transitive deps of this package (including itself)
	let transitiveDepsOfPackage = [pkgDetails, ...getTransitiveDependenciesOf(name, version)];

	// remove local cache
	for (let dep of transitiveDepsOfPackage) {
		let depId = dep.name + '@' + dep.version;
		if (transitiveDepIds.has(depId)) {
			verbose && console.log(`Ignored transitive dependency ${depId} (other deps depend on it)`);
			continue;
		}
		let pkgDir;
		if (dep.repo) {
			pkgDir = formatGithubDir(dep.name, dep.repo);
		}
		else if (dep.version) {
			pkgDir = formatDir(dep.name, dep.version);
		}
		if (pkgDir && fs.existsSync(pkgDir)) {
			dryRun || deleteSync([`${pkgDir}`], {force: true});
			verbose && console.log(`Removed local cache ${pkgDir}`);
		}
	}

	// remove from config
	if (!dev && config.dependencies) {
		delete config.dependencies[name];
	}
	if (dev && config['dev-dependencies']) {
		delete config['dev-dependencies'][name];
	}
	dryRun || writeConfig(config);

	await checkIntegrity(lock);

	console.log(chalk.green('Package removed ') + `${name} = "${version}"`);
}