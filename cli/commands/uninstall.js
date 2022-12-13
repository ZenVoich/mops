import {checkConfigFile, readConfig} from '../mops.js';
import fs from 'fs';
import del from 'del';
import chalk from 'chalk';
import {formatDir, formatGithubDir} from '../mops.js';

export async function uninstall(pkg, version) {
	if (!checkConfigFile()) {
		return;
	}

	// TODO: check if deps relate on this package
	const config = readConfig();

	const pkgDetails = config.dependencies[pkg];

	if (!pkgDetails) {
		console.log(`No dependency to remove ${pkg} = "${version}"`);
		return;
	}

	const {repo} = pkgDetails;
	let pkgDir;

	if (repo) {
		pkgDir = formatGithubDir(pkg, repo);
	}
	else {
		pkgDir = formatDir(pkg, version);
	}

	if (!fs.existsSync(pkgDir)) {
		console.log(`No cache to remove ${pkg} = "${version}"`);
		return;
	}

	// don't remove if there are dependents
	// let dependents = getDependents(pkg, version);
	// if (dependents.length) {
	// 	console.log(`Cache left ${pkg} = "${version}" (dependents: ${dependents})`)
	// 	return;
	// }

	del.sync([`${pkgDir}/**`]);

	console.log(chalk.green('Package removed ') + `${pkg} = "${version}"`);

	// remove dependencies
	// let text = fs.readFileSync(path.join(pkgDir, 'mops.toml')).toString();
	// let config = TOML.parse(text);

	// for (let [name, version] of Object.entries(config.dependencies)) {
	// 	remove(name, version);
	// }
}