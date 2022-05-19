import fs from 'fs';
import chalk from 'chalk';

export async function importPem(data) {
	try {
		let url = new URL('./identity.pem', import.meta.url);
		fs.writeFileSync(url, data);
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