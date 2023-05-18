import {existsSync, mkdirSync, createWriteStream, readFileSync, writeFileSync} from 'fs';
import del from 'del';
import {execaCommand} from 'execa';
import chalk from 'chalk';
import logUpdate from 'log-update';
import {formatGithubDir, parseGithubURL, progressBar} from './mops.js';
import path from 'path';
import got from 'got';
import decompress from 'decompress';
import {pipeline} from 'stream';
import {addCache, copyCache, isCached} from './cache.js';

const dhallFileToJson = async (filePath) => {
	if (existsSync(filePath)) {
		let cwd = new URL(path.dirname(import.meta.url)).pathname;
		let res;
		try {
			res = await execaCommand(`dhall-to-json --file ${filePath}`, {preferLocal:true, cwd});
		}
		catch (err) {
			console.error('dhall-to-json error:', err);
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

export const readVesselConfig = async (configFile, {cache = true} = {cache: true}) => {
	const cachedFile = (configFile || process.cwd()) + '/vessel.json';

	if (existsSync(cachedFile)) {
		let cachedConfig = readFileSync(cachedFile);
		return JSON.parse(cachedConfig);
	}

	const [vessel, packageSetArray] = await Promise.all([
		dhallFileToJson((configFile || process.cwd()) + '/vessel.dhall'),
		dhallFileToJson((configFile || process.cwd()) + '/package-set.dhall')
	]);

	if (!vessel || !packageSetArray) {
		return null;
	}

	let repos = {};
	for (const {name, repo, version} of packageSetArray) {
		const {org, gitName} = parseGithubURL(repo);
		repos[name] = `https://github.com/${org}/${gitName}#${version}`;
	}

	let config = {
		compiler: vessel.compiler,
		dependencies: vessel.dependencies.map((name) => {
			return {name, repo: repos[name], version: ''};
		}),
	};

	if (cache === true) {
		writeFileSync(cachedFile, JSON.stringify(config), 'utf-8');
	}

	return config;
};

export const downloadFromGithub = async (repo, dest, onProgress = null) => {
	const {branch, org, gitName} = parseGithubURL(repo);

	const zipFile = `https://github.com/${org}/${gitName}/archive/${branch}.zip`;
	const readStream = got.stream(zipFile);

	const promise = new Promise((resolve, reject) => {
		readStream.on('error', (err) => {
			reject(err);
		});

		readStream.on('downloadProgress', ({transferred, total}) => {
			onProgress?.(transferred, total || 2 * (1024 ** 2));
		});

		readStream.on('response', (response) => {
			if (response.headers.age > 3600) {
				console.log(chalk.red('Error: ') +  'Failure - response too old');
				readStream.destroy(); // Destroy the stream to prevent hanging resources.
				reject();
				return;
			}

			// Prevent `onError` being called twice.
			readStream.off('error', reject);
			const tmpDir = path.resolve(process.cwd(), '.mops/_tmp/');
			const tmpFile = path.resolve(tmpDir, `${gitName}@${branch}.zip`);

			try {
				mkdirSync(tmpDir, {recursive: true});

				pipeline(readStream, createWriteStream(tmpFile), (err) => {
					if (err) {
						del.sync([tmpDir]);
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
							del.sync([tmpDir]);
							resolve(unzippedFiles);
						}).catch(err => {
							del.sync([tmpDir]);
							reject(err);
						});
					}
				});
			}
			catch (err) {
				del.sync([tmpDir]);
				reject(err);
			}
		});
	});

	return promise;
};

export const installFromGithub = async (name, repo, options = {}) => {
	const {verbose, dep, silent} = options;

	const {branch} = parseGithubURL(repo);
	const dir = formatGithubDir(name, repo);
	const cacheName = `github_${name}@${branch}`;

	if (existsSync(dir)) {
		silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${name}@${branch} (already installed) from Github`);
	}
	else if (isCached(cacheName)) {
		await copyCache(cacheName, dir);
		silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${name}@${branch} (cache) from Github`);
	}
	else {
		mkdirSync(dir, {recursive: true});

		let progress = (step, total) => {
			silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${name}@${branch} ${progressBar(step, total)}`);
		};

		progress(0, 2 * (1024 ** 2));

		try {
			await downloadFromGithub(repo, dir, progress);
		}
		catch (err) {
			del.sync([dir]);
			throw err;
		}

		// add to cache
		await addCache(cacheName, dir);
	}

	if (verbose) {
		silent || logUpdate.done();
	}

	const config = await readVesselConfig(dir);

	if (config) {
		for (const {name, repo} of config.dependencies) {
			await installFromGithub(name, repo, {verbose, silent, dep: true});
		}
	}
};