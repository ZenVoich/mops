import {exec} from 'node:child_process';
import {promisify} from 'node:util';
import os from 'node:os';
import {getMocPath} from '../../helpers/get-moc-path.js';
import {getRootDir} from '../../mops.js';
import {sources} from '../sources.js';
import chalk from 'chalk';
import {ErrorChecker} from './error-checker.js';
import {parallel} from '../../parallel.js';

export class WarningChecker {
	verbose = false;
	canisters : Record<string, string> = {};
	status : 'pending' | 'running' | 'syntax-error' | 'error' | 'success' = 'pending';
	warnings : string[] = [];
	errorChecker : ErrorChecker;

	constructor({verbose, canisters, errorChecker} : {verbose : boolean, canisters : Record<string, string>, errorChecker : ErrorChecker}) {
		this.verbose = verbose;
		this.canisters = canisters;
		this.errorChecker = errorChecker;
	}

	async run() {
		if (this.errorChecker.status === 'running') {
			this.status = 'pending';
			await this.errorChecker.runningPromise;
		}
		if (this.errorChecker.status === 'error') {
			this.status = 'syntax-error';
			return;
		}

		this.status = 'running';
		this.warnings = [];

		let rootDir = getRootDir();
		let mocPath = getMocPath();
		let deps = await sources({cwd: rootDir});

		await parallel(os.cpus().length, [...Object.values(this.canisters)], async (file) => {
			let {stderr} = await promisify(exec)(`${mocPath} --check ${file} ${deps.join(' ')}`, {cwd: rootDir});

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
			}
		});

		this.status = this.warnings.length ? 'error' : 'success';
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