// @ts-nocheck
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import tar from 'tar';
import {program} from 'commander';
import prompts from 'prompts';
import {Octokit} from 'octokit';
import chalk from 'chalk';
import fetch from 'node-fetch';

if (process.platform == 'win32') {
	console.log('Windows is not supported. Please use WSL');
	process.exit(1);
}

let zshrc = path.join(os.homedir(), '.zshrc');
let bashrc = path.join(os.homedir(), '.bashrc');
let cacheDir = path.join(os.homedir(), '.cache/mocv');
let curVersionFile = path.join(cacheDir, 'versions/current/version.txt');
let tmpDir = path.join(cacheDir, '.tmp');
let file = path.join(tmpDir, 'moc.tar.gz');

let download = async (version: string, {silent = false} = {}) => {
	if (!version) {
		console.log('version is not defined');
		process.exit(1);
	}
	if (isCached(version)) {
		return;
	}


	let url;
	if (parseInt(version.replaceAll('.', '')) >= parseInt('0.9.5'.replaceAll('.', ''))) {
		let platfrom = process.platform == 'darwin' ? 'Darwin' : 'Linux';
		let arch = process.arch.startsWith('arm') ? 'arm64' : 'x86_64';
		// currently only x64 binaries are available
		arch = 'x86_64';
		url = `https://github.com/dfinity/motoko/releases/download/${version}/motoko-${platfrom}-${arch}-${version}.tar.gz`;
	}
	else {
		let platfrom = process.platform == 'darwin' ? 'macos' : 'linux64';
		url = `https://github.com/dfinity/motoko/releases/download/${version}/motoko-${platfrom}-${version}.tar.gz`;
	}

	silent || console.log(`Downloading ${url}`);

	let res = await fetch(url);

	if (res.status !== 200) {
		console.log(`ERR ${res.status} ${url}`);
		console.log(`moc version '${version}' not found`);
		process.exit(1);
	}

	let arrayBuffer = await res.arrayBuffer();
	let buffer = Buffer.from(arrayBuffer);

	fs.mkdirSync(tmpDir, {recursive: true});
	fs.writeFileSync(file, buffer);

	let verDir = path.join(cacheDir, 'versions', version);
	fs.mkdirSync(verDir, {recursive: true});
	await tar.extract({
		file,
		cwd: verDir,
	});

	fs.rmSync(file);
};

let isCached = (version: string) => {
	let dir = path.join(cacheDir, 'versions', version);
	return fs.existsSync(path.join(dir, 'moc'))
		&& fs.existsSync(path.join(dir, 'mo-doc'))
		&& fs.existsSync(path.join(dir, 'mo-ide'));
};

let setCurrent = (version: string) => {
	fs.copySync(path.join(cacheDir, 'versions', version), path.join(cacheDir, 'versions/current'), {recursive: true});
	fs.writeFileSync(curVersionFile, version);
};

let getCurrent = () => {
	if (fs.existsSync(curVersionFile)) {
		return fs.readFileSync(curVersionFile).toString();
	}
};

let getLatest = async () => {
	let releases = await getReleases();
	return releases[0].tag_name;
};

let getReleases = async () => {
	let octokit = new Octokit;
	let res = await octokit.request('GET /repos/dfinity/motoko/releases', {
		per_page: 10,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});
	if (res.status !== 200) {
		console.log('Releases fetch error');
		process.exit(1);
	}
	return res.data;
};

let use = async (version: string) => {
	if (version === 'latest') {
		version = await getLatest();
	}
	await download(version);
	setCurrent(version);
	console.log(`Selected moc ${version}`);

	// update github env
	if (process.env.GITHUB_ENV) {
		fs.appendFileSync(process.env.GITHUB_ENV, `DFX_MOC_PATH=${path.join(cacheDir, 'versions', version)}/moc\n`);
	}
};

program.name('mocv')
	.action(async (_, config) => {
		if (config.args.length) {
			console.log(`unknown command '${config.args.join(' ')}'`);
			process.exit(1);
		}
		let releases = await getReleases();
		let versions = releases.map((item: {tag_name: any;}) => item.tag_name);
		let current = getCurrent();
		let currentIndex = versions.indexOf(current);

		let res = await prompts({
			type: 'select',
			name: 'version',
			message: 'Select moc version',
			choices: releases.map((release: {published_at: string | number | Date; tag_name: string;}, i: any) => {
				let date = new Date(release.published_at).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'});
				return {
					title: release.tag_name + chalk.gray(`  ${date}${currentIndex === i ? chalk.italic(' (current)') : ''}`),
					value: release.tag_name,
				};
			}),
			initial: currentIndex == -1 ? 0 : currentIndex,
		});

		if (!res.version) {
			return;
		}

		await use(res.version);
	});

let updateShellConfig = async ({reset = false, yes = false} = {}) => {
	let setDfxMocPath = reset || yes;
	let updatePath = reset || yes;

	if (!setDfxMocPath) {
		let res = await prompts({
			type: 'select',
			name: 'setDfxMocPath',
			message: 'Do you want to set DFX_MOC_PATH, so `dfx` will use the current `moc` version?',
			choices: [
				{
					title: 'Yes',
					value: true,
				},
				{
					title: 'No',
					value: false,
				},
			],
		});
		setDfxMocPath = res.setDfxMocPath;
	}

	if (!updatePath) {
		let res = await prompts({
			type: 'select',
			name: 'updatePath',
			message: 'Do you want to update PATH, so you can call `moc`, `mo-doc` and `mo-ide` from the terminal?',
			choices: [
				{
					title: 'Yes',
					value: true,
				},
				{
					title: 'No',
					value: false,
				},
			],
		});
		updatePath = res.updatePath;
	}

	if (!setDfxMocPath && !updatePath) {
		console.log('Nothing to do');
		return;
	}

	let configFiles = [];
	if (reset || yes) {
		configFiles = [bashrc, zshrc];
	}
	else {
		let {configFile} = await prompts({
			type: 'select',
			name: 'configFile',
			message: 'Select your shell config file',
			choices: [
				{
					title: bashrc,
					value: bashrc,
				},
				{
					title: zshrc,
					value: zshrc,
				},
			],
		});
		configFiles = [configFile];
	}

	for (let configFile of configFiles) {
		if (!fs.existsSync(configFile)) {
			console.log(`${configFile} not found`);
			process.exit(1);
		}

		let data = fs.readFileSync(configFile).toString();
		let setDfxLine = '\nexport DFX_MOC_PATH="$HOME/.cache/mocv/versions/current/moc"';
		let updatePathLine = '\nPATH="$HOME/.cache/mocv/versions/current:$PATH"';

		let newLines = [];
		setDfxMocPath && newLines.push(setDfxLine);
		updatePath && newLines.push(updatePathLine);

		let oldLines = [
			`\nexport DFX_MOC_PATH=${path.join(cacheDir, 'versions/current')}/moc\n`,
			setDfxLine,
			updatePathLine,
		];
		for (let oldLine of oldLines) {
			data = data.replace(oldLine, '');
		}

		if (data.endsWith('\n\n')) {
			data = data.trimEnd() + '\n';
		}

		if (!reset) {
			if (!data.endsWith('\n')) {
				data += '\n';
			}
			for (let newLine of newLines) {
				data += newLine;
			}
			data += '\n';
		}

		fs.writeFileSync(configFile, data);
	}

	console.log('Success!');
	// console.log(`Run "source ${configFile}" to apply changes`);
	console.log('Restart terminal to apply changes');
};

program.command('init')
	.description('mocv one time initialization')
	.option('-y, --yes', 'Skip prompts')
	.action(async (options) => {
		updateShellConfig(options);
	});

program.command('reset')
	.description('Reset changes made by `mocv init`')
	.action(async () => {
		updateShellConfig({reset: true});
	});

program.command('use <version>')
	.description('Set current moc version.\nExample 1: "mocv use 0.8.4"\nExample 2: "mocv use latest"')
	.action(async (version) => {
		await use(version);
	});

program.command('current')
	.description('Print current moc version')
	.action(async () => {
		console.log(getCurrent());
	});

program.command('bin [version]')
	.description('Print bin directory')
	.action(async (version = getCurrent()) => {
		if (version === 'latest') {
			version = await getLatest();
		}
		if (!version) {
			console.log('No version selected. Please pass a version arg or run `mocv` or `mocv use <version>`');
			process.exit(1);
		}
		if (!isCached(version)) {
			await download(version, {silent: true});
		}
		console.log(path.join(cacheDir, 'versions', version));
	});

program.parse();