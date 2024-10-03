import chokidar from 'chokidar';
import path from 'node:path';
import debounce from 'debounce';
import chalk from 'chalk';
import {ErrorChecker} from './error-checker.js';
import {WarningChecker} from './warning-checker.js';
import {getMotokoCanisters} from './parseDfxJson.js';
import {getRootDir} from '../../mops.js';
import {Tester} from './tester.js';
import {Generator} from './generator.js';
import {Deployer} from './deployer.js';

let ignore = [
	'**/node_modules/**',
	'**/.mops/**',
	'**/.vessel/**',
	'**/.git/**',
];

export async function watch(options : {error : boolean, warning : boolean, test : boolean, generate : boolean, deploy : boolean}) {
	let hasOptions = Object.values(options).includes(true);
	if (!hasOptions) {
		options.warning = true;
	}
	options.error = true;

	let rootDir = getRootDir();
	let canisters = getMotokoCanisters();
	let errorChecker = new ErrorChecker({verbose: true, canisters: canisters});
	let warningChecker = new WarningChecker({errorChecker, verbose: true, canisters: canisters});
	let tester = new Tester({errorChecker, verbose: true});
	let generator = new Generator({errorChecker, verbose: true, canisters: canisters});
	let deployer = new Deployer({errorChecker, generator, verbose: true, canisters: canisters});

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
		generator.reset();
		deployer.reset();

		options.error && await errorChecker.run(print);
		options.warning && warningChecker.run(print);
		options.test && tester.run(print);
		options.generate && await generator.run(print);
		options.deploy && deployer.run(print);
	}, 200);

	let print = () => {
		console.clear();
		process.stdout.write('\x1Bc');

		options.error && console.log(errorChecker.getOutput());
		options.warning && console.log(warningChecker.getOutput());
		options.test && console.log(tester.getOutput());
		options.generate && console.log(generator.getOutput());
		options.deploy && console.log(deployer.getOutput());

		let statuses = [];
		options.error && statuses.push(errorChecker.status);
		options.warning && statuses.push(warningChecker.status);
		options.test && statuses.push(tester.status);
		options.generate && statuses.push(generator.status);
		options.deploy && statuses.push(deployer.status);

		if (statuses.every(status => status !== 'pending' && status !== 'running')) {
			console.log(chalk.dim('-'.repeat(50)));
			console.log(chalk.dim('Waiting for file changes...'));
			console.log(chalk.dim(`Press ${chalk.bold('Ctrl+C')} to exit.`));
		}
	};

	watcher.on('all', run);
	run();
}