import path from 'node:path';
import fs from 'node:fs';
import {createLogUpdate} from 'log-update';
import chalk from 'chalk';
import {checkConfigFile, formatDir, progressBar, readConfig} from '../mops.js';
import {getHighestVersion} from '../api/getHighestVersion.js';
import {storageActor} from '../api/actors.js';
import {parallel} from '../parallel.js';
import {installFromGithub} from '../vessel.js';
import {addCache, copyCache, isCached} from '../cache.js';
import {downloadFile, getPackageFilesInfo} from '../api/downloadPackageFiles.js';

export async function install(pkg: string, version = '', {verbose = false, silent = false, dep = false} = {}): Promise<Record<string, string> | false> {
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
		let threads = 16;

		// GitHub Actions fails with "fetch failed" if there are multiple concurrent actions
		if (process.env.GITHUB_ENV) {
			threads = 4;
		}

		try {
			let {storageId, fileIds} = await getPackageFilesInfo(pkg, version);

			total = fileIds.length + 2;

			let filesData = new Map;
			let storage = await storageActor(storageId);

			await parallel(threads, fileIds, async (fileId: string) => {
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
	let ok = true;
	let config = readConfig(path.join(dir, 'mops.toml'));
	let deps = Object.values(config.dependencies || {});
	let installedDeps = {};
	for (const {name, repo, version} of deps) {
		if (repo) {
			await installFromGithub(name, repo, {silent, verbose});
		}
		else {
			let res = await install(name, version, {silent, verbose});
			if (res) {
				installedDeps = {...installedDeps, ...res};
			}
			else {
				ok = false;
			}
		}
	}

	if (!alreadyInstalled) {
		installedDeps = {...installedDeps, [pkg]: version};
	}

	if (!ok) {
		return false;
	}
	return installedDeps;
}