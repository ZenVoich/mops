import {Dependency} from '../../types.js';
import {installDep} from './install-dep.js';

type InstallDepsOptions = {
	verbose ?: boolean;
	silent ?: boolean;
	threads ?: number;
};

// install all dependencies
// returns actual installed dependencies
// returns false if failed
export async function installDeps(deps : Dependency[], {verbose, silent, threads} : InstallDepsOptions = {}, parentPkgPath ?: string) : Promise<boolean> {
	let ok = true;

	for (const dep of deps) {
		let res = await installDep(dep, {verbose, silent, threads}, parentPkgPath);
		if (!res) {
			ok = false;
		}
	}

	return ok;
}
