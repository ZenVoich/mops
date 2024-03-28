import path from 'node:path';

import {getDependencyType, readConfig} from './mops.js';
import {resolvePackages} from './resolve-packages.js';
import {SemVer} from 'semver';
import chalk from 'chalk';

export async function checkRequirements({verbose = false} = {}) {
	let config = readConfig();
	if (!config.toolchain?.moc) {
		return;
	}
	let installedMoc = new SemVer(config.toolchain.moc);
	let highestRequiredMoc = new SemVer('0.0.0');
	let highestRequiredMocPkgId = '';

	let resolvedPackages = await resolvePackages();
	for (let [name, version] of Object.entries(resolvedPackages)) {
		if (getDependencyType(version) === 'mops') {
			let pkgId = `${name}@${version}`;
			let depConfig = readConfig(path.join('.mops', pkgId, 'mops.toml'));
			let moc = depConfig.requirements?.moc;

			if (moc) {
				let requiredMoc = new SemVer(moc);
				if (highestRequiredMoc.compare(requiredMoc) < 0) {
					highestRequiredMoc = requiredMoc;
					highestRequiredMocPkgId = pkgId;
				}
				verbose && _check(pkgId, installedMoc, requiredMoc);
			}
		}
	}

	verbose || _check(highestRequiredMocPkgId, installedMoc, highestRequiredMoc);
}

function _check(pkgId : string, installedMoc : SemVer, requiredMoc : SemVer) {
	let comp = installedMoc.compare(requiredMoc);
	if (comp < 0) {
		console.log(chalk.yellow(`moc version does not meet the requirements of ${pkgId}`));
		console.log(chalk.yellow(`  Required: >= ${requiredMoc.format()}`));
		console.log(chalk.yellow(`  Installed:   ${installedMoc.format()}`));
	}
}