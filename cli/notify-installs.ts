import {mainActor} from './mops.js';
import {resolvePackages} from './resolve-packages.js';

export async function notifyInstalls(names: string[]) {
	let resolvedPackages = await resolvePackages();
	let packages: [string, string][] = names.map(name => [name, resolvedPackages[name] as string]);
	if (packages.length) {
		let actor = await mainActor();
		await actor.notifyInstalls(packages);
	}
}