import path from 'node:path';
import {execSync} from 'node:child_process';
import {globSync} from 'glob';
import chalk from 'chalk';
import {checkConfigFile, getRootDir, readConfig} from '../mops.js';
import {add} from './add.js';
import {remove} from './remove.js';
import {checkIntegrity} from '../integrity.js';

type SyncOptions = {
	lock?: 'update' | 'ignore';
};

export async function sync({lock}: SyncOptions = {}) {
	if (!checkConfigFile()) {
		return;
	}

	let missing = await getMissingPackages();
	let unused = await getUnusedPackages();

	missing.length && console.log(`${chalk.yellow('Missing packages:')} ${missing.join(', ')}`);
	unused.length && console.log(`${chalk.yellow('Unused packages:')} ${unused.join(', ')}`);

	let config = readConfig();
	let deps = new Set(Object.keys(config.dependencies || {}));
	let devDeps = new Set(Object.keys(config['dev-dependencies'] || {}));

	// add missing packages
	for (let pkg of missing) {
		await add(pkg, {lock: 'ignore'});
	}

	// remove unused packages
	for (let pkg of unused) {
		let dev = devDeps.has(pkg) && !deps.has(pkg);
		await remove(pkg, {dev, lock: 'ignore'});
	}

	await checkIntegrity(lock);
}

let ignore = [
	'**/node_modules/**',
	'**/.vessel/**',
	'**/.git/**',
	'**/.mops/**',
];

let mocPath = '';
function getMocPath(): string {
	if (!mocPath) {
		mocPath = process.env.DFX_MOC_PATH || '';
	}
	if (!mocPath) {
		try {
			mocPath = execSync('dfx cache show').toString().trim() + '/moc';
		}
		catch {}
	}
	if (!mocPath) {
		mocPath = 'moc';
	}
	return mocPath;
}

async function getUsedPackages(): Promise<string[]> {
	let rootDir = getRootDir();
	let files = globSync('**/*.mo', {
		cwd: rootDir,
		nocase: true,
		ignore: ignore,
	});

	let packages: Set<string> = new Set;

	for (let file of files) {
		let deps: string[] = execSync(`${getMocPath()} --print-deps ${path.join(rootDir, file)}`).toString().trim().split('\n');

		for (let dep of deps) {
			if (dep.startsWith('mo:') && !dep.startsWith('mo:prim') && !dep.startsWith('mo:⛔')) {
				packages.add(dep.replace(/^mo:([^/]+).*$/, '$1'));
			}
		}
	}

	return [...packages];
}

async function getMissingPackages(): Promise<string[]> {
	let config = readConfig();
	let allDeps = [...Object.keys(config.dependencies || {}), ...Object.keys(config['dev-dependencies'] || {})];
	let missing = new Set(await getUsedPackages());
	for (let pkg of allDeps) {
		missing.delete(pkg);
	}
	return [...missing];
}

async function getUnusedPackages(): Promise<string[]> {
	let config = readConfig();
	let allDeps = new Set([...Object.keys(config.dependencies || {}), ...Object.keys(config['dev-dependencies'] || {})]);
	let used = await getUsedPackages();
	for (let pkg of used) {
		allDeps.delete(pkg);
	}
	return [...allDeps];
}