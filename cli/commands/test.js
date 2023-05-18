import {spawn, execSync} from 'child_process';
import chalk from 'chalk';
import glob from 'glob';
import chokidar from 'chokidar';
import debounce from 'debounce';
import path from 'path';
import {MMF1} from './mmf1.js';
import {sources} from './sources.js';
import {getRootDir} from '../mops.js';

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

export async function test(filter = '', {watch = false} = {}) {
	let rootDir = getRootDir();

	if (watch) {
		// todo: run only changed for *.test.mo?
		// todo: run all for *.mo?
		let run = debounce(async () => {
			console.clear();
			process.stdout.write('\x1Bc');
			await runAll(filter);
			console.log('-'.repeat(50));
			console.log('Waiting for file changes...');
			console.log(chalk.gray((`Press ${chalk.gray('Ctrl+C')} to exit.`)));
		}, 200);

		let watcher = chokidar.watch(path.join(rootDir, '**/*.mo'), {
			ignored: ignore,
			ignoreInitial: true,
		});

		watcher.on('all', () => {
			run();
		});
		run();
	}
	else {
		let passed = await runAll(filter);
		if (!passed) {
			process.exit(1);
		}
	}
}

let mocPath = process.env.DFX_MOC_PATH;

export async function runAll(filter = '') {
	let start = Date.now();
	let rootDir = getRootDir();

	let files = [];
	let libFiles = glob.sync('**/test?(s)/lib.mo', globConfig);
	if (libFiles.length) {
		files = [libFiles[0]];
	}
	else {
		let globStr = '**/test?(s)/**/*.test.mo';
		if (filter) {
			globStr = `**/test?(s)/**/*${filter}*.mo`;
		}
		files = glob.sync(path.join(rootDir, globStr), globConfig);
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

	let absToRel = (p) => path.relative(rootDir, path.resolve(p));

	console.log('Test files:');
	for (let file of files) {
		console.log(chalk.gray(`• ${absToRel(file)}`));
	}
	console.log('='.repeat(50));

	let failed = 0;
	let passed = 0;
	let skipped = 0;
	let sourcesArr = await sources();

	if (!mocPath) {
		mocPath = execSync('dfx cache show').toString().trim() + '/moc';
	}

	for (let file of files) {
		let mmf1 = new MMF1;

		await new Promise((resolve) => {
			file !== files[0] && console.log('-'.repeat(50));
			console.log(`Running ${chalk.gray(absToRel(file))}`);

			let proc = spawn(mocPath, ['-r', '-wasi-system-api', '-ref-system-api', '--hide-warnings', '--error-detail=2', ...sourcesArr.join(' ').split(' '), file].filter(x => x));

			// stdout
			proc.stdout.on('data', (data) => {
				for (let line of data.toString().split('\n')) {
					line = line.trim();
					if (line) {
						mmf1.parseLine(line);
					}
				}
			});

			// stderr
			proc.stderr.on('data', (data) => {
				let text = data.toString().trim();
				// change absolute file path to relative
				// change :line:col-line:col to :line:col to work in vscode
				text = text.replace(/([\w+._/-]+):(\d+).(\d+)(-\d+.\d+)/g, (m0, m1, m2, m3) => `${absToRel(m1)}:${m2}:${m3}`);
				mmf1.fail(text);
			});

			// exit
			proc.on('exit', (code) => {
				if (code === 0) {
					mmf1.pass();
				}
				else if (code !== 1) {
					console.log(chalk.red('unknown code:'), code);
				}
				resolve();
			});
		});

		passed += mmf1.passed;
		failed += mmf1.failed;
		skipped += mmf1.skipped;
	}

	console.log('='.repeat(50));
	if (failed) {
		console.log(chalk.redBright('Tests failed'));
	}
	else {
		console.log(chalk.greenBright('Tests passed'));
	}

	console.log(`Done in ${chalk.gray(((Date.now() - start) / 1000).toFixed(2) + 's')}`
		+ `, passed ${chalk.greenBright(passed)}`
		+ (skipped ? `, skipped ${chalk[skipped ? 'yellowBright' : 'gray'](skipped)}` : '')
		+ (failed ? `, failed ${chalk[failed ? 'redBright' : 'gray'](failed)}` : '')
	);

	return failed === 0;
}