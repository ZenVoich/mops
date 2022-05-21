import path from 'path';
import fs from 'fs';
import logUpdate from 'log-update';
import {checkConfigFile, getLastVersion, mainActor, progressBar, readConfig} from '../mops.js';

export async function install(pkg, version = '', verbose = false, dep = false) {
	if (!checkConfigFile()) {
		return;
	}

	if (!version) {
		version = await getLastVersion(pkg);
	}

	let dir = path.join(process.cwd(), '.mops', `${pkg}@${version}`);
	let actor = await mainActor();

	// cache
	if (fs.existsSync(dir)) {
		logUpdate(`${dep ? 'Dependency' : 'Installing'} ${pkg}@${version} (cache)`);
	}
	// no cache
	else {
		fs.mkdirSync(dir, {recursive: true});

		let filesIds = await actor.getFileIds(pkg, version);
		await new Promise((resolve) => {
			setTimeout(resolve, 300);
		});

		// progress
		let total = filesIds.length;
		let step = 0;
		let progress = () => {
			step++;
			logUpdate(`${dep ? 'Dependency' : 'Installing'} ${pkg}@${version} ${progressBar(step, total)}`);
		};

		// download files
		for (let fileId of filesIds) {
			progress();
			let file = await actor.getFile(fileId);
			await new Promise((resolve) => {
				setTimeout(resolve, 300);
			});
			fs.mkdirSync(path.join(dir, path.dirname(file.path)), {recursive: true});
			fs.writeFileSync(path.join(dir, file.path), Buffer.from(file.content));
		}

		if (!dep) {
			actor.notifyInstall(pkg, version);
		}
	}

	if (verbose) {
		logUpdate.done();
	}

	// install dependencies
	let config = readConfig(path.join(dir, 'mops.toml'));
	for (let [name, version] of Object.entries(config.deps || {})) {
		await install(name, version, verbose, true);
	}
}