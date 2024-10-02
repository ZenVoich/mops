import {exec} from 'node:child_process';
import {promisify} from 'node:util';
import os from 'node:os';
import {getMocPath} from '../../helpers/get-moc-path.js';
import {getRootDir} from '../../mops.js';
import {sources} from '../sources.js';
import chalk from 'chalk';
import {parallel} from '../../parallel.js';

export class ErrorChecker {
	verbose = false;
	canisters : Record<string, string> = {};
	status : 'pending' | 'running' | 'error' | 'success' = 'pending';
	errors : string[] = [];

	constructor({verbose, canisters} : {verbose : boolean, canisters : Record<string, string>}) {
		this.verbose = verbose;
		this.canisters = canisters;
	}

	reset() {
		this.status = 'pending';
		this.errors = [];
	}

	async run(onProgress : () => void) {
		this.reset();

		this.status = 'running';
		onProgress();

		let rootDir = getRootDir();
		let mocPath = getMocPath();
		let deps = await sources({cwd: rootDir});

		await parallel(os.cpus().length, [...Object.values(this.canisters)], async (file) => {
			try {
				await promisify(exec)(`${mocPath} --check ${file} ${deps.join(' ')}`, {cwd: rootDir});
			}
			catch (error : any) {
				error.message.split('\n').forEach((line : string) => {
					if (line.match(/: \w+ error \[/)) {
						// better formatting
						let str = line
							.replace(/: (\w+ error) \[/, (_, m1) => `: ${chalk.red(m1)} [`)
							.replace(/unbound type (\w+)/, `unbound type ${chalk.bold('$1')}`)
							.replace(/unbound variable (\w+)/, `unbound variable ${chalk.bold('$1')}`)
							.trim();
						this.errors.push(str);
					}
					else if (line.startsWith('  ') && this.errors.length) {
						this.errors[this.errors.length - 1] += '\n  ' + line;
					}
					else {
						// console.log('UNKNOWN ERROR', line);
					}
				});
			}

			onProgress();
		});

		this.status = this.errors.length ? 'error' : 'success';
		onProgress();
	}

	getOutput() : string {
		if (this.status === 'pending') {
			return `Errors: ${chalk.gray('(pending)')}`;
		}
		if (this.status === 'running') {
			return `Errors: ${chalk.gray('(running)')}`;
		}
		let output = '';
		output += `Errors: ${chalk.bold[this.errors.length ? 'redBright' : 'green'](this.errors.length)}`;
		if (this.verbose && this.errors.length) {
			output += `\n  ${this.errors.join('\n  ')}`;
		}
		return output;
	}
}