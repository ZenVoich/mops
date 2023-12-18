import path from 'node:path';
import fs from 'node:fs';
import {Identity} from '@dfinity/agent';
import TOML from '@iarna/toml';
import chalk from 'chalk';
import prompts from 'prompts';
import ncp from 'ncp';
import fetch from 'node-fetch';

import {decodeFile} from './pem.js';
import {Config} from './types.js';
import {mainActor, storageActor} from './api/actors.js';
import {getNetwork} from './api/network.js';
import {getHighestVersion} from './api/getHighestVersion.js';


if (!global.fetch) {
	global.fetch = fetch as any;
}

// (!) make changes in pair with backend
export let apiVersion = '1.2';

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


export function getNetworkFile(): string | URL {
	let networkFile: string | URL = '';
	try {
		networkFile = new URL('./network.txt', import.meta.url);
	}
	catch {
		networkFile = path.join(__dirname, 'network.txt');
	}
	return networkFile;
}

export function setNetwork(network: string) {
	fs.writeFileSync(getNetworkFile(), network);
}

export let getIdentity = async (): Promise<Identity | undefined> => {
	let identityPem = path.resolve(globalConfigDir, 'identity.pem');
	let identityPemEncrypted = path.resolve(globalConfigDir, 'identity.pem.encrypted');
	if (fs.existsSync(identityPemEncrypted)) {
		let res = await prompts({
			type: 'invisible',
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

export function getClosestConfigFile(dir = process.cwd()) : string {
	if (!path.basename(dir)) {
		return '';
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

export function parseGithubURL(href: string) {
	const url = new URL(href);
	let branchAndSha = url.hash?.substring(1).split('@');
	let branch = branchAndSha[0] || 'master';
	let commitHash = branchAndSha[1] || '';
	let [org, gitName] = url.pathname.split('/').filter(path => !!path);
	org = org || '';
	gitName = gitName || '';

	if (gitName?.endsWith('.git')) {
		gitName = gitName.substring(0, gitName.length - 4);
	}
	return {org, gitName, branch, commitHash};
}

export async function getGithubCommit(repo: string, ref: string): Promise<any> {
	let res = await fetch(`https://api.github.com/repos/${repo}/commits/${ref}`);
	let json: any = await res.json();

	// try on main branch
	if (json.message && ref === 'master') {
		res = await fetch(`https://api.github.com/repos/${repo}/commits/main`);
		json = await res.json();
	}
	return json;
}

export function getDependencyType(version: string) {
	if (!version || typeof version !== 'string') {
		throw Error(`Invalid dependency value "${version}"`);
	}
	if (version.startsWith('https://github.com/')) {
		return 'github';
	}
	else if (version.match(/^(\.?\.)?\//)) {
		return 'local';
	}
	else {
		return 'mops';
	}
}

export function readConfig(configFile = getClosestConfigFile()): Config {
	let text = fs.readFileSync(configFile).toString();
	let toml = TOML.parse(text);

	let processDeps = (deps: any) => {
		Object.entries(deps).forEach(([name, data]) => {
			if (!data || typeof data !== 'string') {
				throw Error(`Invalid dependency value ${name} = "${data}"`);
			}
			let depType = getDependencyType(data);
			if (depType === 'github') {
				deps[name] = {name, repo: data, version: ''};
			}
			else if (depType === 'local') {
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
	let resConfig: any = JSON.parse(JSON.stringify(config));

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
	const {branch, commitHash} = parseGithubURL(repo);
	return path.join(getRootDir(), '.mops/_github', `${name}#${branch}` + (commitHash ? `@${commitHash}` : ''));
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

// compatibility with older versions
export {
	getNetwork,
	mainActor,
	storageActor,
	getHighestVersion,
};