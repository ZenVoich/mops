import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import {install} from './install.js';
import {getLastVersion} from '../mops.js';

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

export async function packtool() {
	let root = rootDir();
	if (!root) {
		return;
	}

	// TODO: install all

	function dirsPkgs() {
		let dirs = fs.readdirSync(path.join(root, '.mops'));
		let pkgs = dirs.map((dir) => {
			return dir.split('@')[0];
		});
		return {dirs, pkgs};
	}

	let dp = dirsPkgs();
	if (!dp.pkgs.includes('base-unofficial')) {
		let version = await getLastVersion('base-unofficial');
		await install('base-unofficial', version, true);
	}

	let {dirs, pkgs} = dirsPkgs();
	for (let dir of dirs) {
		let pkgName = dir.split('@')[0];
		let pkgDir = path.relative(process.cwd(), path.join(root, `.mops/${dir}`));
		console.log(`--package ${pkgName} ${pkgDir}`);

		// fallback base to base-unofficial
		if (pkgName == 'base-unofficial' && !pkgs.includes('base')) {
			console.log(`--package base ${pkgDir}/src`);
		}
	}
}