import {checkConfigFile} from '../mops.js';
import path from 'path';
import fs from 'fs';
import del from 'del';
import chalk from 'chalk';

export async function remove(pkg, version) {
	if (!checkConfigFile()) {
		return;
	}

	// TODO: check if deps relate on this package
	let pkgDir = path.join(process.cwd(), '.mops', `${pkg}@${version}`);

	if (!fs.existsSync(pkgDir)) {
		console.log(`No cache to remove ${pkg} = '${version}'`);
		return;
	}

	// don't remove if there are dependents
	// let dependents = getDependents(pkg, version);
	// if (dependents.length) {
	// 	console.log(`Cache left ${pkg} = '${version}' (dependents: ${dependents})`)
	// 	return;
	// }

	del.sync([`${pkgDir}/**`]);

	console.log(chalk.green('Package removed ') + `${pkg} = '${version}'`);

	// remove dependencies
	// let text = fs.readFileSync(path.join(pkgDir, 'mops.toml')).toString();
	// let config = TOML.parse(text);

	// for (let [name, version] of Object.entries(config.deps)) {
	// 	remove(name, version);
	// }
}