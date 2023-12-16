import path from 'node:path';
import {execSync} from 'node:child_process';
import {getClosestConfigFile, globalCacheDir, readConfig, writeConfig} from '../../mops.js';
import * as moc from './moc.js';
import {Tool} from '../../types.js';

async function download(tool: Tool, version: string) {
	if (tool === 'moc') {
		await moc.download(version);
	}
}

// async function downloadAll() {
// 	let config = readConfig();
// 	if (config.toolchain?.moc) {
// 		await download('moc', config.toolchain.moc);
// 	}
// 	if (config.toolchain?.wasmtime) {
// 		await download('wasmtime', config.toolchain.wasmtime);
// 	}
// 	if (config.toolchain?.['pocket-ic']) {
// 		await download('pocket-ic', config.toolchain['pocket-ic']);
// 	}
// }

async function use(tool: Tool, version: string) {
	await download(tool, version);

	let config = readConfig();
	config.toolchain = config.toolchain || {};
	config.toolchain[tool] = version;
	writeConfig(config);
}

async function bin(tool: Tool) {
	let hasConfig = getClosestConfigFile();

	if (!hasConfig) {
		console.log(execSync('dfx cache show').toString().trim() + '/moc');
		return;
	}

	let config = readConfig();
	let version = config.toolchain?.[tool];

	if (!version) {
		if (tool === 'moc') {
			console.log(execSync('dfx --version').toString().trim());
			return;
		}
		console.error(`Toolchain '${tool}' is not defined in mops.toml`);
		process.exit(1);
	}

	if (version) {
		await download(tool, version);

		if (tool === 'moc') {
			console.log(path.join(globalCacheDir, 'moc', version, 'moc'));
		}
		else {
			console.log(path.join(globalCacheDir, tool, version, 'moc'));
		}
	}
}

export let toolchain = {
	bin,
	use,
};