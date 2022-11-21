import {existsSync, mkdirSync, rmdirSync } from 'fs';
import { execaCommand} from 'execa';
import chalk from 'chalk';
import downloadGitRepo from 'download-git-repo';
import logUpdate from 'log-update';
import path from 'path';

const dhallFileToJson = async (filePath) => {
	if (existsSync(filePath)) {
		const res = await execaCommand(`dhall-to-json --file ${filePath}`, {preferLocal:true, cwd:'/Users/dire.sol/Documents/dev/icp/mops/cli'});

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

	let packageSet = {};
	packageSetArray.forEach(dep => packageSet[dep.name] = dep);

	let config = {
		compiler : vessel.compiler,
		dependencies : vessel.dependencies.map(name => packageSet[name])
	};
	return config;
};

export const installFromGithub = async (details, options = {})=>{

	const {name, version} = details;
	const {verbose, dep, silent} = options;

	let repo = details.repo;
	if (repo.startsWith('https://github.com/'))
		repo = repo.substring(19);

	if (repo.endsWith('.git'))
		repo = repo.substring(0, repo.length - 4);

	let dir = path.join(process.cwd(), `.mops/github/${name}@${version}`);

	if (existsSync(dir)){
		silent || logUpdate(`${dep ? 'Dependency' : 'Installing'} ${repo}@${version } (cache) from Github`);
	}
	else {
		mkdirSync(dir, {recursive: true});
		if (verbose) {console.log();}

		let url = repo;

		if (version){
			url = `${repo}#${version}`;
		}

		silent || logUpdate(`${dep ? 'Dependency' : 'Installing '} ${name}@${version} from Github`);


		let download = new Promise((resolve, reject) => {
			downloadGitRepo(url, dir, {filename: 'src', extract: true}, (e) => {
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

	let config = await readVesselConfig(dir);

	if (config){
		for (const depDetails of config.dependencies){

			// ignore the 'base' module
			if (depDetails.name === 'base') continue;

			await installFromGithub(depDetails, {verbose, silent, dep: true });
		}
	}
};

// await readVesselConfig('/Users/dire.sol/Documents/dev/icp/icrc1');
