import process from 'node:process';
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
import {Replica} from '../replica.js';
import {ActorMethod} from '@dfinity/agent';
import {PassThrough, Readable} from 'node:stream';
import {TestMode} from '../../types.js';

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

let replica = new Replica('pocket-ic');
let replicaStartPromise : Promise<void> | undefined;

async function startReplicaOnce(replica : Replica) {
	if (!replicaStartPromise) {
		replicaStartPromise = new Promise((resolve) => {
			replica.start({silent: true}).then(resolve);
		});
	}
	return replicaStartPromise;
}

export async function test(filter = '', {watch = false, reporter = 'verbose' as ReporterName, mode = 'interpreter' as TestMode} = {}) {
	let rootDir = getRootDir();

	if (watch) {
		let sigint = false;
		process.on('SIGINT', () => {
			if (sigint) {
				process.exit(0);
			}
			sigint = true;

			if (replicaStartPromise) {
				if (replica.type == 'dfx') {
					replica.stopSync();
				}
				process.exit(0);
			}
		});

		// todo: run only changed for *.test.mo?
		// todo: run all for *.mo?
		let run = debounce(async () => {
			console.clear();
			process.stdout.write('\x1Bc');
			await runAll(reporter, filter, mode, true);
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

export async function runAll(reporterName : ReporterName = 'verbose', filter = '', mode : TestMode = 'interpreter', watch = false) : Promise<boolean> {
	let reporter : Reporter;
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
	let done = await testWithReporter(reporter, filter, mode, watch);
	return done;
}

export async function testWithReporter(reporter : Reporter, filter = '', defaultMode : TestMode = 'interpreter', watch = false) : Promise<boolean> {
	let rootDir = getRootDir();
	let files : string[] = [];
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

	let testTempDir = path.join(getRootDir(), '.mops/.test/');
	replica.dir = testTempDir;

	fs.mkdirSync(testTempDir, {recursive: true});

	await parallel(os.cpus().length, files, async (file : string) => {
		let mmf = new MMF1('store', absToRel(file));

		// mode overrides
		let lines = fs.readFileSync(file, 'utf8').split('\n');
		let mode = defaultMode;
		if (lines.includes('// @testmode wasi')) {
			mode = 'wasi';
		}
		else if (lines.includes('actor {') || lines.includes('// @testmode replica')) {
			mode = 'replica';
		}

		if (mode === 'wasi' && !wasmtimePath) {
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

			// interpret
			if (mode === 'interpreter') {
				let proc = spawn(mocPath, ['-r', '-ref-system-api', ...mocArgs]);
				pipeMMF(proc, mmf).then(resolve);
			}
			// build and run wasm
			else if (mode === 'wasi') {
				let wasmFile = `${path.join(testTempDir, path.parse(file).name)}.wasm`;

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
							'-W', 'max-wasm-stack=4000000',
							'-W', 'nan-canonicalization=y',
							wasmFile,
						];
					}
					// backcompat
					else {
						wasmtimeArgs = [
							'--max-wasm-stack=4000000',
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
			// build and execute in replica
			else if (mode === 'replica') {
				let wasmFile = `${path.join(testTempDir, path.parse(file).name)}.wasm`;

				// build
				let buildProc = spawn(mocPath, [`-o=${wasmFile}`, ...mocArgs]);

				pipeMMF(buildProc, mmf).then(async () => {
					if (mmf.failed > 0) {
						return;
					}

					await startReplicaOnce(replica);

					let canisterName = path.parse(file).name;
					let idlFactory = ({IDL} : any) => {
						return IDL.Service({'runTests': IDL.Func([], [], [])});
					};
					interface _SERVICE {'runTests' : ActorMethod<[], undefined>;}

					let {stream} = await replica.deploy(canisterName, wasmFile, idlFactory);

					pipeStdoutToMMF(stream, mmf);

					let actor = await replica.getActor(canisterName) as _SERVICE;

					try {
						await actor.runTests();
						mmf.pass();
					}
					catch (e : any) {
						let stderrStream = new PassThrough();
						pipeStderrToMMF(stderrStream, mmf, path.dirname(file));
						stderrStream.write(e.message);
					}
				}).finally(async () => {
					fs.rmSync(wasmFile, {force: true});
				}).then(resolve);
			}
		});

		reporter.addRun(file, mmf, promise, mode);

		await promise;
	});

	fs.rmSync(testTempDir, {recursive: true, force: true});
	if (replicaStartPromise && !watch) {
		await replica.stop();
	}

	return reporter.done();
}

function pipeStdoutToMMF(stdout : Readable, mmf : MMF1) {
	stdout.on('data', (data) => {
		for (let line of data.toString().split('\n')) {
			line = line.trim();
			if (line) {
				mmf.parseLine(line);
			}
		}
	});
}

function pipeStderrToMMF(stderr : Readable, mmf : MMF1, dir = '') {
	stderr.on('data', (data) => {
		let text : string = data.toString().trim();
		let failedLine = '';

		text = text.replace(/([\w+._/-]+):(\d+).(\d+)(-\d+.\d+)/g, (_m0, m1 : string, m2 : string, m3 : string) => {
			// change absolute file path to relative
			// change :line:col-line:col to :line:col to work in vscode
			let res = `${absToRel(m1)}:${m2}:${m3}`;
			let file = path.join(dir, m1);

			if (!fs.existsSync(file)) {
				return res;
			}

			// show failed line
			let content = fs.readFileSync(file);
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
}

function pipeMMF(proc : ChildProcessWithoutNullStreams, mmf : MMF1) {
	return new Promise<void>((resolve) => {
		pipeStdoutToMMF(proc.stdout, mmf);
		pipeStderrToMMF(proc.stderr, mmf);

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