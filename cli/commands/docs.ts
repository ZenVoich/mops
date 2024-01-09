import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import {globSync} from 'glob';
import {deleteSync} from 'del';
import tar from 'tar';
import streamToPromise from 'stream-to-promise';

import {getRootDir} from '../mops.js';
import {toolchain} from './toolchain/index.js';

let moDocPath: string;

export async function docs({silent = false} = {}) {
	let rootDir = getRootDir();
	let docsDir = path.join(rootDir, '.mops/.docs');
	let docsDirRelative = path.relative(process.cwd(), docsDir);

	deleteSync([docsDir], {force: true});

	// detect mocv (legacy)
	if (process.env.DFX_MOC_PATH && process.env.DFX_MOC_PATH.includes('mocv/versions')) {
		moDocPath = process.env.DFX_MOC_PATH.replace(/\/moc$/, '/mo-doc');
	}
	else {
		// fallbacks to dfx moc if not specified in config
		let mocPath = await toolchain.bin('moc', {fallback: true});
		moDocPath = mocPath.replace(/\/moc$/, '/mo-doc');
	}

	// generate docs
	await new Promise<void>((resolve) => {
		let proc = spawn(moDocPath, [`--source=${path.join(rootDir, 'src')}`, `--output=${docsDirRelative}`, '--format=adoc']);

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
	let files = globSync(`${docsDir}/**/*.adoc`, {ignore}).map(f => path.relative(docsDir, f));
	files.sort();
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