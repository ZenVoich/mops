import {exec} from 'node:child_process';
import {promisify} from 'node:util';
import os from 'node:os';
import chalk from 'chalk';

import {getMocPath} from '../../helpers/get-moc-path.js';
import {getRootDir} from '../../mops.js';
import {sources} from '../sources.js';
import {ErrorChecker} from './error-checker.js';
import {parallel} from '../../parallel.js';
import {globMoFiles} from './globMoFiles.js';

export class WarningChecker {
	verbose = false;
	canisters : Record<string, string> = {};
	status : 'pending' | 'running' | 'syntax-error' | 'error' | 'success' = 'pending';
	warnings : string[] = [];
	errorChecker : ErrorChecker;
	aborted = false;
	controllers = new Map<string, AbortController>();
	currentRun : Promise<any> | undefined;

	constructor({verbose, canisters, errorChecker} : {verbose : boolean, canisters : Record<string, string>, errorChecker : ErrorChecker}) {
		this.verbose = verbose;
		this.canisters = canisters;
		this.errorChecker = errorChecker;
	}

	reset() {
		this.status = 'pending';
		this.warnings = [];
	}

	async abortCurrent() {
		this.aborted = true;
		for (let controller of this.controllers.values()) {
			controller.abort();
		}
		this.controllers.clear();
		await this.currentRun;
		this.reset();
		this.aborted = false;
	}

	async run(onProgress : () => void) {
		await this.abortCurrent();

		if (this.errorChecker.status === 'error') {
			this.status = 'syntax-error';
			onProgress();
			return;
		}

		this.status = 'running';
		onProgress();

		let rootDir = getRootDir();
		let mocPath = getMocPath();
		let deps = await sources({cwd: rootDir});

		let paths = [...Object.values(this.canisters)];
		if (!paths.length) {
			paths = globMoFiles(rootDir);
		}

		this.currentRun = parallel(os.cpus().length, paths, async (file) => {
			let controller = new AbortController();
			let {signal} = controller;
			this.controllers.set(file, controller);

			let {stderr} = await promisify(exec)(`${mocPath} --check ${deps.join(' ')} ${file}`, {cwd: rootDir, signal}).catch((error) => {
				if (error.code === 'ABORT_ERR') {
					return {stderr: ''};
				}
				throw error;
			});

			if (stderr) {
				stderr.split('\n').forEach((line) => {
					// ignore deps warnings
					if (line.startsWith('.mops/')) {
						return;
					}
					else if (line.includes(': warning [')) {
						// better formatting
						let str = line
							.replace(': warning [', `: ${chalk.yellow('warning')} [`)
							.replace(/unused field (\w+)/, `unused field ${chalk.bold('$1')}`)
							.replace(/unused identifier (\w+)/, `unused identifier ${chalk.bold('$1')}`)
							.trim();
						this.warnings.push(str);
					}
					else if (line.startsWith('  ') && this.warnings.length) {
						this.warnings[this.warnings.length - 1] += '\n  ' + line;
					}
					else {
						// console.log('UNKNOWN WARNING', line);
					}
				});
				onProgress();
			}

			this.controllers.delete(file);
		});

		await this.currentRun;

		if (!this.aborted) {
			this.status = this.warnings.length ? 'error' : 'success';
		}

		onProgress();
	}

	getOutput() : string {
		if (this.status === 'pending') {
			return `Warnings: ${chalk.gray('(pending)')}`;
		}
		if (this.status === 'running') {
			return `Warnings: ${chalk.gray('(running)')}`;
		}
		if (this.status === 'syntax-error') {
			return `Warnings: ${chalk.gray('(errors)')}`;
		}

		let output = '';
		output += `Warnings: ${chalk.bold[this.warnings.length ? 'yellowBright' : 'green'](this.warnings.length)}`;
		if (this.verbose && this.warnings.length) {
			output += `\n  ${this.warnings.join('\n  ')}`;
		}
		return output;
	}
}