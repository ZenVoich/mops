import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import {getIdentity, globalCacheDir} from '../mops.js';

export function whoami() {
	let identityPem = path.resolve(globalCacheDir, 'identity.pem');
	if (fs.existsSync(identityPem)) {
		let identity = getIdentity();
		console.log(identity.getPrincipal().toText());
	}
	else {
		console.log(chalk.red('Error: ') + 'identity not found. Run ' + chalk.greenBright('mops import-identity') + ' command.');
	}
}