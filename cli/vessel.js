import {existsSync, mkdirSync, createWriteStream } from 'fs';
import del from 'del';
import { execaCommand} from 'execa';
import chalk from 'chalk';
import logUpdate from 'log-update';
import { formatGithubDir, parseGithubURL, progressBar } from './mops.js';
import path from 'path';
import got from 'got';
import decompress from 'decompress';
import {pipeline} from 'stream/promises';

const dhallFileToJson = async (filePath) => {
	if (existsSync(filePath)) {
		let cwd = new URL(path.dirname(import.meta.url)).pathname;
		const res = await execaCommand(`dhall-to-json --file ${filePath}`, {preferLocal:true, cwd});

		if (res.exitCode === 0){
			return JSON.parse(res.stdout);
		}
		else {
			return res;
		}
	}

	return null;
};

export const readVesselConfig = async (configFile) => {
	let vessel, packageSetArray;

	if (!configFile){
		vessel = await dhallFileToJson(process.cwd() + '/vessel.dhall');
		packageSetArray = await dhallFileToJson(process.cwd() + '/package-set.dhall');
	}else{
		vessel = await dhallFileToJson(configFile + '/vessel.dhall');
		packageSetArray = await dhallFileToJson(configFile + '/package-set.dhall');
	}

	if (!vessel || !packageSetArray) return null;

	let repos = {};
	for (const { name, repo, version } of packageSetArray){
		const {org, gitName} = parseGithubURL(repo);
		repos[name] = `https://github.com/${org}/${gitName}#${version}`;
	}

	let config = {
		compiler : vessel.compiler,
		dependencies : vessel.dependencies.map(name => {
			return {name, repo: repos[name], version: ''};
		})
	};
	return config;
};

export const downloadFromGithub = async (repo, dest, onProgress = null) => {
	const {branch, org, gitName} = parseGithubURL(repo);

	const zipFile = `https://github.com/${org}/${gitName}/archive/${branch}.zip`;
	const readStream = got.stream(zipFile);

	const promise = new Promise((resolve, reject) => {

		readStream.on('downloadProgress', ({ transferred, total}) => {
			onProgress?.(transferred, total || 2 * (1024 ** 2) );
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
			const tmpDir = process.cwd() + '/.mops/_tmp/';
			const tmpFile = tmpDir + `/${gitName}@${branch}.zip`;

			try {
				mkdirSync(tmpDir, {recursive: true});

				pipeline(readStream, createWriteStream(tmpFile))
					.then(() => {
						let options = {
							extract: true,
							strip: 1,
							headers: {
								accept: 'application/zip'
							}
						};

						return decompress(tmpFile, dest, options);

					}).then((unzippedFiles) => {
						del.sync([tmpDir]);
						resolve(unzippedFiles);

					}).catch(err => {
						del.sync([tmpDir]);
						reject(err);
					});

			} catch (err) {
				del.sync([tmpDir]);
				reject(err);
			}
		});
	});

	return promise;
};

export const installFromGithub = async (name, repo, options = {})=>{

	const {verbose, dep, silent} = options;

	const {branch} = parseGithubURL(repo);
	const dir = formatGithubDir(name, repo);

	if (existsSync(dir)){
		silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${name}@${branch} (cache) from Github`);
	}
	else {
		mkdirSync(dir, {recursive: true});
		if (verbose) {console.log();}

		let progress = (step, total) => {
			silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${name}@${branch} ${progressBar(step, total)}`);
		};

		progress(0, 2 * (1024 ** 2));
		await downloadFromGithub(repo, dir, progress).catch((err)=> {
			del.sync([dir]);
			console.log(chalk.red('Error: ') + err);
		});
	}

	const config = await readVesselConfig(dir);

	if (config){
		for (const {name, repo} of config.dependencies){
			await installFromGithub(name, repo, {verbose, silent, dep: true });
		}
	}
};