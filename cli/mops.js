import {Actor, HttpAgent} from '@dfinity/agent';
import TOML from '@iarna/toml';
import chalk from 'chalk';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import prompts from 'prompts';

import {idlFactory} from './declarations/main/main.did.js';
import {idlFactory as storageIdlFactory} from './declarations/storage/storage.did.js';
import {decodeFile} from './pem.js';


global.fetch = fetch;

// (!) make changes in pair with backend
export let apiVersion = '1.2';

let networkFile = new URL('./network.txt', import.meta.url);

export let globalCacheDir = path.resolve(process.env.HOME || process.env.APPDATA, 'mops');

export function setNetwork(network) {
	fs.writeFileSync(networkFile, network);
}

export function getNetwork() {
	let network = 'ic';
	if (fs.existsSync(networkFile)) {
		network = fs.readFileSync(networkFile).toString() || 'ic';
	}

	if (network === 'local') {
		let ids = JSON.parse(fs.readFileSync(new URL('../.dfx/local/canister_ids.json', import.meta.url)).toString());
		return {
			network,
			host: 'http://127.0.0.1:4943',
			canisterId: ids.main.local,
		};
	}
	else if (network === 'staging') {
		return {
			network,
			host: 'https://icp-api.io',
			canisterId: '2d2zu-vaaaa-aaaak-qb6pq-cai',
		};
	}
	else if (network === 'ic') {
		return {
			network,
			host: 'https://icp-api.io',
			canisterId: 'oknww-riaaa-aaaam-qaf6a-cai',
		};
	}
}

export let getIdentity = async () => {
	let identityPem = path.resolve(globalCacheDir, 'identity.pem');
	let identityPemEncrypted = path.resolve(globalCacheDir, 'identity.pem.encrypted');
	if (fs.existsSync(identityPemEncrypted)) {
		let res = await prompts({
			type: 'password',
			name: 'value',
			message: 'Enter password:'
		});
		return await decodeFile(identityPemEncrypted, res.value);
	}
	if (fs.existsSync(identityPem)) {
		return decodeFile(identityPem);
	}
};

export let mainActor = async (useIdentity = false) => {
	let network = getNetwork().network;
	let host = getNetwork().host;
	let canisterId = getNetwork().canisterId;

	let identity = useIdentity && await getIdentity();
	let agent = new HttpAgent({host, identity});

	if (network === 'local') {
		await agent.fetchRootKey();
	}

	return Actor.createActor(idlFactory, {
		agent,
		canisterId,
	});
};

export let storageActor = async (storageId, useIdentity = false) => {
	let network = getNetwork().network;
	let host = getNetwork().host;

	let identity = useIdentity && await getIdentity();
	let agent = new HttpAgent({host, identity});

	if (network === 'local') {
		await agent.fetchRootKey();
	}

	return Actor.createActor(storageIdlFactory, {
		agent,
		canisterId: storageId,
	});
};

export function getClosestConfigFile(dir = process.cwd()) {
	if (!path.basename(dir)) {
		return null;
	}
	let configFile = path.join(dir, 'mops.toml');
	if (fs.existsSync(configFile)) {
		return configFile;
	}
	return getClosestConfigFile(path.resolve(dir, '..'));
}

export function getRootDir() {
	let configFile = getClosestConfigFile();
	if (!configFile) {
		return null;
	}
	return path.dirname(configFile);
}

export function checkConfigFile() {
	let configFile = getClosestConfigFile();
	if (!configFile) {
		console.log(chalk.red('Error: ') + `Config file 'mops.toml' not found. Please run ${chalk.green('mops init')} first`);
		return false;
	}
	return true;
}

export function progressBar(step, total) {
	let done = Math.round(step / total * 10);
	return `[${':'.repeat(done)}${' '.repeat(Math.max(0, 10 - done))}]`;
}

export async function getHighestVersion(pkgName) {
	let actor = await mainActor();
	return actor.getHighestVersion(pkgName);
}

export function parseGithubURL(href) {
	const url = new URL(href);
	const branch =  url.hash?.substring(1) || 'master';

	let [org, gitName] = url.pathname.split('/').filter(path => !!path);

	if (gitName.endsWith('.git')) {
		gitName = gitName.substring(0, gitName.length - 4);
	}

	return {org, gitName, branch};
}

export function readConfig(configFile = getClosestConfigFile()) {
	let text = fs.readFileSync(configFile).toString();
	let toml = TOML.parse(text);

	let processDeps = (deps) => {
		Object.entries(deps).forEach(([name, data]) => {
			if (!data || typeof data !== 'string') {
				throw Error(`Invalid dependency value ${name} = "${data}"`);
			}
			if (data.startsWith('https://github.com/')) {
				deps[name] = {name, repo: data, version: ''};
			}
			else if (data.match(/^(\.?\.)?\//)) {
				deps[name] = {name, repo: '', path: data, version: ''};
			}
			else {
				deps[name] = {name, repo: '', version: data};
			}
		});
	};

	processDeps(toml.dependencies || {});
	processDeps(toml['dev-dependencies'] || {});

	return toml;
}

export function writeConfig(config, configFile = getClosestConfigFile()) {
	const deps = config.dependencies || {};
	Object.entries(deps).forEach(([name, {repo, path, version}]) => {
		deps[name] = repo || path || version;
	});

	const devDeps = config['dev-dependencies'] || {};
	Object.entries(devDeps).forEach(([name, {repo, path, version}]) => {
		devDeps[name] = repo || path || version;
	});

	let text = TOML.stringify(config).trim();
	if (fs.existsSync(configFile) && fs.readFileSync(configFile).toString().endsWith('\n')) {
		text += '\n';
	}
	fs.writeFileSync(configFile, text);
}

export function formatDir(name, version) {
	return path.join(getRootDir(), '.mops', `${name}@${version}`);
}

export function formatGithubDir(name, repo) {
	const {branch} = parseGithubURL(repo);
	return path.join(getRootDir(), '.mops/_github', `${name}@${branch}`);
}

export function readDfxJson() {
	let dir = process.cwd();
	let dfxJson = null;
	for (let i = 0; i < 5; i++) {
		let file = path.resolve(dir, 'dfx.json');
		if (fs.existsSync(file)) {
			dfxJson = JSON.parse(fs.readFileSync(file).toString());
			break;
		}
		dir = path.resolve(dir, '..');
	}
	return dfxJson;
}

// warn on minor mismatch
// err on major mismatch
export async function checkApiCompatibility() {
	let actor = await mainActor();
	let backendApiVer = await actor.getApiVersion();
	if (backendApiVer.split('.')[0] !== apiVersion.split('.')[0]) {
		console.log(chalk.red('ERR: ') + `CLI incompatible with backend. CLI v${apiVersion}, Backend v${backendApiVer}`);
		console.log('Run ' + chalk.greenBright('npm i -g ic-mops') + ' to upgrade cli.');
		return false;
	}
	else if (backendApiVer.split('.')[1] !== apiVersion.split('.')[1]) {
		console.log('-'.repeat(50));
		console.log(chalk.yellow('WARN: ') + `CLI probably incompatible with backend. CLI v${apiVersion}, Backend v${backendApiVer}`);
		console.log('Recommended to run ' + chalk.greenBright('npm i -g ic-mops') + ' to upgrade cli.');
		console.log('-'.repeat(50));
	}
	return true;
}