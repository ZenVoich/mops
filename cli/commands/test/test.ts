import {spawn, execSync, ChildProcessWithoutNullStreams} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import chalk from 'chalk';
import {globSync} from 'glob';
import chokidar from 'chokidar';
import debounce from 'debounce';

import {sources} from '../sources.js';
import {getRootDir} from '../../mops.js';
import {parallel} from '../../parallel.js';

import {MMF1} from './mmf1.js';
import {absToRel} from './utils.js';
import {VerboseReporter} from './reporters/verbose-reporter.js';
import {FilesReporter} from './reporters/files-reporter.js';
import {CompactReporter} from './reporters/compact-reporter.js';
import {Reporter} from './reporters/reporter.js';

let ignore = [
	'**/node_modules/**',
	'**/.mops/**',
	'**/.vessel/**',
	'**/.git/**',
];

let globConfig = {
	nocase: true,
	ignore: ignore,
};

type TestMode = 'interpreter' | 'wasi';

export async function test(filter = '', {watch = false, reporter = 'verbose', mode = 'interpreter' as TestMode} = {}) {
	let rootDir = getRootDir();

	if (watch) {
		// todo: run only changed for *.test.mo?
		// todo: run all for *.mo?
		let run = debounce(async () => {
			console.clear();
			process.stdout.write('\x1Bc');
			await runAll(filter, reporter);
			console.log('-'.repeat(50));
			console.log('Waiting for file changes...');
			console.log(chalk.gray((`Press ${chalk.gray('Ctrl+C')} to exit.`)));
		}, 200);

		let watcher = chokidar.watch([
			path.join(rootDir, '**/*.mo'),
			path.join(rootDir, 'mops.toml'),
		], {
			ignored: ignore,
			ignoreInitial: true,
		});

		watcher.on('all', () => {
			run();
		});
		run();
	}
	else {
		let passed = await runAll(filter, reporter, mode);
		if (!passed) {
			process.exit(1);
		}
	}
}

let mocPath = process.env.DFX_MOC_PATH;

export async function runAll(filter = '', reporterName = 'verbose', mode: TestMode = 'interpreter') {
	let reporter: Reporter;
	if (reporterName == 'compact') {
		reporter = new CompactReporter;
	}
	else if (reporterName == 'files') {
		reporter = new FilesReporter;
	}
	else {
		reporter = new VerboseReporter;
	}

	let rootDir = getRootDir();
	let files: string[] = [];
	let libFiles = globSync('**/test?(s)/lib.mo', globConfig);
	if (libFiles[0]) {
		files = [libFiles[0]];
	}
	else {
		let globStr = '**/test?(s)/**/*.test.mo';
		if (filter) {
			globStr = `**/test?(s)/**/*${filter}*.mo`;
		}
		files = globSync(path.join(rootDir, globStr), globConfig);
	}
	if (!files.length) {
		if (filter) {
			console.log(`No test files found for filter '${filter}'`);
			return;
		}
		console.log('No test files found');
		console.log('Put your tests in \'test\' directory in *.test.mo files');
		return;
	}

	reporter.addFiles(files);

	let sourcesArr = await sources();

	if (!mocPath) {
		mocPath = execSync('dfx cache show').toString().trim() + '/moc';
	}

	let wasmDir = `${getRootDir()}/.mops/.test/`;
	fs.mkdirSync(wasmDir, {recursive: true});

	await parallel(os.cpus().length, files, async (file: string) => {
		let mmf = new MMF1('store');
		let wasiMode = mode === 'wasi' || fs.readFileSync(file, 'utf8').startsWith('// @testmode wasi');

		let promise = new Promise<void>((resolve) => {
			if (!mocPath) {
				mocPath = 'moc';
			}

			let mocArgs = ['--hide-warnings', '--error-detail=2', ...sourcesArr.join(' ').split(' '), file].filter(x => x);

			// build and run wasm
			if (wasiMode) {
				let wasmFile = `${path.join(wasmDir, path.parse(file).name)}.wasm`;

				// build
				let buildProc = spawn(mocPath, [`-o=${wasmFile}`, '-wasi-system-api', ...mocArgs]);
				pipeMMF(buildProc, mmf).then(async () => {
					if (mmf.failed > 0) {
						return;
					}
					// run
					let proc = spawn('wasmtime', [wasmFile]);
					await pipeMMF(proc, mmf);
				}).finally(() => {
					fs.rmSync(wasmFile, {force: true});
				}).then(resolve);
			}
			// interpret
			else {
				let proc = spawn(mocPath, ['-r', '-ref-system-api', ...mocArgs]);
				pipeMMF(proc, mmf).then(resolve);
			}
		});

		reporter.addRun(file, mmf, promise, wasiMode);

		await promise;
	});

	fs.rmSync(wasmDir, {recursive: true, force: true});
	return reporter.done();
}

function pipeMMF(proc: ChildProcessWithoutNullStreams, mmf: MMF1) {
	return new Promise<void>((resolve) => {
		// stdout
		proc.stdout.on('data', (data) => {
			for (let line of data.toString().split('\n')) {
				line = line.trim();
				if (line) {
					mmf.parseLine(line);
				}
			}
		});

		// stderr
		proc.stderr.on('data', (data) => {
			let text: string = data.toString().trim();
			let failedLine = '';
			text = text.replace(/([\w+._/-]+):(\d+).(\d+)(-\d+.\d+)/g, (_m0, m1: string, m2: string, m3: string) => {
				// change absolute file path to relative
				// change :line:col-line:col to :line:col to work in vscode
				let res = `${absToRel(m1)}:${m2}:${m3}`;

				if (!fs.existsSync(m1)) {
					return res;
				}

				// show failed line
				let content = fs.readFileSync(m1);
				let lines = content.toString().split('\n') || [];
				failedLine += chalk.dim('\n   ...');
				let lineBefore = lines[+m2 - 2];
				if (lineBefore) {
					failedLine += chalk.dim(`\n   ${+m2 - 1}\t| ${lineBefore.replaceAll('\t', '  ')}`);
				}
				failedLine += `\n${chalk.redBright`->`} ${m2}\t| ${lines[+m2 - 1]?.replaceAll('\t', '  ')}`;
				if (lines.length > +m2) {
					failedLine += chalk.dim(`\n   ${+m2 + 1}\t| ${lines[+m2]?.replaceAll('\t', '  ')}`);
				}
				failedLine += chalk.dim('\n   ...');
				return res;
			});
			if (failedLine) {
				text += failedLine;
			}
			mmf.fail(text);
		});

		// exit
		proc.on('close', (code) => {
			if (code === 0) {
				mmf.pass();
			}
			else if (code !== 1) {
				mmf.fail(`unknown exit code: ${code}`);
			}
			resolve();
		});
	});
}