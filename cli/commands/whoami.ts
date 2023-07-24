import chalk from 'chalk';
import {getIdentity} from '../mops.js';

export async function whoami() {
	let identity = await getIdentity();
	if (identity) {
		console.log(identity.getPrincipal().toText());
	}
	else {
		console.log(chalk.red('Error: ') + 'identity not found. Run ' + chalk.greenBright('mops import-identity') + ' command.');
	}
}