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

// export async function pemFile(file) {
// 	try {
// 		if (!file.endsWith('.pem')) {
// 			throw 'Please specify .pem file';
// 		}
// 		if (!fs.existsSync(file)) {
// 			throw 'File not found ' + file;
// 		}
// 		let url = new URL('./pem-file', import.meta.url);
// 		fs.writeFileSync(url, file);
// 		console.log(chalk.green('Success'));
// 	}
// 	catch (e) {
// 		console.log(chalk.red('Error: ') + e);
// 	}
// }