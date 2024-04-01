import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import {Buffer} from 'node:buffer';
import {createLogUpdate} from 'log-update';
import chalk from 'chalk';
import {checkConfigFile, formatDir, progressBar, readConfig} from '../../mops.js';
import {getHighestVersion} from '../../api/getHighestVersion.js';
import {storageActor} from '../../api/actors.js';
import {parallel} from '../../parallel.js';
import {addCache, copyCache, isCached} from '../../cache.js';
import {downloadFile, getPackageFilesInfo} from '../../api/downloadPackageFiles.js';
import {installDeps} from './install-deps.js';

type InstallMopsDepOptions = {
	verbose ?: boolean;
	silent ?: boolean;
	dep ?: boolean;
	threads ?: number;
};

export async function installMopsDep(pkg : string, version = '', {verbose, silent, dep, threads} : InstallMopsDepOptions = {}) : Promise<Record<string, string> | false> {
	threads = threads || 12;

	if (!checkConfigFile()) {
		return false;
	}
	let logUpdate = createLogUpdate(process.stdout, {showCursor: true});

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
		if ('err' in versionRes) {
			console.log(chalk.red('Error: ') + versionRes.err);
			return false;
		}
		version = versionRes.ok;
	}

	let dir = formatDir(pkg, version);
	let alreadyInstalled = false;

	// already installed
	if (fs.existsSync(dir)) {
		silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${pkg}@${version} (local cache)`);
		alreadyInstalled = true;
	}
	// copy from cache
	else if (isCached(`${pkg}@${version}`)) {
		await copyCache(`${pkg}@${version}`, dir);
		silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${pkg}@${version} (global cache)`);
	}
	// download
	else {
		// GitHub Actions fails with "fetch failed" if there are multiple concurrent actions
		if (process.env.GITHUB_ENV) {
			threads = 4;
		}

		try {
			let {storageId, fileIds} = await getPackageFilesInfo(pkg, version);

			total = fileIds.length + 2;

			let filesData = new Map;
			let storage = await storageActor(storageId);

			await parallel(threads, fileIds, async (fileId : string) => {
				let {path, data} = await downloadFile(storage, fileId);
				filesData.set(path, data);
				progress();
			});

			// write files to disk
			for (let [filePath, data] of filesData.entries()) {
				fs.mkdirSync(path.join(dir, path.dirname(filePath)), {recursive: true});
				fs.writeFileSync(path.join(dir, filePath), Buffer.from(data));
			}
		}
		catch (err) {
			console.error(chalk.red('Error: ') + err);
			return false;
		}

		// add to cache
		await addCache(`${pkg}@${version}`, dir);

		progress();
	}

	if (verbose) {
		silent || logUpdate.done();
	}
	else {
		logUpdate.clear();
	}

	// install dependencies
	let config = readConfig(path.join(dir, 'mops.toml'));
	let res = await installDeps(Object.values(config.dependencies || {}), {silent, verbose});

	if (!res) {
		return false;
	}
	let installedDeps = res;

	// add self to installed deps
	if (!alreadyInstalled) {
		installedDeps = {...installedDeps, [pkg]: version};
	}
	return installedDeps;
}