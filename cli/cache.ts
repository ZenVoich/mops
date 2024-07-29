import fs from 'node:fs';
import path from 'node:path';
import ncp from 'ncp';
import getFolderSize from 'get-folder-size';

import {getDependencyType, globalCacheDir, parseGithubURL} from './mops.js';
import {getPackageId} from './helpers/get-package-id.js';

export let show = () => {
	return globalCacheDir;
};

export let getDepCacheDir = (cacheName : string) => {
	return path.join(globalCacheDir, 'packages', cacheName);
};

export let isDepCached = (cacheName : string) => {
	let dir = getDepCacheDir(cacheName);
	return fs.existsSync(dir);
};

export function getDepCacheName(name : string, version : string) {
	let depType = getDependencyType(version);
	return depType === 'mops' ? getMopsDepCacheName(name, version) : getGithubDepCacheName(name, version);
}

export function getMopsDepCacheName(name : string, version : string) {
	return getPackageId(name, version);
}

export function getGithubDepCacheName(name : string, repo : string) {
	const {branch, commitHash} = parseGithubURL(repo);
	return `_github/${name}#${branch}` + (commitHash ? `@${commitHash}` : '');
}

export let addCache = (cacheName : string, source : string) => {
	let dest = path.join(globalCacheDir, 'packages', cacheName);
	fs.mkdirSync(dest, {recursive: true});

	return new Promise<void>((resolve, reject) => {
		ncp.ncp(source, dest, {stopOnErr: true}, (err) => {
			if (err) {
				reject(err);
			}
			resolve();
		});
	});
};

export let copyCache = (cacheName : string, dest : string) => {
	let source = path.join(globalCacheDir, 'packages', cacheName);
	fs.mkdirSync(dest, {recursive: true});

	return new Promise<void>((resolve, reject) => {
		ncp.ncp(source, dest, {stopOnErr: true}, (err) => {
			if (err) {
				reject(err);
			}
			resolve();
		});
	});
};

export let cacheSize = async () => {
	let dir = path.join(globalCacheDir);
	fs.mkdirSync(dir, {recursive: true});

	let size = await getFolderSize.strict(dir);
	if (size < 1024 * 1024) {
		return (size / 1024).toFixed(2) + ' KB';
	}
	return (size / 1024 / 1024).toFixed(2) + ' MB';
};

export let cleanCache = async () => {
	let dir = path.join(globalCacheDir);
	fs.rmSync(dir, {recursive: true, force: true});
};