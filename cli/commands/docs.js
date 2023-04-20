import {spawn, execSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import glob from 'glob';
import del from 'del';
import tar from 'tar';
import streamToPromise from 'stream-to-promise';

import {getRootDir} from '../mops.js';

let moDoc;

export async function docs({silent} = {}) {
	let rootDir = getRootDir();
	let docsDir = path.join(rootDir, '.mops/_docs');
	let docsDirRelative = path.relative(process.cwd(), path.join(rootDir, '.mops/_docs'));

	del.sync([docsDir], {force: true});

	// detect mocv
	if (process.env.DFX_MOC_PATH && process.env.DFX_MOC_PATH.includes('mocv/versions')) {
		moDoc = process.env.DFX_MOC_PATH.replace(/\/moc$/, '/mo-doc');
	}
	else {
		moDoc = execSync('dfx cache show').toString().trim() + '/mo-doc';
	}

	// generate docs
	await new Promise((resolve) => {
		let proc = spawn(moDoc, [`--source=${path.join(rootDir, 'src')}`, `--output=${docsDirRelative}`, '--format=adoc']);

		// stdout
		proc.stdout.on('data', (data) => {
			let text = data.toString().trim();
			let failedText = 'Failed to extract documentation';
			if (text.includes(failedText)) {
				console.log(text.replaceAll(failedText, chalk.yellow('Warning: ') + failedText));
			}
			silent || console.log('stdout', text);
		});

		// stderr
		let stderr = '';
		proc.stderr.on('data', (data) => {
			let text = data.toString().trim();
			if (text.includes('syntax error')) {
				console.log(chalk.red('Error:'), text);
				process.exit(1);
			}
			if (text.includes('No such file or directory') || text.includes('Couldn\'t find a module expression')) {
				silent || console.log(text);
				return;
			}
			stderr += text;
		});

		// exit
		proc.on('exit', (code) => {
			// if no source files found
			if (code === 2 && !stderr) {
				resolve();
				return;
			}
			if (code !== 0) {
				console.log(chalk.red('Error:'), code, stderr);
				process.exit(1);
			}
			resolve();
		});
	});

	// create archive
	let ignore = [
		`${docsDir}/**/*.test.adoc`,
		`${docsDir}/test/**/*`,
	];
	let files = glob.sync(`${docsDir}/**/*.adoc`, {ignore}).map(f => path.relative(docsDir, f));
	if (files.length) {
		let stream = tar.create(
			{
				cwd: docsDir,
				gzip: true,
				portable: true,
			},
			files
		).pipe(fs.createWriteStream(path.join(docsDir, 'docs.tgz')));
		await streamToPromise(stream);
	}

	silent || console.log(`${chalk.green('Documentation generated')} at ${docsDirRelative}`);
}