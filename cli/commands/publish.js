import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import logUpdate from 'log-update';
import {globbySync} from 'globby';
import minimatch from 'minimatch';
import prompts from 'prompts';
import {checkConfigFile, getRootDir, mainActor, progressBar, readConfig} from '../mops.js';
import {parallel} from '../parallel.js';
import {docs} from './docs.js';

export async function publish({noDocs} = {}) {
	if (!checkConfigFile()) {
		return;
	}

	let rootDir = getRootDir();
	let config = readConfig();

	// validate
	for (let key of Object.keys(config)) {
		if (!['package', 'dependencies', 'dev-dependencies', 'scripts'].includes(key)) {
			console.log(chalk.red('Error: ') + `Unknown config section [${key}]`);
			return;
		}
	}

	// required fields
	if (!config.package) {
		console.log(chalk.red('Error: ') + 'Please specify [package] section in your mops.toml');
		return;
	}
	for (let key of ['name', 'version']) {
		if (!config.package[key]) {
			console.log(chalk.red('Error: ') + `Please specify "${key}" in [config] section in your mops.toml`);
			return;
		}
	}

	// desired fields
	for (let key of ['description', 'repository']) {
		if (!config.package[key]) {
			let res = await prompts({
				type: 'confirm',
				name: 'ok',
				message: `Missing recommended config key "${key}", publish anyway?`,
			});
			if (!res.ok) {
				return;
			}
		}
	}

	let packageKeys = [
		'name',
		'version',
		'keywords',
		'description',
		'repository',
		'documentation',
		'homepage',
		'baseDir',
		'readme',
		'license',
		'files',
		'dfx',
		'moc',
		'donation',
	];
	for (let key of Object.keys(config.package)) {
		if (!packageKeys.includes(key)) {
			console.log(chalk.red('Error: ') + `Unknown config key 'package.${key}'`);
			return;
		}
	}

	// check lengths
	let keysMax = {
		name: 50,
		version: 20,
		keywords: 5,
		description: 200,
		repository: 300,
		documentation: 300,
		homepage: 300,
		readme: 100,
		license: 30,
		files: 20,
		dfx: 10,
		moc: 10,
		donation: 64,
		root: 50,
	};

	for (let [key, max] of Object.entries(keysMax)) {
		if (config.package[key] && config.package[key].length > max) {
			console.log(chalk.red('Error: ') + `package.${key} value max length is ${max}`);
			return;
		}
	}

	if (config.dependencies) {
		if (Object.keys(config.dependencies).length > 100) {
			console.log(chalk.red('Error: ') + 'max dependencies is 100');
			return;
		}

		for (let dep of Object.values(config.dependencies)) {
			if (dep.path) {
				console.log(chalk.red('Error: ') + 'you can\'t publish packages with local dependencies');
				return;
			}
			delete dep.path;
		}
	}

	if (config['dev-dependencies']) {
		if (Object.keys(config['dev-dependencies']).length > 100) {
			console.log(chalk.red('Error: ') + 'max dev-dependencies is 100');
			return;
		}

		for (let dep of Object.values(config['dev-dependencies'])) {
			if (dep.path) {
				console.log(chalk.red('Error: ') + 'you can\'t publish packages with local dev-dependencies');
				return;
			}
			delete dep.path;
		}
	}

	if (config.package.keywords) {
		for (let keyword of config.package.keywords) {
			if (keyword.length > 20) {
				console.log(chalk.red('Error: ') + 'max keyword length is 20');
				return;
			}
		}
	}

	if (config.package.files) {
		for (let file of config.package.files) {
			if (file.startsWith('/') || file.startsWith('../')) {
				console.log(chalk.red('Error: ') + 'file path cannot start with \'/\' or \'../\'');
				return;
			}
		}
	}

	// map fields
	let backendPkgConfig = {
		name: config.package.name,
		version: config.package.version,
		keywords: config.package.keywords || [],
		description: config.package.description || '',
		repository: config.package.repository || '',
		homepage: config.package.homepage || '',
		documentation: config.package.documentation || '',
		baseDir: 'src',
		readme: 'README.md',
		license: config.package.license || '',
		dfx: config.package.dfx || '',
		moc: config.package.moc || '',
		donation: config.package.donation || '',
		dependencies: Object.values(config.dependencies || {}),
		devDependencies: Object.values(config['dev-dependencies'] || {}),
		scripts: [],
	};

	let defaultFiles = [
		'mops.toml',
		'README.md',
		'LICENSE',
		'!.mops/**',
		'!test/**',
		'!**/*.test.mo',
	];
	let files = config.package.files || ['**/*.mo'];
	files = [...files, ...defaultFiles];
	files = globbySync([...files, ...defaultFiles]);

	// generate docs
	let docsFile = path.join(rootDir, '.mops/_docs/docs.tgz');
	if (!noDocs) {
		await docs({silent: true});
		if (fs.existsSync(docsFile)) {
			files.unshift(docsFile);
		}
	}

	// check required files
	if (!files.includes('mops.toml')) {
		console.log(chalk.red('Error: ') + ' please add mops.toml file');
		return;
	}
	if (!files.includes('README.md')) {
		console.log(chalk.red('Error: ') + ' please add README.md file');
		return;
	}

	// check allowed exts
	for (let file of files) {
		if (!minimatch(file, '**/*.{mo,did,md,toml}') && !file.toLowerCase().endsWith('license') && file !== docsFile) {
			console.log(chalk.red('Error: ') + `file ${file} has unsupported extension. Allowed: .mo, .did, .md, .toml`);
			return;
		}
	}

	// progress
	let total = files.length + 2;
	let step = 0;
	function progress() {
		step++;
		logUpdate(`Publishing ${config.package.name}@${config.package.version} ${progressBar(step, total)}`);
	}

	// upload config
	let actor = await mainActor(true);

	progress();
	let publishing = await actor.startPublish(backendPkgConfig);
	if (publishing.err) {
		console.log(chalk.red('Error: ') + publishing.err);
		return;
	}
	let puiblishingId = publishing.ok;

	// upload files
	await parallel(8, files, async (file) => {
		progress();

		let chunkSize = 1024 * 1024 + 512 * 1024; // 1.5mb
		let content = fs.readFileSync(file);
		let chunkCount = Math.ceil(content.length / chunkSize);
		let firstChunk = Array.from(content.slice(0, chunkSize));

		// remove path from docs file
		if (file === docsFile) {
			file = path.basename(file);
		}

		let res = await actor.startFileUpload(puiblishingId, file, chunkCount, firstChunk);
		if (res.err) {
			console.log(chalk.red('Error: ') + res.err);
			return;
		}
		let fileId = res.ok;

		for (let i = 1; i < chunkCount; i++) {
			let start = i * chunkSize;
			let chunk = Array.from(content.slice(start, start + chunkSize));
			let res = await actor.uploadFileChunk(puiblishingId, fileId, i, chunk);
			if (res.err) {
				console.log(chalk.red('Error: ') + res.err);
				return;
			}
		}
	});

	// finish
	progress();
	let res = await actor.finishPublish(puiblishingId);
	if (res.err) {
		console.log(chalk.red('Error: ') + res.err);
		return;
	}

	console.log(chalk.green('Published ') + `${config.package.name}@${config.package.version}`);
}