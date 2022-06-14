import path from 'path';
import fs from 'fs';
import logUpdate from 'log-update';
import {checkConfigFile, getHighestVersion, mainActor, progressBar, readConfig, storageActor} from '../mops.js';
import {parallel} from '../parallel.js';
import chalk from 'chalk';

export async function install(pkg, version = '', {verbose, silent, dep} = {}) {
	if (!checkConfigFile()) {
		return;
	}

	if (!version) {
		version = await getHighestVersion(pkg);
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
		let packageDetails = await actor.getPackageDetails(pkg, version);
		let filesIds = await actor.getFileIds(pkg, version);
		let storage = await storageActor(packageDetails.publication.storage);

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
			let fileMetaRes = await storage.getFileMeta(fileId);
			if (fileMetaRes.err) {
				console.log(chalk.red('ERR: ') + fileMetaRes.err);
				return;
			}
			let fileMeta = fileMetaRes.ok;

			let chunks = Array(fileMeta.chunkCount);
			for (let i = 0; i < fileMeta.chunkCount; i++) {
				let chunkRes = await storage.downloadChunk(fileId, i);
				if (chunkRes.err) {
					console.log(chalk.red('ERR: ') + chunkRes.err);
					return;
				}
				chunks[i] = chunkRes.ok;
			}

			fs.mkdirSync(path.join(dir, path.dirname(fileMeta.path)), {recursive: true});
			fs.writeFileSync(path.join(dir, fileMeta.path), Buffer.from(chunks.flat()));
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