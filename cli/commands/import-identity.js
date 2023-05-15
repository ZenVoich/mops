import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import prompts from 'prompts';
import del from 'del';
import {globalCacheDir} from '../mops.js';
import {encrypt} from '../pem.js';

export async function importPem(data) {
	try {
		if (!fs.existsSync(globalCacheDir)) {
			fs.mkdirSync(globalCacheDir);
		}

		let res = await prompts({
			type: 'password',
			name: 'password',
			message: 'Enter password to encrypt identity.pem',
		});
		let password = res.password;

		if (!password) {
			let res = await prompts({
				type: 'confirm',
				name: 'ok',
				message: 'Are you sure you don\'t want to protect your identity.pem with a password?',
			});
			if (!res.ok) {
				console.log('aborted');
				return;
			}
		}

		let identityPem = path.resolve(globalCacheDir, 'identity.pem');
		let identityPemEncrypted = path.resolve(globalCacheDir, 'identity.pem.encrypted');

		del.sync([identityPem, identityPemEncrypted], {force: true});

		// encrypted
		if (password) {
			data = await encrypt(Buffer.from(data), password);
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