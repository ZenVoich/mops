import chalk from 'chalk';
import {readConfig} from '../../mops.js';
import {ErrorChecker} from './error-checker.js';
import {testWithReporter} from '../test/test.js';
import {SilentReporter} from '../test/reporters/silent-reporter.js';

export class Tester {
	verbose = false;
	status : 'pending' | 'running' | 'syntax-error' | 'error' | 'success' = 'pending';
	errorChecker : ErrorChecker;
	reporter = new SilentReporter(false);

	constructor({verbose, errorChecker} : {verbose : boolean, errorChecker : ErrorChecker}) {
		this.verbose = verbose;
		this.errorChecker = errorChecker;
	}

	reset() {
		this.status = 'pending';
	}

	async run(onProgress : () => void) {
		if (this.errorChecker.status === 'error') {
			this.status = 'syntax-error';
			return;
		}

		this.status = 'running';

		this.reporter = new SilentReporter(false, onProgress);
		let config = readConfig();

		await testWithReporter(this.reporter, '', 'interpreter', config.toolchain?.['pocket-ic'] ? 'pocket-ic' : 'dfx');

		this.status = this.reporter.failed > 0 ? 'error' : 'success';
		onProgress();
	}

	getOutput() : string {
		let get = (v : number) => v.toString();
		let count = (this.status === 'running' ? get : chalk.bold[this.reporter.failed > 0 ? 'redBright' : 'green'])(this.reporter.failedFiles || this.reporter.passedFiles);

		if (this.status === 'pending') {
			return `Tests: ${chalk.gray('(pending)')}`;
		}
		if (this.status === 'running') {
			return `Tests: ${count}/${this.reporter.total} ${chalk.gray('(running)')}`;
		}
		if (this.status === 'syntax-error') {
			return `Tests: ${chalk.gray('(errors)')}`;
		}

		let output = '';
		output += `Tests: ${count}`;
		if (this.reporter.errorOutput) {
			output += '\n' + this.reporter.errorOutput;
		}
		return output;
	}
}