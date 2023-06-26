// mops message format v1
// mops:1:start
// mops:1:end
// mops:1:skip
import chalk from 'chalk';

export class MMF1 {
	stack = [];
	currSuite = '';
	failed = 0;
	passed = 0;
	skipped = 0;
	srategy; // 'store' | 'print'
	output = [];

	constructor(srategy) {
		this.srategy = srategy;
	}

	_log(...args) {
		if (this.srategy === 'store') {
			this.output.push(args.join(' '));
		}
		else if (this.srategy === 'print') {
			console.log(...args);
		}
	}

	flush() {
		for (let out of this.output) {
			console.log(out);
		}
		this.store = [];
	}

	parseLine(line) {
		if (line.startsWith('mops:1:start ')) {
			this._testStart(line.split('mops:1:start ')[1]);
		}
		else if (line.startsWith('mops:1:end ')) {
			this._testEnd(line.split('mops:1:end ')[1]);
		}
		else if (line.startsWith('mops:1:skip ')) {
			this._testSkip(line.split('mops:1:skip ')[1]);
		}
		else {
			this._log(' '.repeat(this.stack.length * 2), chalk.gray('stdout'), line);
		}
	}

	_testStart(name) {
		if (this.stack.length) {
			let suite = this.stack[this.stack.length - 1];
			if (this.currSuite !== suite) {
				this.currSuite = suite;
				this._log(' '.repeat((this.stack.length - 1) * 2), (chalk.gray('•')) + '', suite);
			}
		}
		this.stack.push(name);
	}

	_testEnd(name) {
		if (name !== this.stack.pop()) {
			throw 'mmf1._testEnd: start and end test mismatch';
		}
		this._status(name, 'pass');
	}

	_testSkip(name) {
		this._status(name, 'skip');
	}

	_status(name, status) {
		if (status === 'pass') {
			// do not print suite at the end
			if (name === this.currSuite) {
				return;
			}
			this.passed++;
			this._log(' '.repeat(this.stack.length * 2), chalk.green('✓'), name);
		}
		else if (status === 'fail') {
			this.failed++;
			this._log(' '.repeat(this.stack.length * 2), chalk.red('×'), name);
		}
		else if (status === 'skip') {
			this.skipped++;
			this._log(' '.repeat(this.stack.length * 2), chalk.yellow('−'), name);
		}
	}

	fail(stderr) {
		let name = this.stack.pop() || '';
		this._status(name, 'fail');
		this._log(' '.repeat(this.stack.length * 2), chalk.red('FAIL'), stderr);
	}

	pass() {
		let name = this.stack.pop();
		if (name) {
			this._status(name, 'pass');
		}
		this._log(' '.repeat(this.stack.length * 2), chalk.green('PASS'));
	}
}