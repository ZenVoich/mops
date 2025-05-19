import chalk from 'chalk';
import {fmt} from '../fmt.js';

export class Formatter {
	verbose = false;
	status : 'pending' | 'running' | 'syntax-error' | 'error' | 'success' = 'pending';
	success = 0;
	errors : string[] = [];
	aborted = false;
	controller = new AbortController();
	currentRun : Promise<any> | undefined;

	constructor({verbose} : {verbose : boolean}) {
		this.verbose = verbose;
	}

	reset() {
		this.status = 'pending';
		this.success = 0;
		this.errors = [];
	}

	async abortCurrent() {
		this.aborted = true;
		await this.currentRun;
		this.reset();
		this.aborted = false;
	}

	async run(onProgress : () => void) {
		await this.abortCurrent();

		this.status = 'running';
		onProgress();

		this.controller = new AbortController();

		this.currentRun = fmt('', {silent: true}, this.controller.signal);
		await this.currentRun;

		if (!this.aborted) {
			this.status = 'success';
		}
		onProgress();
	}

	getOutput() : string {
		if (this.status === 'pending') {
			return `Format: ${chalk.gray('(pending)')}`;
		}
		if (this.status === 'running') {
			return `Format: ${chalk.gray('(running)')}`;
		}
		if (this.status === 'error') {
			return `Format: ${chalk.redBright('(error)')}`;
		}

		return `Format: ${chalk.green('✓')}`;
	}
}