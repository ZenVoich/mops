import chalk from 'chalk';
import {getIdentity, mainActor} from '../mops.js';

export async function getUserProp(prop) {
	let actor = await mainActor();
	let identity = await getIdentity();
	let res = await actor.getUser(identity.getPrincipal());
	console.log(res[0]?.[prop] || '');
}

export async function setUserProp(prop, value) {
	let actor = await mainActor(true);
	let res = await actor.setUserProp(prop, value);
	if ('ok' in res) {
		console.log(chalk.green('Success!'));
	}
	else {
		console.log(chalk.red('Error: ') + res.err);
	}
}