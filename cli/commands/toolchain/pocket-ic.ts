import path from 'node:path';
import fs from 'node:fs';

import {globalCacheDir} from '../../mops.js';
import * as toolchainUtils from './toolchain-utils.js';

let cacheDir = path.join(globalCacheDir, 'pocket-ic');

export let repo = 'dfinity/pocketic';

export let getLatestReleaseTag = async () => {
	return '1.0.0';
	// return toolchainUtils.getLatestReleaseTag(repo);
};

export let getReleases = async () => {
	// return toolchainUtils.getReleases(repo);
	return [
		{
			tag_name: '2.0.1',
			published_at: new Date('2023-11-23'),
			draft: false,
		},
		{
			tag_name: '2.0.0',
			published_at: new Date('2023-11-21'),
			draft: false,
		},
		{
			tag_name: '1.0.0',
			published_at: new Date('2023-10-12'),
			draft: false,
		},
	];
};

export let isCached = (version: string) => {
	let dir = path.join(cacheDir, version);
	return fs.existsSync(dir) && fs.existsSync(path.join(dir, 'pocket-ic'));
};

export let download = async (version: string, {silent = false, verbose = false} = {}) => {
	if (!version) {
		console.error('version is not defined');
		process.exit(1);
	}
	if (isCached(version)) {
		if (verbose) {
			console.log(`pocket-ic ${version} is already installed`);
		}
		return;
	}

	let platfrom = process.platform == 'darwin' ? 'darwin' : 'linux';
	let arch = 'x86_64';

	let hashes: Record<string, string> = {
		'2.0.1': '69e1408347723dbaa7a6cd2faa9b65c42abbe861',
		'2.0.0': '29ec86dc9f9ca4691d4d4386c8b2aa41e14d9d16',
		'1.0.0': '307d5847c1d2fe1f5e19181c7d0fcec23f4658b3',
	};

	let url = `https://download.dfinity.systems/ic/${hashes[version]}/openssl-static-binaries/${arch}-${platfrom}/pocket-ic.gz`;

	if (verbose && !silent) {
		console.log(`Downloading ${url}`);
	}

	await toolchainUtils.downloadAndExtract(url, path.join(cacheDir, version));
};