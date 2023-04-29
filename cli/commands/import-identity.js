import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import {globalCacheDir} from '../mops.js';

export async function importPem(data) {
	try {
		if (!fs.existsSync(globalCacheDir)) {
			fs.mkdirSync(globalCacheDir);
		}
		let identityPem = path.resolve(globalCacheDir, 'identity.pem');
		fs.writeFileSync(identityPem, data);
		console.log(chalk.green('Success'));
	}
	catch (err) {
		console.log(chalk.red('Error: ') + err);
	}
}