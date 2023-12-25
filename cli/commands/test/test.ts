import {spawn, ChildProcessWithoutNullStreams} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import chalk from 'chalk';
import {globSync} from 'glob';
import chokidar from 'chokidar';
import debounce from 'debounce';

import {sources} from '../sources.js';
import {getRootDir, readConfig} from '../../mops.js';
import {parallel} from '../../parallel.js';

import {MMF1} from './mmf1.js';
import {absToRel} from './utils.js';
import {Reporter} from './reporters/reporter.js';
import {VerboseReporter} from './reporters/verbose-reporter.js';
import {FilesReporter} from './reporters/files-reporter.js';
import {CompactReporter} from './reporters/compact-reporter.js';
import {SilentReporter} from './reporters/silent-reporter.js';
import {toolchain} from '../toolchain/index.js';

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

type ReporterName = 'verbose' | 'files' | 'compact' | 'silent';
type TestMode = 'interpreter' | 'wasi';

export async function test(filter = '', {watch = false, reporter = 'verbose' as ReporterName, mode = 'interpreter' as TestMode} = {}) {
	let rootDir = getRootDir();

	if (watch) {
		// todo: run only changed for *.test.mo?
		// todo: run all for *.mo?
		let run = debounce(async () => {
			console.clear();
			process.stdout.write('\x1Bc');
			await runAll(reporter, filter, mode);
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
		let passed = await runAll(reporter, filter, mode);
		if (!passed) {
			process.exit(1);
		}
	}
}

let mocPath = '';
let wasmtimePath = '';

export async function runAll(reporterName: ReporterName = 'verbose', filter = '', mode: TestMode = 'interpreter'): Promise<boolean> {
	let reporter: Reporter;
	if (reporterName == 'compact') {
		reporter = new CompactReporter;
	}
	else if (reporterName == 'files') {
		reporter = new FilesReporter;
	}
	else if (reporterName == 'silent') {
		reporter = new SilentReporter;
	}
	else {
		reporter = new VerboseReporter;
	}
	let done = await testWithReporter(reporter, filter, mode);
	return done;
}

export async function testWithReporter(reporter: Reporter, filter = '', mode: TestMode = 'interpreter'): Promise<boolean> {
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
			return false;
		}
		console.log('No test files found');
		console.log('Put your tests in \'test\' directory in *.test.mo files');
		return false;
	}

	reporter.addFiles(files);

	let config = readConfig();
	let sourcesArr = await sources();

	if (!mocPath) {
		mocPath = await toolchain.bin('moc', {fallback: true});
	}

	let wasmDir = `${getRootDir()}/.mops/.test/`;
	fs.mkdirSync(wasmDir, {recursive: true});

	await parallel(os.cpus().length, files, async (file: string) => {
		let mmf = new MMF1('store', absToRel(file));
		let wasiMode = mode === 'wasi' || fs.readFileSync(file, 'utf8').startsWith('// @testmode wasi');

		if (wasiMode && !wasmtimePath) {
			// ensure wasmtime is installed or specified in config
			if (config.toolchain?.wasmtime) {
				wasmtimePath = await toolchain.bin('wasmtime');
			}
			// fallback wasmtime to global binary if not specified in config (legacy)
			else {
				wasmtimePath = 'wasmtime';
				console.log(chalk.yellow('Warning:'), 'Wasmtime is not specified in config. Using global binary "wasmtime". This will be removed in the future.');
				console.log(`Run ${chalk.green('mops toolchain use wasmtime')} or add ${chalk.green('wasmtime = "<version>"')} in mops.toml to avoid breaking changes with future versions of mops.`);
			}
		}

		let promise = new Promise<void>((resolve) => {
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
					let wasmtimeArgs = [];
					if (config.toolchain?.wasmtime && config.toolchain?.wasmtime >= '14.0.0') {
						wasmtimeArgs = [
							'-S', 'preview2=n',
							'-C', 'cache=n',
							'-W', 'bulk-memory',
							'-W', 'multi-memory',
							'-W', 'max-wasm-stack=2000000',
							'-W', 'nan-canonicalization=y',
							wasmFile,
						];
					}
					else {
						wasmtimeArgs = [
							'--max-wasm-stack=2000000',
							'--enable-cranelift-nan-canonicalization',
							'--wasm-features',
							'multi-memory,bulk-memory',
							wasmFile,
						];
					}

					let proc = spawn(wasmtimePath, wasmtimeArgs);
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