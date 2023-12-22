import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import chalk from 'chalk';
import {globSync} from 'glob';
import {markdownTable} from 'markdown-table';
import logUpdate from 'log-update';
import {execaCommand} from 'execa';
import stringWidth from 'string-width';

import {getRootDir} from '../mops.js';
import {parallel} from '../parallel.js';
import {absToRel} from './test/utils.js';
import {getMocVersion} from '../helpers/get-moc-version.js';
import {getDfxVersion} from '../helpers/get-dfx-version.js';
import {getMocPath} from '../helpers/get-moc-path.js';
import {sources} from './sources.js';

import {BenchResult, BenchSchema, _SERVICE} from '../declarations/bench/bench.did.js';
import {BenchReplica} from './bench-replica.js';

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
	replica: 'dfx' | 'pocket-ic',
	replicaVersion: string,
	moc: string,
	gc: 'copying' | 'compacting' | 'generational' | 'incremental',
	forceGc: boolean,
	save: boolean,
	compare: boolean,
	verbose: boolean,
};

export async function bench(filter = '', optionsArg: Partial<BenchOptions> = {}): Promise<boolean> {
	let defaultOptions: BenchOptions = {
		replica: 'dfx',
		moc: getMocVersion(),
		replicaVersion: '0.0.0',
		gc: 'copying',
		forceGc: true,
		save: false,
		compare: false,
		verbose: false,
	};

	let options: BenchOptions = {...defaultOptions, ...optionsArg};

	options.replicaVersion = options.replica == 'dfx' ? getDfxVersion() : '1.0.0';

	options.verbose && console.log(options);

	let replica = new BenchReplica(options.replica, options.verbose);

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

	await replica.start();

	console.log('Deploying canisters...');
	await parallel(os.cpus().length, files, async (file: string) => {
		try {
			await deployBenchFile(file, options, replica);
		}
		catch (err) {
			console.error('Unexpected error. Stopping replica...');
			await replica.stop();
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
			console.error('Unexpected error. Stopping replica...');
			await replica.stop();
			throw err;
		}
	});

	console.log('Stopping replica...');
	await replica.stop();

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

async function deployBenchFile(file: string, options: BenchOptions, replica: BenchReplica): Promise<void> {
	let rootDir = getRootDir();
	let tempDir = path.join(rootDir, '.mops/.bench/', path.parse(file).name);
	let canisterName = path.parse(file).name;

	// prepare temp files
	fs.mkdirSync(tempDir, {recursive: true});
	fs.writeFileSync(path.join(tempDir, 'dfx.json'), JSON.stringify(replica.dfxJson(canisterName), null, 2));

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

async function runBenchFile(file: string, options: BenchOptions, replica: BenchReplica): Promise<RunBenchFileResult> {
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
							let color: keyof typeof chalk = percent == 0 ? 'gray' : (percent > 0 ? 'red' : 'green');
							diff = ` (${chalk[color](percentText)})`;
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

		return markdownTable(resArr, {
			align: ['l', ...'r'.repeat(schema.cols.length)],
			stringLength: stringWidth,
		});
	};

	let printResults = () => {
		logUpdate(`
			\n${chalk.bold(schema.name)}
			${schema.description ? '\n' + chalk.gray(schema.description) : ''}
			\n\n${chalk.blue('Instructions')}\n\n${getTable('instructions')}
			\n\n${chalk.blue('Heap')}\n\n${getTable('rts_heap_size')}
		`);
	};

	if (!process.env.CI) {
		printResults();
	}

	// run all cells
	for (let [rowIndex, row] of schema.rows.entries()) {
		for (let [colIndex, col] of schema.cols.entries()) {
			// let res = await actor.runCellQuery(BigInt(rowIndex), BigInt(colIndex));
			// let res = await actor.runCellUpdate(BigInt(rowIndex), BigInt(colIndex));
			let res = await actor.runCellUpdateAwait(BigInt(rowIndex), BigInt(colIndex));
			results.set(`${row}:${col}`, res);
			if (!process.env.CI) {
				printResults();
			}
		}
	}

	if (process.env.CI) {
		printResults();
	}
	logUpdate.done();

	// save results
	if (options.save) {
		console.log(`Saving results to ${chalk.gray(absToRel(resultsJsonFile))}`);
		let json: Record<any, any> = {
			version: 1,
			moc: options.moc,
			replica: options.replica,
			replicaVersion: options.replicaVersion,
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