import chalk from 'chalk';
import fs from 'fs';
import {getIdentity} from '../mops.js';

export function whoami() {
	let identityPem = new URL('../identity.pem', import.meta.url);
	if (fs.existsSync(identityPem)) {
		let identity = getIdentity();
		console.log(identity.getPrincipal().toText());
	}
	else {
		console.log(chalk.red('Error: ') + 'identity not found. Run ' + chalk.greenBright('mops import-identity') + ' command.');
	}
}