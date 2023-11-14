import {getDependencyType} from './mops.js';
import {mainActor} from './api/actors.js';
import {resolvePackages} from './resolve-packages.js';

export async function notifyInstalls(names: string[]) {
	let resolvedPackages = await resolvePackages();
	let packages: [string, string][] = names.map(name => [name, resolvedPackages[name] as string]);
	if (packages.length) {
		let actor = await mainActor();
		await actor.notifyInstalls(packages.filter(([_, version]) => getDependencyType(version) === 'mops'));
	}
}