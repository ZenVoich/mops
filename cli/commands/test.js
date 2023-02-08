import {execSync} from 'child_process';
import chalk from 'chalk';
import glob from 'glob';

let globConfig = {
	nocase: true,
	ignore: [
		'**/node_modules/**',
		'**/.mops/**',
		'**/.vessel/**',
	],
};

export async function test() {
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
		return;
	}

	console.log('Test files:');
	for (let file of files) {
		console.log(chalk.gray(`• ${file}`));
	}
	console.log('-'.repeat(50));

	let start = Date.now();
	let failed = 0;
	let passed = 0;
	let dfxCache = execSync('dfx cache show').toString().trim();
	let mopsSources = execSync('mops-local sources').toString().trim().replace(/\n/g, ' ');

	for (let file of files) {
		try {
			console.log(`Running ${chalk.gray(file)}`);
			let res = execSync(`${dfxCache}/moc -r -wasi-system-api --hide-warnings --error-detail 2 ${mopsSources} ${file}`, {stdio: 'pipe'});
			console.log(res.toString())
			console.log(' ', chalk.green('PASS'));
			passed++;
		}
		catch (err) {
			failed++;
			if (err.status === 1) {
				console.log(' ', chalk.red('FAIL'), err.stderr.toString().trim());
				console.log(' ', chalk.red('FAIL'), err.stdout.toString().trim());
			}
			else {
				console.log(chalk.red('Unknown status:'), err.status);
				console.log(err.message);
			}
		}
	}

	console.log('-'.repeat(50));
	console.log(`Done in ${chalk.gray(((Date.now() - start) / 1000).toFixed(2) + 's')}, failed ${chalk[failed ? 'redBright' : 'gray'](failed)}, passed ${chalk.greenBright(passed)}`);
}