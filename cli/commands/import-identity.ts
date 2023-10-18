import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import prompts from 'prompts';
import {deleteSync} from 'del';
import {globalConfigDir} from '../mops.js';
import {encrypt} from '../pem.js';

type ImportIdentityOptions = {
	encrypt: boolean;
};

export async function importPem(data: string, options: ImportIdentityOptions = {encrypt: true}) {
	try {
		if (!fs.existsSync(globalConfigDir)) {
			fs.mkdirSync(globalConfigDir);
		}

		let password = '';

		if (options.encrypt) {
			let res = await prompts({
				type: 'invisible',
				name: 'password',
				message: 'Enter password to encrypt identity.pem',
			});
			password = res.password;

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
		}

		let identityPem = path.resolve(globalConfigDir, 'identity.pem');
		let identityPemEncrypted = path.resolve(globalConfigDir, 'identity.pem.encrypted');

		deleteSync([identityPem, identityPemEncrypted], {force: true});

		// encrypted
		if (password) {
			let encrypted = await encrypt(Buffer.from(data), password);
			fs.writeFileSync(identityPemEncrypted, encrypted);
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