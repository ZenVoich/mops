import chokidar from 'chokidar';
import path from 'node:path';
import {ErrorChecker} from './error-checker.js';
import {WarningChecker} from './warning-checker.js';
import {getMotokoCanisters} from './parseDfxJson.js';
import {getRootDir} from '../../mops.js';
import debounce from 'debounce';
import chalk from 'chalk';
import {Tester} from './tester.js';

let ignore = [
	'**/node_modules/**',
	'**/.mops/**',
	'**/.vessel/**',
	'**/.git/**',
];

export async function watch(options : {error : boolean, warning : boolean, test : boolean, generate : boolean, deploy : boolean}) {
	options.error = Object.values(options).includes(true) ? options.error : true;

	let rootDir = getRootDir();
	let canisters = getMotokoCanisters();
	let errorChecker = new ErrorChecker({verbose: true, canisters: canisters});
	let warningChecker = new WarningChecker({errorChecker, verbose: true, canisters: canisters});
	let tester = new Tester({errorChecker, verbose: true});

	let watcher = chokidar.watch([
		path.join(rootDir, '**/*.mo'),
		path.join(rootDir, 'mops.toml'),
	], {
		ignored: ignore,
		ignoreInitial: true,
	});

	let run = debounce(async () => {
		errorChecker.reset();
		warningChecker.reset();
		tester.reset();

		options.error && await errorChecker.run(print);
		options.warning && await warningChecker.run(print);
		options.test && await tester.run(print);
		// options.generate && await generator.run(print);
		// options.deploy && await deployer.run(print);
		print();
	}, 200);

	let print = () => {
		console.clear();
		process.stdout.write('\x1Bc');

		options.error && console.log(errorChecker.getOutput());
		options.warning && console.log(warningChecker.getOutput());
		options.test && console.log(tester.getOutput());
		// options.generate && console.log(generator.getOutput());
		// options.deploy && console.log(deployer.getOutput());

		if ([errorChecker.status, warningChecker.status, tester.status].every(status => status !== 'pending' && status !== 'running')) {
			console.log(chalk.dim('Waiting for file changes...'));
			console.log(chalk.dim(`Press ${chalk.bold('Ctrl+C')} to exit.`));
		}
	};

	watcher.on('all', run);
	run();
}