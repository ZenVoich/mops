import {mainActor} from './mops.js';
import {resolvePackages} from './resolve-packages.js';

export async function notifyInstalls(names: string[]) {
	let actor = await mainActor();
	let resolvedPackages = await resolvePackages();
	let packages: [string, string][] = names.map(name => [name, resolvedPackages[name] as string]);
	actor.notifyInstalls(packages);
}