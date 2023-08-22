import chalk from 'chalk';
import {absToRel} from '../utils.js';
import {MMF1} from '../mmf1.js';
import {Reporter} from './reporter.js';

export class SilentReporter implements Reporter {
	passed = 0;
	failed = 0;
	skipped = 0;
	passedFiles = 0;
	failedFiles = 0;
	passedNamesFlat: string[] = [];

	addFiles(_files: string[]) {}

	addRun(file: string, mmf: MMF1, state: Promise<void>, _wasiMode: boolean) {
		state.then(() => {
			this.passed += mmf.passed;
			this.failed += mmf.failed;
			this.skipped += mmf.skipped;
			this.passedNamesFlat = [...this.passedNamesFlat, ...mmf.passedNamesFlat];

			if (mmf.passed === 0 && mmf.failed === 0) {
				this.passed++;
				this.passedNamesFlat.push(absToRel(file));
			}

			this.passedFiles += Number(mmf.failed === 0);
			this.failedFiles += Number(mmf.failed !== 0);

			if (mmf.failed) {
				console.log(chalk.red('✖'), absToRel(file));
				mmf.flush('fail');
				console.log('-'.repeat(50));
			}
		});
	}

	done(): boolean {
		return this.failed === 0;
	}
}