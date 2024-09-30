import chokidar from 'chokidar';
import path from 'node:path';
import {ErrorChecker} from './error-checker.js';
import {WarningChecker} from './warning-checker.js';
import {getMotokoCanisters} from './parseDfxJson.js';
import {getRootDir} from '../../mops.js';
import debounce from 'debounce';
import chalk from 'chalk';

let ignore = [
	'**/node_modules/**',
	'**/.mops/**',
	'**/.vessel/**',
	'**/.git/**',
];

export async function watch() {
	let rootDir = getRootDir();
	let canisters = getMotokoCanisters();
	let errorChecker = new ErrorChecker({verbose: true, canisters: canisters});
	let warningChecker = new WarningChecker({errorChecker, verbose: true, canisters: canisters});

	let watcher = chokidar.watch([
		path.join(rootDir, '**/*.mo'),
		path.join(rootDir, 'mops.toml'),
	], {
		ignored: ignore,
		ignoreInitial: true,
	});

	let run = debounce(async () => {
		errorChecker.run().then(print);
		warningChecker.run().then(print);
		print();
	}, 200);

	let print = () => {
		console.clear();
		process.stdout.write('\x1Bc');

		console.log(errorChecker.getOutput());
		console.log(warningChecker.getOutput());

		if ([errorChecker.status, warningChecker.status].every(status => status !== 'pending' && status !== 'running')) {
			console.log(chalk.dim('Waiting for file changes...'));
			console.log(chalk.dim(`Press ${chalk.bold('Ctrl+C')} to exit.`));
		}
	};

	watcher.on('all', run);
	run();
}