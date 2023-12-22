import {existsSync, mkdirSync, createWriteStream, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {deleteSync} from 'del';
import {execaCommand} from 'execa';
import chalk from 'chalk';
import {createLogUpdate} from 'log-update';
import got from 'got';
import decompress from 'decompress';
import {pipeline} from 'stream';
import {formatGithubDir, parseGithubURL, progressBar} from './mops.js';
import {addCache, copyCache, isCached} from './cache.js';

const dhallFileToJson = async (filePath: string, silent: boolean) => {
	if (existsSync(filePath)) {
		let cwd = new URL(path.dirname(import.meta.url)).pathname;
		let res;
		try {
			res = await execaCommand(`dhall-to-json --file ${filePath}`, {preferLocal:true, cwd});
		}
		catch (err: any) {
			silent || console.error('dhall-to-json error:', err.message?.split('Message:')[0]);
			return null;
		}

		if (res.exitCode === 0) {
			return JSON.parse(res.stdout);
		}
		else {
			return res;
		}
	}

	return null;
};

export type VesselConfig = {
	dependencies: VesselDependencies;
	'dev-dependencies': VesselDependencies;
};

export type VesselDependencies = Array<{
	name: string;
	version?: string; // mops package
	repo?: string; // github package
	path?: string; // local package
}>;

export const readVesselConfig = async (dir: string, {cache = true, silent = false} = {}): Promise<VesselConfig | null> => {
	const cachedFile = (dir || process.cwd()) + '/vessel.json';

	if (existsSync(cachedFile)) {
		let cachedConfig = readFileSync(cachedFile).toString();
		return JSON.parse(cachedConfig);
	}

	const [vessel, packageSetArray] = await Promise.all([
		dhallFileToJson((dir || process.cwd()) + '/vessel.dhall', silent),
		dhallFileToJson((dir || process.cwd()) + '/package-set.dhall', silent)
	]);

	if (!vessel || !packageSetArray) {
		return null;
	}

	let repos: Record<string, string> = {};
	for (const {name, repo, version} of packageSetArray) {
		const {org, gitName} = parseGithubURL(repo);
		repos[name] = `https://github.com/${org}/${gitName}#${version}`;
	}

	let config: VesselConfig = {
		dependencies: vessel.dependencies.map((name: string) => {
			return {name, repo: repos[name], version: ''};
		}),
		'dev-dependencies': [],
	};

	if (cache === true) {
		writeFileSync(cachedFile, JSON.stringify(config), 'utf-8');
	}

	return config;
};

export const downloadFromGithub = async (repo: string, dest: string, onProgress: any) => {
	const {branch, org, gitName, commitHash} = parseGithubURL(repo);

	const zipFile = `https://github.com/${org}/${gitName}/archive/${commitHash || branch}.zip`;
	const readStream = got.stream(zipFile);

	const promise = new Promise((resolve, reject) => {
		readStream.on('error', (err) => {
			console.error(chalk.red(`Error: failed to download from GitHub: ${zipFile}`));
			console.error(err.message);
			reject(err);
		});

		readStream.on('downloadProgress', ({transferred, total}) => {
			onProgress?.(transferred, total || 2 * (1024 ** 2));
		});

		readStream.on('response', (response) => {
			if (response.headers.age > 3600) {
				console.error(chalk.red('Error: ') +  'Failure - response too old');
				readStream.destroy(); // Destroy the stream to prevent hanging resources.
				reject();
				return;
			}

			// Prevent `onError` being called twice.
			readStream.off('error', reject);
			const tmpDir = path.resolve(process.cwd(), '.mops/_tmp/');
			const tmpFile = path.resolve(tmpDir, `${gitName}@${commitHash || branch}.zip`);

			try {
				mkdirSync(tmpDir, {recursive: true});

				pipeline(readStream, createWriteStream(tmpFile), (err) => {
					if (err) {
						deleteSync([tmpDir]);
						reject(err);
					}
					else {
						let options = {
							extract: true,
							strip: 1,
							headers: {
								accept: 'application/zip',
							},
						};
						decompress(tmpFile, dest, options).then((unzippedFiles) => {
							deleteSync([tmpDir]);
							resolve(unzippedFiles);
						}).catch(err => {
							deleteSync([tmpDir]);
							reject(err);
						});
					}
				});
			}
			catch (err) {
				deleteSync([tmpDir]);
				reject(err);
			}
		});
	});

	return promise;
};

export const installFromGithub = async (name: string, repo: string, {verbose = false, dep = false, silent = false} = {}) => {
	let {branch, commitHash} = parseGithubURL(repo);
	let dir = formatGithubDir(name, repo);
	let cacheName = `_github/${name}#${branch}` + (commitHash ? `@${commitHash}` : '');

	let logUpdate = createLogUpdate(process.stdout, {showCursor: true});

	if (existsSync(dir)) {
		silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${repo} (local cache)`);
	}
	else if (isCached(cacheName)) {
		await copyCache(cacheName, dir);
		silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${repo} (global cache)`);
	}
	else {
		mkdirSync(dir, {recursive: true});

		let progress = (step: number, total: number) => {
			silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${repo} ${progressBar(step, total)}`);
		};

		progress(0, 2 * (1024 ** 2));

		try {
			await downloadFromGithub(repo, dir, progress);
		}
		catch (err) {
			deleteSync([dir]);
			process.exit(1);
		}

		// add to cache
		await addCache(cacheName, dir);
	}

	if (verbose) {
		silent || logUpdate.done();
	}
	else {
		logUpdate.clear();
	}

	const config = await readVesselConfig(dir, {silent});

	if (config) {
		for (const {name, repo} of config.dependencies) {
			if (repo) {
				await installFromGithub(name, repo, {verbose, silent, dep: true});
			}
		}
	}
};