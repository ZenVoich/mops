import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import {install} from './install.js';
import {getHighestVersion, readConfig} from '../mops.js';

function rootDir(cwd = process.cwd()) {
	let configFile = path.join(cwd, 'mops.toml');
	if (fs.existsSync(configFile)) {
		return cwd;
	}
	if (!path.basename(cwd)) {
		console.log(chalk.red('Error: ') + 'Cannot find mops.toml');
		return;
	}
	return rootDir(path.join(cwd, '..'));
}

// TODO: resolve deps for a specific file to avoid conflicts
// TODO: remove base-unofficial
export async function sources({verbose} = {}) {
	let root = rootDir();
	if (!root) {
		return;
	}

	let packages = {};
	let versions = {};

	let compareVersions = (a, b) => {
		let ap = a.split('.').map(x => x |0);
		let bp = b.split('.').map(x => x |0);
		if (ap[0] - bp[0]) {
			return Math.sign(ap[0] - bp[0]);
		}
		if (ap[0] === bp[0] && ap[1] - bp[1]) {
			return Math.sign(ap[1] - bp[1]);
		}
		if (ap[0] === bp[0] && ap[1] === bp[1] && ap[2] - bp[2]) {
			return Math.sign(ap[2] - bp[2]);
		}
		return 0;
	};

	let collectDeps = (config, isRoot = false) => {
		for (let [dep, ver] of Object.entries(config.dependencies || {})) {
			// take root dep ver or bigger one
			if (isRoot || !packages[dep] || compareVersions(packages[dep], ver) === -1) {
				packages[dep] = ver;
			}

			let config = readConfig(path.join(root, `.mops/${dep}@${ver}/mops.toml`));
			collectDeps(config);

			if (!versions[dep]) {
				versions[dep] = [];
			}
			versions[dep].push(ver);
		}
	};

	let config = readConfig(path.join(root, 'mops.toml'));
	collectDeps(config, true);

	// install base-unofficial
	if (!packages['base-unofficial']) {
		let dirs = fs.readdirSync(path.join(root, '.mops'));
		let downloadedPackages = Object.fromEntries(dirs.map((dir) => {
			return dir.split('@');
		}));

		if (downloadedPackages['base-unofficial']) {
			packages['base-unofficial'] = downloadedPackages['base-unofficial'];
		}
		else {
			let version = await getHighestVersion('base-unofficial');
			await install('base-unofficial', version, {silent: true, dep: true});
			packages['base-unofficial'] = version;
		}
	}

	// show conflicts
	if (verbose) {
		for (let [dep, vers] of Object.entries(versions)) {
			if (vers.length > 1) {
				console.log(chalk.yellow('WARN:'), `Conflicting package versions "${dep}" - ${vers.join(', ')}`);
			}
		}
	}

	// sources
	for (let [name, ver] of Object.entries(packages)) {
		let pkgDir = path.relative(process.cwd(), path.join(root, `.mops/${name}@${ver}`));
		console.log(`--package ${name} ${pkgDir}`);

		// fallback base to base-unofficial
		if (name == 'base-unofficial' && !packages.base) {
			console.log(`--package base ${pkgDir}`);
		}
	}
}