import {execSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import chalk from 'chalk';
import {globSync} from 'glob';

// import {sources} from './sources.js';
import {getRootDir} from '../mops.js';
import {parallel} from '../parallel.js';
import {createActor} from '../declarations/bench/index.js';
import {BenchResult, _SERVICE} from '../declarations/bench/bench.did.js';
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

// type BenchReporterName = 'md';
type BenchMode = 'replica' | 'wasi';

let mocPath = process.env.DFX_MOC_PATH;

export async function bench(filter = '', verbose = false): Promise<boolean> {
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

	// console.log('Starting dfx replica...');
	// startDfx();

	// await parallel(os.cpus().length, files, async (file: string) => {
	await parallel(1, files, async (file: string) => {
		files.indexOf(file) !== 0 && console.log('\n' + '—'.repeat(50));
		console.log(`\nRunning ${chalk.gray(absToRel(file))}...`);
		await runBenchFile(file, verbose);
	});

	// console.log('Stopping dfx replica...');
	// stopDfx();

	// fs.rmSync(benchDir, {recursive: true, force: true});

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
		// networks: {
		// 	local: {
		// 		type: 'ephemeral',
		// 		bind: '127.0.0.1:4944',
		// 	},
		// },
	};
}

// function startDfx() {
// 	stopDfx();
// 	let dir = path.join(getRootDir(), '.mops/.bench');
// 	fs.writeFileSync(path.join(dir, 'dfx.json'), JSON.stringify(dfxJson(''), null, 2));
// 	execSync('dfx start --background --clean', {cwd: dir});
// }

// function stopDfx() {
// 	let dir = path.join(getRootDir(), '.mops/.bench');
// 	execSync('dfx stop', {cwd: dir});
// }

async function runBenchFile(file: string, verbose = false, mode: BenchMode = 'replica') {
	let tempDir = path.join(getRootDir(), '.mops/.bench/', path.parse(file).name);
	fs.mkdirSync(tempDir, {recursive: true});

	if (fs.readFileSync(file, 'utf8').startsWith('// @benchmode wasi')) {
		mode = 'wasi';
	}
	if (!mocPath) {
		mocPath = execSync('dfx cache show').toString().trim() + '/moc';
	}
	if (!mocPath) {
		mocPath = 'moc';
	}

	// replica mode
	if (mode === 'replica') {
		let canisterName = Date.now().toString(36);

		fs.writeFileSync(path.join(tempDir, 'dfx.json'), JSON.stringify(dfxJson(canisterName), null, 2));
		fs.cpSync(new URL('./bench/bench-canister.mo', import.meta.url), path.join(tempDir, 'canister.mo'));
		fs.cpSync(file, path.join(tempDir, 'user-bench.mo'));

		execSync(`dfx deploy ${canisterName} --mode reinstall --yes`, {cwd: tempDir, stdio: ['pipe', verbose ? 'pipe' : 'ignore', 'pipe']});

		let canisterId = execSync(`dfx canister id ${canisterName}`, {cwd: tempDir}).toString().trim();
		let actor: _SERVICE = await createActor(canisterId, {
			agentOptions: {
				host: 'http://127.0.0.1:4943',
			},
		});
		let schema = await actor.init();

		let results = new Map<string, BenchResult>();

		let formatNumber = (n: bigint | number): string => {
			return n.toLocaleString('en-US').replaceAll(',', '_');
		};

		let getTable = (prop: keyof BenchResult): string => {
			let resArr = [['', ...schema.cols]];

			for (let [rowIndex, row] of schema.rows.entries()) {
				let curRow = [row];

				for (let [colIndex, _col] of schema.cols.entries()) {
					let res = results.get(`${rowIndex}:${colIndex}`);
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

		for (let [rowIndex, _row] of schema.rows.entries()) {
			for (let [colIndex, _col] of schema.cols.entries()) {
				let res = await actor.runCell(BigInt(rowIndex), BigInt(colIndex));
				results.set(`${rowIndex}:${colIndex}`, res);
				printResults();
			}
		}
		logUpdate.done();
	}
	// wasi mode
	else if (mode === 'wasi') {
		throw new Error('WASI mode is not implemented yet');
	}
}