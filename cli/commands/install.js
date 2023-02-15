import path from 'path';
import fs from 'fs';
import logUpdate from 'log-update';
import {checkConfigFile, formatDir, getHighestVersion, mainActor, progressBar, readConfig, storageActor} from '../mops.js';
import {parallel} from '../parallel.js';
import chalk from 'chalk';
import {installFromGithub} from '../vessel.js';
import {addCache, copyCache, isCached} from '../cache.js';

export async function install(pkg, version = '', {verbose, silent, dep} = {}) {
	if (!checkConfigFile()) {
		return false;
	}

	// progress
	let total = Infinity;
	let step = 0;
	let progress = () => {
		step++;
		silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${pkg}@${version} ${progressBar(step, total)}`);
	};
	progress();

	if (!version) {
		let versionRes = await getHighestVersion(pkg);
		if (versionRes.err) {
			console.log(chalk.red('Error: ') + versionRes.err);
			return false;
		}
		version = versionRes.ok;
	}

	let dir = formatDir(pkg, version);
	let actor = await mainActor();

	// already installed
	if (fs.existsSync(dir)) {
		silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${pkg}@${version} (already installed)`);
	}
	// copy from cache
	else if (isCached(`${pkg}@${version}`)) {
		actor.notifyInstall(pkg, version);
		await copyCache(`${pkg}@${version}`, dir);
		silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${pkg}@${version} (cache)`);
	}
	// download
	else {
		let [packageDetailsRes, filesIdsRes] = await Promise.all([
			actor.getPackageDetails(pkg, version),
			actor.getFileIds(pkg, version),
		]);

		if (packageDetailsRes.err) {
			console.log(chalk.red('Error: ') + packageDetailsRes.err);
			return false;
		}
		let packageDetails = packageDetailsRes.ok;

		if (filesIdsRes.err) {
			console.log(chalk.red('Error: ') + filesIdsRes.err);
			return false;
		}
		let filesIds = filesIdsRes.ok;
		total = filesIds.length + 2;

		let storage = await storageActor(packageDetails.publication.storage);

		actor.notifyInstall(pkg, version);

		// download files
		let filesData = new Map;
		await parallel(16, filesIds, async (fileId) => {
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
			filesData.set(fileMeta.path, buffer);
			progress();
		});

		// write files to disk
		for (let [filePath, buffer] of filesData.entries()) {
			fs.mkdirSync(path.join(dir, path.dirname(filePath)), {recursive: true});
			fs.writeFileSync(path.join(dir, filePath), buffer);
		}

		// add to cache
		await addCache(`${pkg}@${version}`, dir);

		progress();
	}

	if (verbose) {
		silent || logUpdate.done();
	}

	// install dependencies
	let ok = true;
	let config = readConfig(path.join(dir, 'mops.toml'));
	let deps = Object.values(config.dependencies || {});
	for (const {name, repo, version} of deps) {
		if (repo) {
			await installFromGithub(name, repo, {silent, verbose});
		}
		else {
			let res = await install(name, version, {silent, verbose});
			if (!res) {
				ok = false;
			}
		}
	}

	return ok;
}