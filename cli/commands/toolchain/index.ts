import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {execSync} from 'node:child_process';
import chalk from 'chalk';
import {getClosestConfigFile, globalCacheDir, readConfig, writeConfig} from '../../mops.js';
import {Tool} from '../../types.js';
import * as moc from './moc.js';
import * as pocketIc from './pocket-ic.js';
import * as wasmtime from './wasmtime.js';
import {getLatestReleaseTag} from './toolchain-utils.js';

function getToolUtils(tool: Tool) {
	if (tool === 'moc') {
		return moc;
	}
	else if (tool === 'pocket-ic') {
		return pocketIc;
	}
	else if (tool === 'wasmtime') {
		return wasmtime;
	}
	else {
		console.error(`Unknown tool '${tool}'`);
		process.exit(1);
	}
}

async function ensureToolchainInited() {
	// auto init in CI
	if (process.env.CI) {
		await init();
		return true;
	}
	try {
		let res = execSync('which moc-wrapper').toString().trim();
		if (res) {
			return true;
		}
	}
	catch {}
	console.error('Toolchain management is not initialized. Run "mops toolchain init"');
	process.exit(1);
}

// update shell config files to set DFX_MOC_PATH to moc-wrapper
async function init({reset = false} = {}) {
	if (process.platform == 'win32') {
		console.error('Windows is not supported. Please use WSL');
		process.exit(1);
	}

	try {
		let res = execSync('which mocv').toString().trim();
		if (res) {
			console.error('Mops is not compatible with mocv. Please uninstall mocv and try again.');
			console.log('Steps to uninstall mocv:');
			console.log('1. Run "mocv reset"');
			console.log('2. Run "npm uninstall -g mocv"');
			process.exit(1);
		}
	}
	catch {}

	let zshrc = path.join(os.homedir(), '.zshrc');
	let bashrc = path.join(os.homedir(), '.bashrc');

	let shellConfigFiles = [bashrc, zshrc, process.env.GITHUB_ENV || ''].map(x => x).filter((file) => {
		return fs.existsSync(file);
	});

	if (shellConfigFiles.length === 0) {
		console.error('Shell config files not found: ".bashrc" or ".zshrc"');
		process.exit(1);
	}

	// update all existing shell config files
	for (let shellConfigFile of shellConfigFiles) {
		let text = fs.readFileSync(shellConfigFile).toString();
		let setDfxLine = '\nexport DFX_MOC_PATH="moc-wrapper"';

		let newLines = [
			setDfxLine,
		];

		let oldLines = [
			// legacy mocv lines
			`\nexport DFX_MOC_PATH=${path.join(path.join(os.homedir(), '.cache/mocv'), 'versions/current')}/moc`,
			'\nexport DFX_MOC_PATH="$HOME/.cache/mocv/versions/current/moc"',
			// new
			setDfxLine,
		];

		// remove old lines
		for (let oldLine of oldLines) {
			text = text.replace(oldLine, '');
		}

		if (text.endsWith('\n\n')) {
			text = text.trimEnd() + '\n';
		}

		// insert new lines
		if (!reset) {
			if (!text.endsWith('\n')) {
				text += '\n';
			}
			for (let newLine of newLines) {
				text += newLine;
			}
			text += '\n';
		}

		fs.writeFileSync(shellConfigFile, text);
	}

	console.log(chalk.green('Success!'));
	console.log('Restart terminal to apply changes');
}

async function download(tool: Tool, version: string) {
	if (tool === 'moc') {
		await moc.download(version);
	}
}

async function downloadAll() {
	let config = readConfig();
	if (config.toolchain?.moc) {
		await download('moc', config.toolchain.moc);
	}
	if (config.toolchain?.wasmtime) {
		await download('wasmtime', config.toolchain.wasmtime);
	}
	if (config.toolchain?.['pocket-ic']) {
		await download('pocket-ic', config.toolchain['pocket-ic']);
	}
}

// download binary and set version in mops.toml
async function use(tool: Tool, version: string) {
	if (tool === 'moc') {
		await ensureToolchainInited();
	}

	await download(tool, version);

	let config = readConfig();
	config.toolchain = config.toolchain || {};
	config.toolchain[tool] = version;
	writeConfig(config);

	console.log(chalk.green(`Installed ${tool} ${version}`));
}

// download latest binary and set version in mops.toml
async function update(tool: Tool) {
	if (tool === 'moc') {
		await ensureToolchainInited();
	}

	let toolUtils = getToolUtils(tool);
	let version = await getLatestReleaseTag(toolUtils.repo);

	await download(tool, version);

	let config = readConfig();
	config.toolchain = config.toolchain || {};
	config.toolchain[tool] = version;
	writeConfig(config);

	console.log(chalk.green(`Installed ${tool} ${version}`));
}

// return current version from mops.toml
async function bin(tool: Tool) {
	let hasConfig = getClosestConfigFile();

	// fallback to dfx moc
	if (!hasConfig) {
		console.log(execSync('dfx cache show').toString().trim() + '/moc');
		return;
	}

	let config = readConfig();
	let version = config.toolchain?.[tool];

	if (!version) {
		// fallback to dfx moc
		if (tool === 'moc') {
			console.log(execSync('dfx cache show').toString().trim() + '/moc');
			return;
		}
		console.error(`Tool '${tool}' is not defined in [toolchain] section in mops.toml`);
		process.exit(1);
	}

	if (version) {
		if (tool === 'moc') {
			await ensureToolchainInited();
		}

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
	init,
	use,
	update,
	bin,
	downloadAll,
};