import path from 'path';
import fs from 'fs';
import logUpdate from 'log-update';
import {checkConfigFile, formatDir, getHighestVersion, mainActor, progressBar, readConfig, storageActor} from '../mops.js';
import {parallel} from '../parallel.js';
import chalk from 'chalk';
import { installFromGithub } from '../vessel.js';

export async function install(pkg, version = '', {verbose, silent, dep} = {}) {
	if (!checkConfigFile()) {
		return;
	}

	if (!version) {
		let versionRes = await getHighestVersion(pkg);
		if (versionRes.err) {
			console.log(chalk.red('Error: ') + versionRes.err);
			return;
		}
		version = versionRes.ok;
	}

	let dir = formatDir(pkg, version);
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

		let packageDetailsRes = await actor.getPackageDetails(pkg, version);
		if (packageDetailsRes.err) {
			console.log(chalk.red('Error: ') + packageDetailsRes.err);
			return;
		}
		let packageDetails = packageDetailsRes.ok;

		let filesIdsRes = await actor.getFileIds(pkg, version);
		if (filesIdsRes.err) {
			console.log(chalk.red('Error: ') + filesIdsRes.err);
			return;
		}
		let filesIds = filesIdsRes.ok;

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

			let buffer = Buffer.from([]);
			for (let i = 0; i < fileMeta.chunkCount; i++) {
				let chunkRes = await storage.downloadChunk(fileId, i);
				if (chunkRes.err) {
					console.log(chalk.red('ERR: ') + chunkRes.err);
					return;
				}
				let chunk = chunkRes.ok;
				buffer = Buffer.concat([buffer, Buffer.from(chunk)]);
			}

			fs.mkdirSync(path.join(dir, path.dirname(fileMeta.path)), {recursive: true});
			fs.writeFileSync(path.join(dir, fileMeta.path), buffer);
			progress();
		});
	}

	if (verbose) {
		silent || logUpdate.done();
	}

	// install dependencies
	let config = readConfig(path.join(dir, 'mops.toml'));
	for (const {name, repo, version} of Object.values(config.dependencies || {})) {
		if (repo){
			await installFromGithub({name, repo, version}, {verbose});
		}else{
			await install(name, version, {verbose});
		}
	}
}