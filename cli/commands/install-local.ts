import path from 'node:path';
import {createLogUpdate} from 'log-update';
import {checkConfigFile, getRootDir, readConfig} from '../mops.js';
import {installFromGithub} from '../vessel.js';
import {install} from './install.js';

// skip install and just find non-local dependencies to install
// pkgPath should be relative to the current root dir
export async function installLocal(pkg: string, pkgPath = '', {verbose = false, silent = false} = {}): Promise<Record<string, string> | false> {
	if (!checkConfigFile()) {
		return false;
	}

	let logUpdate = createLogUpdate(process.stdout, {showCursor: true});

	logUpdate(`Local dependency ${pkg} = "${pkgPath}"`);

	if (verbose) {
		silent || logUpdate.done();
	}
	else {
		logUpdate.clear();
	}

	// install dependencies
	let ok = true;
	let dir = path.resolve(getRootDir(), pkgPath);
	let config = readConfig(path.join(dir, 'mops.toml'));
	let deps = Object.values(config.dependencies || {});
	let installedDeps = {};
	for (const {name, repo, version, path: depPath} of deps) {
		if (repo) {
			await installFromGithub(name, repo, {silent, verbose});
		}
		else {
			let res = await (depPath ? installLocal(name, depPath, {silent, verbose}) : install(name, version, {silent, verbose}));
			if (res) {
				installedDeps = {...installedDeps, ...res};
			}
			else {
				ok = false;
			}
		}
	}

	if (!ok) {
		return false;
	}
	return installedDeps;
}