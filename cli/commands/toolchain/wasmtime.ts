import path from 'node:path';
import fs from 'fs-extra';

import {globalCacheDir} from '../../mops.js';
import {downloadAndExtract} from './toolchain-utils.js';

let cacheDir = path.join(globalCacheDir, 'wasmtime');

export let repo = 'bytecodealliance/wasmtime';

export let isCached = (version: string) => {
	let dir = path.join(cacheDir, version);
	return fs.existsSync(dir) && fs.existsSync(path.join(dir, 'wasmtime'));
};

export let download = async (version: string, {silent = false} = {}) => {
	if (!version) {
		console.error('version is not defined');
		process.exit(1);
	}
	if (isCached(version)) {
		return;
	}

	let platfrom = process.platform == 'darwin' ? 'macos' : 'linux';
	let arch = process.arch.startsWith('arm') ? 'aarch64' : 'x86_64';
	let url = `https://github.com/bytecodealliance/wasmtime/releases/download/v${version}/wasmtime-v${version}-${arch}-${platfrom}.tar.xz`;

	silent || console.log(`Downloading ${url}`);

	await downloadAndExtract(url, path.join(cacheDir, version));
};