import path from 'node:path';
import fs from 'node:fs';
import {checkConfigFile, formatDir, formatGithubDir, getDependencyType, readConfig} from '../mops.js';
import {resolvePackages} from '../resolve-packages.js';

// TODO: resolve conflicts
export async function sources({verbose = false, cwd = process.cwd()} = {}) {
	if (!checkConfigFile()) {
		return [];
	}

	let resolvedPackages = await resolvePackages({verbose});

	// sources
	return Object.entries(resolvedPackages).map(([name, version]) => {
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
		if (depType === 'local' && !fs.existsSync(pkgBaseDir)) {
			pkgBaseDir = pkgDir;
		}

		return `--package ${name} ${pkgBaseDir}`;
	});
}