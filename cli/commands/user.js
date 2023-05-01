import chalk from 'chalk';
import {getIdentity, mainActor} from '../mops.js';

export async function getUserProp(prop) {
	let actor = await mainActor();
	let res = await actor.getUser(getIdentity().getPrincipal());
	if (res[0]) {
		console.log(res[0][prop]);
	}
}

export async function setUserProp(prop, value) {
	let actor = await mainActor();
	let res = await actor.setUserProp(prop, value);
	if ('ok' in res) {
		console.log(chalk.green('Success!'));
	}
	else {
		console.log(chalk.red('Error: ') + res.err);
	}
}