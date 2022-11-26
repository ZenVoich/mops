import {existsSync, mkdirSync, rmdirSync } from 'fs';
import { execaCommand} from 'execa';
import chalk from 'chalk';
import downloadGitRepo from 'download-git-repo';
import logUpdate from 'log-update';
import { formatGithubDir, parseGithubURL } from './mops.js';
import path from 'path';

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
		repos[name] = `${repo}#${version}`;
	}

	let config = {
		compiler : vessel.compiler,
		dependencies : vessel.dependencies.map(name => {
			return {name, repo: repos[name], version: ''};
		})
	};
	return config;
};

export const installFromGithub = async (name, repo, options = {})=>{

	const {verbose, dep, silent} = options;

	const {branch, org, gitName} = parseGithubURL(repo);
	const dir = formatGithubDir(name, repo);

	if (existsSync(dir)){
		silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${name}@${branch} (cache) from Github`);
	}
	else {
		mkdirSync(dir, {recursive: true});
		if (verbose) {console.log();}

		silent || logUpdate(`${dep ? 'Dependency' : 'Installing '} ${name}@${branch} from Github`);

		const download = new Promise((resolve, reject) => {
			downloadGitRepo(`${org}/${gitName}#${branch}`, dir, {filename: 'src', extract: true}, (e) => {
				if (e){
					rmdirSync(dir);
					reject(e);
				}else{
					resolve();
				}
			});
		});

		await download.catch((err)=> console.log(chalk.red('Error: ') + err));
	}

	const config = await readVesselConfig(dir);

	if (config){
		for (const {name, repo} of config.dependencies){
			await installFromGithub(name, repo, {verbose, silent, dep: true });
		}
	}
};