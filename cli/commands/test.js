import {spawn, execSync} from 'child_process';
import chalk from 'chalk';
import glob from 'glob';
import {MMF1} from './mmf1.js';
import {sources} from './sources.js';

let globConfig = {
	nocase: true,
	ignore: [
		'**/node_modules/**',
		'**/.mops/**',
		'**/.vessel/**',
		'**/.git/**',
	],
};

export async function test() {
	let start = Date.now();

	let files = [];
	let libFiles = glob.sync('**/test?(s)/lib.mo', globConfig);
	if (libFiles.length) {
		files = [libFiles[0]];
	}
	else {
		files = glob.sync('**/test?(s)/**/*.test.mo', globConfig);
	}
	if (!files.length) {
		console.log('No test files found');
		console.log('Put your tests in \'test\' directory in *.test.mo files');
		return;
	}

	console.log('Test files:');
	for (let file of files) {
		console.log(chalk.gray(`• ${file}`));
	}
	console.log('-'.repeat(50));

	let failed = 0;
	let passed = 0;
	let skipped = 0;
	let dfxCache = execSync('dfx cache show').toString().trim();
	let sourcesArr = await sources();

	for (let file of files) {
		let mmf1 = new MMF1;

		await new Promise((resolve) => {
			console.log(`Running ${chalk.gray(file)}`);

			let proc = spawn(`${dfxCache}/moc`, ['-r', '-wasi-system-api', '-ref-system-api', '--hide-warnings', '--error-detail=2', ...sourcesArr.join(' ').split(' '), file]);

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
				mmf1.fail(data.toString().trim());
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
	console.log('-'.repeat(50));
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

	if (failed) {
		process.exit(1);
	}
}