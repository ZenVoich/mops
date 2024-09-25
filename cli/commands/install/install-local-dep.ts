import process from 'node:process';
import path from 'node:path';
import {createLogUpdate} from 'log-update';
import {getRootDir, readConfig} from '../../mops.js';
import {installDeps} from './install-deps.js';

type InstallLocalDepOptions = {
	verbose ?: boolean;
	silent ?: boolean;
	ignoreTransitive ?: boolean;
};

// skip install and just find non-local dependencies to install
// pkgPath should be relative to the current root dir or absolute
export async function installLocalDep(pkg : string, pkgPath = '', {verbose, silent, ignoreTransitive} : InstallLocalDepOptions = {}) : Promise<boolean> {
	if (!silent) {
		let logUpdate = createLogUpdate(process.stdout, {showCursor: true});
		logUpdate(`Local dependency ${pkg} = "${pkgPath}"`);

		if (verbose) {
			silent || logUpdate.done();
		}
		else {
			logUpdate.clear();
		}
	}

	// install dependencies
	if (!ignoreTransitive) {
		let dir = path.resolve(getRootDir(), pkgPath);
		let config = readConfig(path.join(dir, 'mops.toml'));
		return installDeps(Object.values(config.dependencies || {}), {silent, verbose}, pkgPath);
	}
	else {
		return true;
	}
}
