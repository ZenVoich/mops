import chalk from 'chalk';
import {ErrorChecker} from './error-checker.js';
import {parallel} from '../../parallel.js';
import os from 'node:os';

// import {sources} from '../sources.js';
import {promisify} from 'node:util';
import {exec} from 'node:child_process';
// import {getMocPath} from '../../helpers/get-moc-path.js';
import {getRootDir} from '../../mops.js';

export class Generator {
	verbose = false;
	canisters : Record<string, string> = {};
	status : 'pending' | 'running' | 'syntax-error' | 'error' | 'success' = 'pending';
	errorChecker : ErrorChecker;
	success = 0;
	errors : string[] = [];

	constructor({verbose, canisters, errorChecker} : {verbose : boolean, canisters : Record<string, string>, errorChecker : ErrorChecker}) {
		this.verbose = verbose;
		this.canisters = canisters;
		this.errorChecker = errorChecker;
	}

	reset() {
		this.status = 'pending';
		this.success = 0;
		this.errors = [];
	}

	async run(onProgress : () => void) {
		if (this.errorChecker.status === 'error') {
			this.status = 'syntax-error';
			return;
		}

		this.status = 'running';

		let rootDir = getRootDir();
		// let mocPath = getMocPath();
		// let deps = await sources({cwd: rootDir});

		await parallel(os.cpus().length, [...Object.keys(this.canisters)], async (canister) => {
			let {stdout, stderr} = await promisify(exec)(`dfx generate ${canister}`, {cwd: rootDir});
			console.log('stdout', stdout);
			console.log('stderr', stderr);

			this.success += 1;
			onProgress();
		});

		this.status = 'success';
		onProgress();
	}

	getOutput() : string {
		let get = (v : number) => v.toString();
		let count = (this.status === 'running' ? get : chalk.bold[this.errors.length > 0 ? 'redBright' : 'green'])(this.errors.length || this.success);

		if (this.status === 'pending') {
			return `Generate: ${chalk.gray('(pending)')}`;
		}
		if (this.status === 'running') {
			return `Generate: ${count}/${Object.keys(this.canisters).length} ${chalk.gray('(running)')}`;
		}
		if (this.status === 'syntax-error') {
			return `Generate: ${chalk.gray('(errors)')}`;
		}

		return `Generate: ${count}`;
		// if (this.verbose && this.warnings.length) {
		// 	output += `\n  ${this.warnings.join('\n  ')}`;
		// }
		// return output;
		// return 'Generate: success';
	}
}