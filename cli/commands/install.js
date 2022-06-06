import path from 'path';
import fs from 'fs';
import logUpdate from 'log-update';
import {checkConfigFile, getMaxVersion, mainActor, progressBar, readConfig} from '../mops.js';
import {parallel} from '../parallel.js';

export async function install(pkg, version = '', {verbose, silent, dep} = {}) {
	if (!checkConfigFile()) {
		return;
	}

	if (!version) {
		version = await getMaxVersion(pkg);
	}

	let dir = path.join(process.cwd(), '.mops', `${pkg}@${version}`);
	let actor = await mainActor();

	// cache
	if (fs.existsSync(dir)) {
		silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${pkg}@${version} (cache)`);
	}
	// no cache
	else {
		fs.mkdirSync(dir, {recursive: true});

		if (!dep) {
			actor.notifyInstall(pkg, version);
		}
		let filesIds = await actor.getFileIds(pkg, version);

		// progress
		let total = filesIds.length + 1;
		let step = 0;
		let progress = () => {
			step++;
			silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${pkg}@${version} ${progressBar(step, total)}`);
		};

		// download files
		progress();
		await parallel(8, filesIds, async (fileId) => {
			let file = await actor.getFile(fileId);
			fs.mkdirSync(path.join(dir, path.dirname(file.path)), {recursive: true});
			fs.writeFileSync(path.join(dir, file.path), Buffer.from(file.content));
			progress();
		});
	}

	if (verbose) {
		silent || logUpdate.done();
	}

	// install dependencies
	let config = readConfig(path.join(dir, 'mops.toml'));
	for (let [name, version] of Object.entries(config.dependencies || {})) {
		await install(name, version, {verbose, silent, dep: true});
	}
}