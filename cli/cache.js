import fs from 'fs';
import path from 'path';
import ncp from 'ncp';
import getFolderSize from 'get-folder-size';

import {globalCacheDir} from './mops.js';

export let isCached = (pkgId) => {
	let dir = path.join(globalCacheDir, 'packages', pkgId);
	return fs.existsSync(dir);
};

export let addCache = (pkgId, source) => {
	let dest = path.join(globalCacheDir, 'packages', pkgId);
	fs.mkdirSync(dest, {recursive: true});

	return new Promise((resolve, reject) => {
		ncp.ncp(source, dest, {stopOnErr: true}, (err) => {
			if (err) {
				reject(err[0]);
			}
			resolve();
		});
	});
};

export let copyCache = (pkgId, dest) => {
	let source = path.join(globalCacheDir, 'packages', pkgId);
	fs.mkdirSync(dest, {recursive: true});

	return new Promise((resolve, reject) => {
		ncp.ncp(source, dest, {stopOnErr: true}, (err) => {
			if (err) {
				reject(err);
			}
			resolve();
		});
	});
};

export let cacheSize = async () => {
	let dir = path.join(globalCacheDir, 'packages');
	fs.mkdirSync(dir, {recursive: true});

	let size = await getFolderSize.strict(dir);
	if (size < 1024 * 1024) {
		return (size / 1024).toFixed(2) + ' KB';
	}
	return (size / 1024 / 1024).toFixed(2) + ' MB';
};

export let cleanCache = async () => {
	let dir = path.join(globalCacheDir, 'packages');
	fs.rmSync(dir, {recursive: true, force: true});
};