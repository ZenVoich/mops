import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import {install} from './install.js';
import {formatDir, formatGithubDir, getHighestVersion, parseGithubURL, readConfig} from '../mops.js';
import { readVesselConfig } from '../vessel.js';

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

	const gitVerRegex = new RegExp(/v(\d{1,2}\.\d{1,2}\.\d{1,2})(-.*)?$/);

	const compareGitVersions = (repoA, repoB) => {
		const {branch: a} = parseGithubURL(repoA);
		const {branch: b} = parseGithubURL(repoB);

		if (gitVerRegex.test(a) && gitVerRegex.test(b)){
			return compareVersions(a.substring(1) , b.substring(1));
		}else if (!gitVerRegex.test(a)){
			return -1;
		}else{
			return 1;
		}
	};

	let collectDeps = async (config, isRoot = false) => {
		for (const pkgDetails of Object.values(config.dependencies || {})) {
			const {name, repo, version} = pkgDetails;

			// take root dep version or bigger one
			if (
				isRoot ||
				!packages[name] ||
				repo && compareGitVersions(packages[name].repo, repo) === -1 ||
				compareVersions(packages[name].version, version) === -1
			) {
				packages[name] = pkgDetails;
			}

			let nestedConfig;

			if (repo){
				const dir = formatGithubDir(name, repo);
				nestedConfig = await readVesselConfig(dir) || {};
			}
			else{
				const dir = formatDir(name, version) + '/mops.toml';
				nestedConfig = readConfig(dir);
			}

			await collectDeps(nestedConfig);

			if (!versions[name]) {
				versions[name] = [];
			}

			if (repo){
				const {branch} = parseGithubURL(repo);
				versions[name].push(branch);
			}else{
				versions[name].push(version);
			}
		}
	};

	let config = readConfig(path.join(root, 'mops.toml'));
	await collectDeps(config, true);

	// install base-unofficial if base is missing
	if (!packages['base'] && !packages['base-unofficial']) {
		let dirs = fs.readdirSync(path.join(root, '.mops'));

		let downloadedPackages = Object.fromEntries(dirs.map((dir) => {
			return dir.split('@');
		}));

		if (downloadedPackages['base-unofficial']) {
			packages['base-unofficial'] = {
				version: downloadedPackages['base-unofficial'],
			};
		}
		else {
			let versionRes = await getHighestVersion('base-unofficial');
			if (versionRes.err) {
				console.log(chalk.red('Error: ') + versionRes.err);
				return;
			}
			let version = versionRes.ok;

			await install('base-unofficial', version, {silent: true, dep: true});
			packages['base-unofficial'] = {version};
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
	for (let [name, {repo, version}] of Object.entries(packages)) {
		let pkgDir;
		if (repo){
			pkgDir =  path.relative(process.cwd(), formatGithubDir(name, repo)) + '/src';
		}else{
			pkgDir = path.relative(process.cwd(), formatDir(name, version)) + '/src';
		}

		console.log(`--package ${name} ${pkgDir}`);

		// fallback base to base-unofficial
		if (!packages.base && name === 'base-unofficial') {
			console.log(`--package base ${pkgDir}`);
		}
	}
}