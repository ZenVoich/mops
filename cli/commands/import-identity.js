import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import prompts from 'prompts';
import {globalCacheDir} from '../mops.js';
import {encrypt} from '../pem.js';
import del from 'del';

export async function importPem(data) {
	try {
		if (!fs.existsSync(globalCacheDir)) {
			fs.mkdirSync(globalCacheDir);
		}

		let res = await prompts({
			type: 'password',
			name: 'value',
			message: 'Enter password to encrypt identity.pem',
		});

		let identityPem = path.resolve(globalCacheDir, 'identity.pem');
		let identityPemEncrypted = path.resolve(globalCacheDir, 'identity.pem.encrypted');

		del.sync([identityPem, identityPemEncrypted]);

		// encrypted
		if (res.value) {
			data = await encrypt(Buffer.from(data), res.value);
			fs.writeFileSync(identityPemEncrypted, data);
		}
		// unencrypted
		else {
			fs.writeFileSync(identityPem, data);
		}
		console.log(chalk.green('Success'));
	}
	catch (err) {
		console.log(chalk.red('Error: ') + err);
	}
}