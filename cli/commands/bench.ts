import {execSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import chalk from 'chalk';
import {globSync} from 'glob';
import {markdownTable} from 'markdown-table';
import logUpdate from 'log-update';
import {execaCommand} from 'execa';
import {PocketIc} from '@hadronous/pic';

import {getRootDir} from '../mops.js';
import {parallel} from '../parallel.js';
import {absToRel} from './test/utils.js';
import {getMocVersion} from '../helpers/get-moc-version.js';
import {getDfxVersion} from '../helpers/get-dfx-version.js';
import {getMocPath} from '../helpers/get-moc-path.js';
import {sources} from './sources.js';

import {createActor, idlFactory} from '../declarations/bench/index.js';
import {BenchResult, BenchSchema, _SERVICE} from '../declarations/bench/bench.did.js';

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

type BenchOptions = {
	dfx?: string,
	moc?: string,
	gc?: 'copying' | 'compacting' | 'generational' | 'incremental',
	forceGc?: boolean,
	save?: boolean,
	compare?: boolean,
	verbose?: boolean,
};

class Replica {
	type = 'dfx';
	verbose = false;
	canisters: Record<string, {cwd: string, canisterId: string, actor: any}> = {};
	pocketIc?: PocketIc;

	constructor(type: 'dfx' | 'pocket-ic', verbose = false) {
		this.type = type;
		this.verbose = verbose;
	}

	async start() {
		if (this.type == 'dfx') {
			await this.stop();
			await startDfx(this.verbose);
		}
		else {
			this.pocketIc = await PocketIc.create();
		}
	}

	async stop() {
		if (this.type == 'dfx') {
			stopDfx(this.verbose);
		}
		else if (this.pocketIc) {
			this.pocketIc.tearDown();
		}
	}

	async deploy(name: string, wasm: string, cwd: string = process.cwd()) {
		if (this.type === 'dfx') {
			await execaCommand(`dfx deploy ${name} --mode reinstall --yes --identity anonymous`, {cwd, stdio: this.verbose ? 'pipe' : ['pipe', 'ignore', 'pipe']});
			let canisterId = execSync(`dfx canister id ${name}`, {cwd}).toString().trim();
			let actor = await createActor(canisterId, {
				agentOptions: {
					host: 'http://127.0.0.1:4944',
				},
			});
			this.canisters[name] = {cwd, canisterId, actor};
		}
		else if (this.pocketIc) {
			let {canisterId, actor} = await this.pocketIc.setupCanister(idlFactory, wasm);
			this.canisters[name] = {
				cwd,
				canisterId: canisterId.toText(),
				actor,
			};
		}
	}

	getActor(name: string): unknown {
		return this.canisters[name]?.actor;
	}

	getCanisterId(name: string): string {
		return this.canisters[name]?.canisterId || '';
	}
}

export async function bench(filter = '', options: BenchOptions = {}): Promise<boolean> {
	let defaultOptions: BenchOptions = {
		moc: getMocVersion(),
		dfx: getDfxVersion(),
		gc: 'incremental',
		forceGc: true,
		save: false,
		compare: false,
		verbose: false,
	};

	options = {...defaultOptions, ...options};

	options.verbose && console.log(options);

	let replica = new Replica('pocket-ic', options.verbose);

	let rootDir = getRootDir();
	let globStr = '**/bench?(mark)/**/*.bench.mo';
	if (filter) {
		globStr = `**/bench?(mark)/**/*${filter}*.mo`;
	}
	let files = globSync(path.join(rootDir, globStr), globConfig);
	if (!files.length) {
		if (filter) {
			console.log(`No benchmark files found for filter '${filter}'`);
			return false;
		}
		console.log('No *.bench.mo files found');
		console.log('Put your benchmark code in \'bench\' directory in *.bench.mo files');
		return false;
	}

	files.sort();

	let benchDir = `${getRootDir()}/.mops/.bench/`;
	fs.rmSync(benchDir, {recursive: true, force: true});
	fs.mkdirSync(benchDir, {recursive: true});

	console.log('Benchmark files:');
	for (let file of files) {
		console.log(chalk.gray(`• ${absToRel(file)}`));
	}
	console.log('');
	console.log('='.repeat(50));
	console.log('');

	console.log('Starting dfx replica...');
	await replica.start();
	// startDfx(options.verbose);

	console.log('Deploying canisters...');
	await parallel(os.cpus().length, files, async (file: string) => {
		try {
			await deployBenchFile(file, options, replica);
		}
		catch (err) {
			console.error('Unexpected error. Stopping dfx replica...');
			await replica.stop();
			// stopDfx(options.verbose);
			throw err;
		}
	});

	await parallel(1, files, async (file: string) => {
		console.log('\n' + '—'.repeat(50));
		console.log(`\nRunning ${chalk.gray(absToRel(file))}...`);
		console.log('');
		try {
			await runBenchFile(file, options, replica);
		}
		catch (err) {
			console.error('Unexpected error. Stopping dfx replica...');
			await replica.stop();
			// stopDfx(options.verbose);
			throw err;
		}
	});

	console.log('Stopping dfx replica...');
	await replica.stop();
	// stopDfx(options.verbose);

	fs.rmSync(benchDir, {recursive: true, force: true});

	return true;
}

function getMocArgs(options: BenchOptions): string {
	let args = '';
	if (options.forceGc) {
		args += ' --force-gc';
	}
	if (options.gc) {
		args += ` --${options.gc}-gc`;
	}
	return args;
}

function dfxJson(canisterName: string, options: BenchOptions = {}) {
	options || console.log(options);

	let canisters: Record<string, any> = {};
	if (canisterName) {
		canisters[canisterName] = {
			type: 'custom',
			wasm: 'canister.wasm',
			candid: 'canister.did',
		};
	}

	return {
		version: 1,
		canisters,
		defaults: {
			build: {
				packtool: 'mops sources',
			},
		},
		networks: {
			local: {
				type: 'ephemeral',
				bind: '127.0.0.1:4944',
			},
		},
	};
}

function startDfx(verbose = false) {
	// stopDfx(verbose);
	let dir = path.join(getRootDir(), '.mops/.bench');
	fs.writeFileSync(path.join(dir, 'dfx.json'), JSON.stringify(dfxJson(''), null, 2));
	execSync('dfx start --background --clean --artificial-delay 0' + (verbose ? '' : ' -qqqq'), {cwd: dir, stdio: ['inherit', verbose ? 'inherit' : 'ignore', 'inherit']});
}

function stopDfx(verbose = false) {
	let dir = path.join(getRootDir(), '.mops/.bench');
	execSync('dfx stop' + (verbose ? '' : ' -qqqq'), {cwd: dir, stdio: ['pipe', verbose ? 'inherit' : 'ignore', 'pipe']});
}

async function deployBenchFile(file: string, options: BenchOptions = {}, replica: Replica): Promise<void> {
	let rootDir = getRootDir();
	let tempDir = path.join(rootDir, '.mops/.bench/', path.parse(file).name);
	let canisterName = path.parse(file).name;

	// prepare temp files
	fs.mkdirSync(tempDir, {recursive: true});
	fs.writeFileSync(path.join(tempDir, 'dfx.json'), JSON.stringify(dfxJson(canisterName, options), null, 2));

	let benchCanisterData = fs.readFileSync(new URL('./bench/bench-canister.mo', import.meta.url), 'utf8');
	benchCanisterData = benchCanisterData.replace('./user-bench', path.relative(tempDir, file).replace(/.mo$/g, ''));
	fs.writeFileSync(path.join(tempDir, 'canister.mo'), benchCanisterData);

	// build canister
	let mocPath = getMocPath();
	let mocArgs = getMocArgs(options);
	options.verbose && console.time(`build ${canisterName}`);
	await execaCommand(`${mocPath} -c --idl canister.mo ${mocArgs} ${(await sources({cwd: tempDir})).join(' ')}`, {cwd: tempDir, stdio: options.verbose ? 'pipe' : ['pipe', 'ignore', 'pipe']});
	options.verbose && console.timeEnd(`build ${canisterName}`);

	// deploy canister
	let wasm = path.join(tempDir, 'canister.wasm');
	options.verbose && console.time(`deploy ${canisterName}`);
	// await execaCommand(`dfx deploy ${canisterName} --mode reinstall --yes --identity anonymous`, {cwd: tempDir, stdio: options.verbose ? 'pipe' : ['pipe', 'ignore', 'pipe']});
	await replica.deploy(canisterName, wasm, tempDir);
	options.verbose && console.timeEnd(`deploy ${canisterName}`);

	// init bench
	options.verbose && console.time(`init ${canisterName}`);
	let actor = await replica.getActor(canisterName) as _SERVICE;
	await actor.init();
	options.verbose && console.timeEnd(`init ${canisterName}`);
}

type RunBenchFileResult = {
	schema: BenchSchema,
	results: Map<string, BenchResult>,
};

async function runBenchFile(file: string, options: BenchOptions = {}, replica: Replica): Promise<RunBenchFileResult> {
	let rootDir = getRootDir();
	let canisterName = path.parse(file).name;

	let actor = await replica.getActor(canisterName) as _SERVICE;
	let schema = await actor.getSchema();

	// load previous results
	let prevResults: Map<string, BenchResult> | undefined;
	let resultsJsonFile = path.join(rootDir, '.bench', `${path.parse(file).name}.json`);
	if (options.compare) {
		if (fs.existsSync(resultsJsonFile)) {
			let prevResultsJson = JSON.parse(fs.readFileSync(resultsJsonFile).toString());
			prevResults = new Map(prevResultsJson.results);
		}
		else {
			console.log(chalk.yellow(`No previous results found "${resultsJsonFile}"`));
		}
	}

	let results = new Map<string, BenchResult>();

	let formatNumber = (n: bigint | number): string => {
		return n.toLocaleString('en-US').replaceAll(',', '_');
	};

	let getTable = (prop: keyof BenchResult): string => {
		let resArr = [['', ...schema.cols]];

		for (let [_rowIndex, row] of schema.rows.entries()) {
			let curRow = [row];

			for (let [_colIndex, col] of schema.cols.entries()) {
				let res = results.get(`${row}:${col}`);
				if (res) {

					// compare with previous results
					let diff = '';
					if (options.compare && prevResults) {
						let prevRes = prevResults.get(`${row}:${col}`);
						if (prevRes) {
							let percent = (Number(res[prop]) - Number(prevRes[prop])) / Number(prevRes[prop]) * 100;
							let sign = percent > 0 ? '+' : '';
							let percentText = percent == 0 ? '0%' : sign + percent.toFixed(2) + '%';
							// diff = ' (' + (percent > 0 ? chalk.red(percentText) : chalk.green(percentText)) + ')'; // alignment is broken
							diff = ' (' + percentText + ')';
						}
						else {
							diff = chalk.yellow(' (no previous results)');
						}
					}

					// add to table
					curRow.push(formatNumber(res[prop]) + diff);
				}
				else {
					curRow.push('');
				}
			}
			resArr.push(curRow);
		}

		return markdownTable(resArr, {align: ['l', ...'r'.repeat(schema.cols.length)]});
	};

	let printResults = () => {
		logUpdate(`
			\n${chalk.bold(schema.name)}
			${schema.description ? '\n' + chalk.gray(schema.description) : ''}
			\n\n${chalk.blue('Instructions')}\n\n${getTable('instructions')}
			\n\n${chalk.blue('Heap')}\n\n${getTable('rts_heap_size')}
		`);
	};

	printResults();

	// run all cells
	for (let [rowIndex, row] of schema.rows.entries()) {
		for (let [colIndex, col] of schema.cols.entries()) {
			// let res = await actor.runCellQuery(BigInt(rowIndex), BigInt(colIndex));
			// let res = await actor.runCellUpdate(BigInt(rowIndex), BigInt(colIndex));
			let res = await actor.runCellUpdateAwait(BigInt(rowIndex), BigInt(colIndex));
			results.set(`${row}:${col}`, res);
			printResults();
		}
	}
	logUpdate.done();

	// save results
	if (options.save) {
		console.log(`Saving results to ${chalk.gray(absToRel(resultsJsonFile))}`);
		let json: Record<any, any> = {
			version: 1,
			moc: options.moc,
			dfx: options.dfx,
			gc: options.gc,
			forceGc: options.forceGc,
			results: Array.from(results.entries()),
		};
		fs.mkdirSync(path.dirname(resultsJsonFile), {recursive: true});
		fs.writeFileSync(resultsJsonFile, JSON.stringify(json, (_, val) => {
			if (typeof val === 'bigint') {
				return Number(val);
			}
			else {
				return val;
			}
		}, 2));
	}

	return {schema, results};
}