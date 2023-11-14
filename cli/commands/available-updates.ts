import chalk from 'chalk';
import {mainActor} from '../api/actors.js';
import {Config} from '../types.js';

// [pkg, oldVersion, newVersion]
export async function getAvailableUpdates(config: Config, pkg?: string): Promise<Array<[string, string, string]>> {
	let deps = Object.values(config.dependencies || {});
	let devDeps = Object.values(config['dev-dependencies'] || {});
	let allDeps = [...deps, ...devDeps].filter((dep) => dep.version);
	let depsToUpdate = pkg ? allDeps.filter((dep) => dep.name === pkg) : allDeps;

	let getCurrentVersion = (pkg: string) => {
		for (let dep of allDeps) {
			if (dep.name === pkg && dep.version) {
				return dep.version;
			}
		}
		return '';
	};

	let actor = await mainActor();
	let res = await actor.getHighestSemverBatch(depsToUpdate.map((dep) => [dep.name, dep.version || '', {major: null}]));

	if ('err' in res) {
		console.log(chalk.red('Error:'), res.err);
		process.exit(1);
	}

	return res.ok.filter((dep) => dep[1] !== getCurrentVersion(dep[0])).map((dep) => [dep[0], getCurrentVersion(dep[0]), dep[1]]);
}