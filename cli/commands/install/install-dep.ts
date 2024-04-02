import path from 'node:path';
import {installFromGithub} from '../../vessel.js';
import {installMopsDep} from './install-mops-dep.js';
import {Dependency} from '../../types.js';
import {installLocalDep} from './install-local-dep.js';
import {getRootDir} from '../../mops.js';

type InstallDepOptions = {
	verbose ?: boolean;
	silent ?: boolean;
	threads ?: number;
};

// install dependency
// returns false if failed
export async function installDep(dep : Dependency, {verbose, silent, threads} : InstallDepOptions = {}, parentPkgPath ?: string) : Promise<Record<string, string> | false> {
	if (dep.repo) {
		await installFromGithub(dep.name, dep.repo, {silent, verbose});
		return {};
	}
	else if (dep.path) {
		let depPath = dep.path;
		parentPkgPath = parentPkgPath || getRootDir();
		if (parentPkgPath) {
			depPath = path.resolve(parentPkgPath, dep.path);
		}
		return installLocalDep(dep.name, depPath, {silent, verbose});
	}
	else if (dep.version) {
		return installMopsDep(dep.name, dep.version, {silent, verbose, threads});
	}

	return {};
}