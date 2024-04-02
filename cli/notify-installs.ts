import {getDependencyType} from './mops.js';
import {mainActor} from './api/actors.js';

export async function notifyInstalls(installedDeps : Record<string, string>) {
	let packages = Object.entries(installedDeps).filter(([_, version]) => getDependencyType(version) === 'mops');
	if (packages.length) {
		let actor = await mainActor();

		try {
			await actor.notifyInstalls(packages);
		}
		catch (err) {
			// verbose && console.error('Failed to notify installs:', err);
		}
	}
}