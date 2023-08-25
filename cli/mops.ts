import path from 'node:path';
import fs from 'node:fs';
import {Actor, HttpAgent, Identity} from '@dfinity/agent';
import TOML from '@iarna/toml';
import chalk from 'chalk';
import prompts from 'prompts';
import ncp from 'ncp';
import fetch from 'node-fetch';

import {idlFactory} from './declarations/main/index.js';
import {_SERVICE} from './declarations/main/main.did.js';
import {idlFactory as storageIdlFactory} from './declarations/storage/index.js';
import {_SERVICE as _STORAGE_SERVICE} from './declarations/storage/storage.did.js';
import {decodeFile} from './pem.js';
import {Config} from './types.js';
import {Principal} from '@dfinity/principal';


if (!global.fetch) {
	global.fetch = fetch as any;
}

// (!) make changes in pair with backend
export let apiVersion = '1.2';

let networkFile = '';
try {
	networkFile = new URL('./network.txt', import.meta.url).toString();
}
catch {
	networkFile = path.join(__dirname, 'network.txt');
}

export let globalConfigDir = '';
export let globalCacheDir = '';

// OS specific dirs
if (process.platform == 'win32') {
	globalConfigDir = path.join(process.env.LOCALAPPDATA || '', 'mops/config');
	globalCacheDir = path.join(process.env.LOCALAPPDATA || '', 'mops/cache');
}
else if (process.platform == 'darwin') {
	globalConfigDir = path.join(process.env.HOME || '', 'Library/Application Support/mops');
	globalCacheDir = path.join(process.env.HOME || '', 'Library/Caches/mops');
}
else {
	globalConfigDir = path.join(process.env.HOME || '', '.config/mops');
	globalCacheDir = path.join(process.env.HOME || '', '.cache/mops');
}
// XDG overrides
if (process.env.XDG_CONFIG_HOME) {
	globalConfigDir = path.join(process.env.XDG_CONFIG_HOME, 'mops');
}
if (process.env.XDG_CACHE_HOME) {
	globalCacheDir = path.join(process.env.XDG_CACHE_HOME, 'mops');
}

// temp: move old config to new location
let oldGlobalConfigDir = path.resolve(process.env.HOME || process.env.APPDATA || '/', 'mops');
if (fs.existsSync(oldGlobalConfigDir) && !fs.existsSync(globalConfigDir)) {
	fs.mkdirSync(globalConfigDir, {recursive: true});
	if (fs.existsSync(path.join(oldGlobalConfigDir, 'identity.pem'))) {
		fs.copyFileSync(path.join(oldGlobalConfigDir, 'identity.pem'), path.join(globalConfigDir, 'identity.pem'));
	}
	if (fs.existsSync(path.join(oldGlobalConfigDir, 'identity.pem.encrypted'))) {
		fs.copyFileSync(path.join(oldGlobalConfigDir, 'identity.pem.encrypted'), path.join(globalConfigDir, 'identity.pem.encrypted'));
	}
	console.log('Moved config to ' + chalk.green(globalConfigDir));
}

// temp: move old cache to new location
if (fs.existsSync(oldGlobalConfigDir) && !fs.existsSync(globalCacheDir)) {
	fs.mkdirSync(globalCacheDir, {recursive: true});
	ncp.ncp(path.join(oldGlobalConfigDir, 'packages'), path.join(globalCacheDir, 'packages'), {
		stopOnErr: true,
		clobber: false,
	}, (err) => {
		if (err) {
			console.log('Error moving config: ', err);
			fs.rmSync(globalCacheDir, {recursive: true, force: true});
		}
	});
	console.log('Moved cache to ' + chalk.green(globalCacheDir));
}

export function setNetwork(network: string) {
	fs.writeFileSync(networkFile, network);
}

export function getNetwork() {
	let network = 'ic';
	if (fs.existsSync(networkFile)) {
		network = fs.readFileSync(networkFile).toString() || 'ic';
	}

	if (network === 'staging') {
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
	else {
		return {
			network,
			host: 'http://127.0.0.1:4943',
			canisterId: '2d2zu-vaaaa-aaaak-qb6pq-cai',
		};
	}
}

export let getIdentity = async (): Promise<Identity | undefined> => {
	let identityPem = path.resolve(globalConfigDir, 'identity.pem');
	let identityPemEncrypted = path.resolve(globalConfigDir, 'identity.pem.encrypted');
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
	return undefined;
};

export let mainActor = async (useIdentity = false): Promise<_SERVICE> => {
	let network = getNetwork().network;
	let host = getNetwork().host;
	let canisterId = getNetwork().canisterId;

	let identity = useIdentity ? await getIdentity() : undefined;
	// @ts-ignore exactOptionalPropertyTypes
	let agent = new HttpAgent({host, identity});

	if (network === 'local') {
		await agent.fetchRootKey();
	}

	return Actor.createActor(idlFactory, {
		agent,
		canisterId,
	});
};

export let storageActor = async (storageId: Principal, useIdentity = false): Promise<_STORAGE_SERVICE> => {
	let network = getNetwork().network;
	let host = getNetwork().host;

	let identity = useIdentity && await getIdentity();
	// @ts-ignore exactOptionalPropertyTypes
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
		throw '';
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
		return '';
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

export function progressBar(step: number, total: number) {
	let done = Math.round(step / total * 10);
	return `[${':'.repeat(done)}${' '.repeat(Math.max(0, 10 - done))}]`;
}

export async function getHighestVersion(pkgName: string) {
	let actor = await mainActor();
	return actor.getHighestVersion(pkgName);
}

export function parseGithubURL(href: string) {
	const url = new URL(href);
	const branch =  url.hash?.substring(1) || 'master';

	let [org, gitName] = url.pathname.split('/').filter(path => !!path);

	if (gitName?.endsWith('.git')) {
		gitName = gitName.substring(0, gitName.length - 4);
	}

	return {org, gitName, branch};
}

export function readConfig(configFile = getClosestConfigFile()): Config {
	let text = fs.readFileSync(configFile).toString();
	let toml = TOML.parse(text);

	let processDeps = (deps: any) => {
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

export function writeConfig(config: Config, configFile = getClosestConfigFile()) {
	let resConfig: any = {...config};

	let deps = resConfig.dependencies || {};
	Object.entries(config.dependencies || {}).forEach(([name, {repo, path, version}]) => {
		deps[name] = repo || path || version;
	});

	let devDeps = resConfig['dev-dependencies'] || {};
	Object.entries(config['dev-dependencies'] || {}).forEach(([name, {repo, path, version}]) => {
		devDeps[name] = repo || path || version;
	});

	let text = TOML.stringify(resConfig).trim();
	if (fs.existsSync(configFile) && fs.readFileSync(configFile).toString().endsWith('\n')) {
		text += '\n';
	}
	fs.writeFileSync(configFile, text);
}

export function formatDir(name: string, version: string) {
	return path.join(getRootDir(), '.mops', `${name}@${version}`);
}

export function formatGithubDir(name: string, repo: string) {
	const {branch} = parseGithubURL(repo);
	return path.join(getRootDir(), '.mops/_github', `${name}@${branch}`);
}

export function readDfxJson(): any {
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