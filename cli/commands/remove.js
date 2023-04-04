import {checkConfigFile, readConfig, writeConfig} from '../mops.js';
import fs from 'fs';
import del from 'del';
import chalk from 'chalk';
import {formatDir, formatGithubDir} from '../mops.js';

export async function remove(name, {dev, verbose, dryRun} = {}) {
	if (!checkConfigFile()) {
		return;
	}

	function getTransitiveDependencies(config, exceptPkgId) {
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

	function getTransitiveDependenciesOf(name, version, repo) {
		let pkgDir = repo ? formatGithubDir(name, repo) : formatDir(name, version);
		let configFile = pkgDir + '/mops.toml';
		if (!fs.existsSync(configFile)) {
			verbose && console.log('no config', configFile);
			return [];
		}
		let config = readConfig(configFile);
		let deps = Object.values(config.dependencies || {}).map((dep) => {
			return [dep, ...getTransitiveDependenciesOf(dep.name, dep.version)];
		}).flat();
		return deps;
	}

	let config = readConfig();
	let deps = dev ? config['dev-dependencies'] : config.dependencies;
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
		else {
			pkgDir = formatDir(dep.name, dep.version);
		}
		if (fs.existsSync(pkgDir)) {
			dryRun || del.sync([`${pkgDir}`]);
			verbose && console.log(`Removed local cache ${pkgDir}`);
		}
	}

	// remove from config
	if (dev) {
		delete config['dev-dependencies'][name];
	}
	else {
		delete config.dependencies[name];
	}
	dryRun || writeConfig(config);

	console.log(chalk.green('Package removed ') + `${name} = "${version}"`);
}