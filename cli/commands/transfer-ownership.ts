import chalk from 'chalk';
import {checkConfigFile, getIdentity, readConfig} from '../mops.js';
import {mainActor} from '../api/actors.js';
import {Principal} from '@dfinity/principal';
import prompts from 'prompts';

export async function transferOwnership(toPrincipal: string) {
	if (!checkConfigFile()) {
		return;
	}

	let config = readConfig();
	let principal = Principal.fromText(toPrincipal);

	let promptsConfig = {
		onCancel() {
			console.log('aborted');
			process.exit(0);
		}
	};

	console.log(chalk.red('Warning: ') + 'This action cannot be undone!');
	let {confirm} = await prompts({
		type: 'confirm',
		name: 'confirm',
		message: `Are you sure you want to transfer ownership of ${chalk.yellow(config.package?.name)} to ${chalk.yellow(toPrincipal)}?`,
		initial: false,
	}, promptsConfig);

	if (!confirm) {
		return;
	}

	let identity = await getIdentity();
	let actor = await mainActor(identity);

	let res = await actor.transferOwnership(config.package?.name || '', principal);
	if ('ok' in res) {
		console.log(chalk.green('Success!'));
	}
	else {
		console.log(chalk.red('Error: ') + res.err);
	}
}