import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs';
import {checkConfigFile, formatDir, formatGithubDir, getDependencyType, readConfig} from '../mops.js';
import {resolvePackages} from '../resolve-packages.js';

export async function sources({conflicts = 'ignore' as 'warning' | 'error' | 'ignore', cwd = process.cwd()} = {}) {
	if (!checkConfigFile()) {
		return [];
	}

	let resolved = await resolvePackages({conflicts});

	let sources : string[] = [];
	let packageDirectories : Record<string, string> = {};
	Object.entries(resolved.packages).forEach(([name, version]) => {
		let depType = getDependencyType(version);

		let pkgDir;
		if (depType === 'local') {
			pkgDir = path.relative(cwd, version);
		}
		else if (depType === 'github') {
			pkgDir = path.relative(cwd, formatGithubDir(name, version));
		}
		else if (depType === 'mops') {
			pkgDir = path.relative(cwd, formatDir(name, version));
		}
		else {
			return;
		}

		// append baseDir
		let pkgBaseDir;
		if (fs.existsSync(path.join(pkgDir, 'mops.toml'))) {
			let config = readConfig(path.join(pkgDir, 'mops.toml'));
			pkgBaseDir = path.join(pkgDir, config.package?.baseDir || 'src');
		}
		else {
			pkgBaseDir = path.join(pkgDir, 'src');
		}

		// use pkgDir if baseDir doesn't exist for local packages
		if (depType === 'local' && !fs.existsSync(path.resolve(cwd, pkgBaseDir))) {
			pkgBaseDir = pkgDir;
		}

		packageDirectories[name] = pkgDir;
		sources.push(`--package ${name} ${pkgBaseDir}`); // TODO: escape args
	});
	Object.entries(resolved.overrides).forEach(([name, overrides]) => {
		const directory = packageDirectories[name];
		if (!directory) {
			throw new Error(`Unknown directory for package: ${name}`);
		}
		Object.entries(overrides).forEach(([fromPackage, toPackage]) => {
			sources.push(`--override ${directory} ${fromPackage} ${toPackage}`); // TODO: escape args
		});
	});
	return sources;
}