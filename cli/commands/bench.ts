import {execSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
// import os from 'node:os';
import chalk from 'chalk';
import {globSync} from 'glob';

import {getRootDir} from '../mops.js';
import {parallel} from '../parallel.js';
import {createActor} from '../declarations/bench/index.js';
import {BenchResult, BenchSchema, _SERVICE} from '../declarations/bench/bench.did.js';
import {markdownTable} from 'markdown-table';
import logUpdate from 'log-update';
import {absToRel} from './test/utils.js';

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

export async function bench(filter = '', {verbose = false, save = false} = {}): Promise<boolean> {
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
		console.log('Put your benchmark files in \'bench\' directory in *.bench.mo files');
		return false;
	}

	files.sort();

	let benchDir = `${getRootDir()}/.mops/.bench/`;
	fs.mkdirSync(benchDir, {recursive: true});

	console.log('Benchmark files:');
	for (let file of files) {
		console.log(chalk.gray(`• ${absToRel(file)}`));
	}
	console.log('');
	console.log('='.repeat(50));

	console.log('Starting dfx replica...');
	startDfx(verbose);

	let resultsByName = new Map<string, Map<string, BenchResult>>();

	// await parallel(os.cpus().length, files, async (file: string) => {
	await parallel(1, files, async (file: string) => {
		console.log('\n' + '—'.repeat(50));
		console.log(`\nRunning ${chalk.gray(absToRel(file))}...`);
		console.log('');
		let {schema, results} = await runBenchFile(file, verbose);
		resultsByName.set(schema.name || absToRel(file), results);
	});

	if (save) {
		console.log('Saving results to mops.bench.json...');
		let json: Record<any, any> = {};
		resultsByName.forEach((results, name) => {
			json[name] = Array.from(results.entries());
		});
		fs.writeFileSync(path.join(rootDir, 'mops.bench.json'), JSON.stringify(json, (_, val) => {
			if (typeof val === 'bigint') {
				return `${String(val)}`;
			}
			else {
				return val;
			}
		}, 2));
	}

	console.log('Stopping dfx replica...');
	stopDfx(verbose);

	fs.rmSync(benchDir, {recursive: true, force: true});

	return true;
}

function dfxJson(canisterName: string) {
	return {
		version: 1,
		canisters: {
			[canisterName]: {
				type: 'motoko',
				main: 'canister.mo',
				args: '--force-gc --incremental-gc',
			}
		},
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
	stopDfx(verbose);
	let dir = path.join(getRootDir(), '.mops/.bench');
	fs.writeFileSync(path.join(dir, 'dfx.json'), JSON.stringify(dfxJson(''), null, 2));
	execSync('dfx start --background --clean', {cwd: dir, stdio: ['inherit', verbose ? 'inherit' : 'ignore', 'inherit']});
}

function stopDfx(verbose = false) {
	let dir = path.join(getRootDir(), '.mops/.bench');
	execSync('dfx stop', {cwd: dir, stdio: ['pipe', verbose ? 'inherit' : 'ignore', 'pipe']});
}

type RunBenchFileResult = {
	schema: BenchSchema,
	results: Map<string, BenchResult>,
};

async function runBenchFile(file: string, verbose = false): Promise<RunBenchFileResult> {
	let tempDir = path.join(getRootDir(), '.mops/.bench/', path.parse(file).name);
	fs.mkdirSync(tempDir, {recursive: true});

	let canisterName = Date.now().toString(36);

	// prepare temp files
	fs.writeFileSync(path.join(tempDir, 'dfx.json'), JSON.stringify(dfxJson(canisterName), null, 2));
	fs.cpSync(new URL('./bench/bench-canister.mo', import.meta.url), path.join(tempDir, 'canister.mo'));
	fs.cpSync(file, path.join(tempDir, 'user-bench.mo'));

	// deploy canister
	execSync(`dfx deploy ${canisterName} --mode reinstall --yes --identity anonymous`, {cwd: tempDir, stdio: verbose ? 'pipe' : ['pipe', 'ignore', 'pipe']});

	let canisterId = execSync(`dfx canister id ${canisterName}`, {cwd: tempDir}).toString().trim();
	let actor: _SERVICE = await createActor(canisterId, {
		agentOptions: {
			host: 'http://127.0.0.1:4944',
		},
	});

	let schema = await actor.init();

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
					curRow.push(formatNumber(res[prop]));
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
			let res = await actor.runCellQuery(BigInt(rowIndex), BigInt(colIndex));
			results.set(`${row}:${col}`, res);
			printResults();
		}
	}
	logUpdate.done();

	return {schema, results};
}