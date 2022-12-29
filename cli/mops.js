import {Actor, HttpAgent} from '@dfinity/agent';
import TOML from '@iarna/toml';
import chalk from 'chalk';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

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
			host: 'http://127.0.0.1:8000',
			canisterId: ids.main.local,
		};
	}
	else if (network === 'ic') {
		return {
			network,
			host: 'https://mainnet.dfinity.network',
			canisterId: 'oknww-riaaa-aaaam-qaf6a-cai',
		};
	}
}

export let getIdentity = () => {
	let identityPem = path.resolve(globalCacheDir, 'identity.pem');
	if (fs.existsSync(identityPem)) {
		return decodeFile(identityPem);
	}
};

export let mainActor = async () => {
	let network = getNetwork().network;
	let host = getNetwork().host;
	let canisterId = getNetwork().canisterId;

	let identity = getIdentity();
	let agent = new HttpAgent({host, identity});

	if (network === 'local') {
		await agent.fetchRootKey();
	}

	return Actor.createActor(idlFactory, {
		agent,
		canisterId,
	});
};

export let storageActor = async (storageId) => {
	let network = getNetwork().network;
	let host = getNetwork().host;

	let identity = getIdentity();
	let agent = new HttpAgent({host, identity});

	if (network === 'local') {
		await agent.fetchRootKey();
	}

	return Actor.createActor(storageIdlFactory, {
		agent,
		canisterId: storageId,
	});
};

export function checkConfigFile() {
	let configFile = path.join(process.cwd(), 'mops.toml');
	if (!fs.existsSync(configFile)) {
		console.log(chalk.red('Error: ') + `Config file not found ${configFile}`);
		return false;
	}
	return true;
}

export function progressBar(step, total) {
	let done = Math.round(step / total * 10);
	return `[${':'.repeat(done)}${' '.repeat(10 - done)}]`;
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

export function readConfig(configFile = path.join(process.cwd(), 'mops.toml')) {
	let text = fs.readFileSync(configFile).toString();
	let toml = TOML.parse(text);

	const deps = toml.dependencies || {};

	Object.entries(deps).forEach(([name, data]) => {
		if (!data || typeof data !== 'string') {
			throw Error(`Invalid dependency value ${name} = "${data}"`);
		}
		if (data.startsWith('https://github.com/')) {
			deps[name] = {name, repo: data, version: ''};
		}
		else {
			deps[name] = {name, repo: '', version: data};
		}
	});

	return toml;
}

export function writeConfig(config, configFile = path.join(process.cwd(), 'mops.toml')) {
	const deps = config.dependencies || {};

	Object.entries(deps).forEach(([name, {repo, version}]) => {
		if (repo) {
			deps[name] = repo;
		}
		else {
			deps[name] = version;
		}
	});

	fs.writeFileSync(configFile, TOML.stringify(config).trim());
}

export function formatDir(name, version) {
	return path.join(process.cwd(), '.mops', `${name}@${version}`);
}

export function formatGithubDir(name, repo) {
	const {branch} = parseGithubURL(repo);
	return path.join(process.cwd(), '.mops/_github', `${name}@${branch}`);
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