import chalk from 'chalk';
import {getIdentity} from '../mops.js';
import {mainActor} from '../api/actors.js';

export async function getUserProp(prop: string) {
	let actor = await mainActor();
	let identity = await getIdentity();
	if (!identity) {
		console.log(chalk.red('Error: ') + 'No identity found');
		process.exit(1);
	}
	let res = await actor.getUser(identity.getPrincipal());
	// @ts-ignore
	console.log(res[0]?.[prop] || '');
}

export async function setUserProp(prop: string, value: string) {
	let identity = await getIdentity();
	let actor = await mainActor(identity);

	let res = await actor.setUserProp(prop, value);
	if ('ok' in res) {
		console.log(chalk.green('Success!'));
	}
	else {
		console.log(chalk.red('Error: ') + res.err);
	}
}