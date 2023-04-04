import {spawn, execSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import glob from 'glob';
import del from 'del';
import tar from 'tar';

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
	if (!moDoc) {
		moDoc = execSync('dfx cache show').toString().trim() + '/mo-doc';
	}

	await new Promise((resolve) => {
		let proc = spawn(moDoc, [`--source=${path.join(rootDir, 'backend')}`, `--output=${docsDirRelative}`, '--format=adoc']);

		// stdout
		proc.stdout.on('data', (data) => {
			let text = data.toString().trim();
			silent || console.log('stdout', text);
		});

		// stderr
		let stderr = '';
		proc.stderr.on('data', (data) => {
			let text = data.toString().trim();
			if (text.includes('syntax error')) {
				silent || console.log(chalk.red('Error:'), text);
				process.exit(1);
			}
			stderr += text;
		});

		// exit
		proc.on('exit', (code) => {
			if (code !== 0) {
				silent || console.log(chalk.red('Error:'), stderr);
				process.exit(1);
			}
			resolve();
		});
	});

	let files = glob.sync(`${docsDir}/**/*.adoc`).map(f => path.relative(docsDir, f));
	tar.c(
		{
			gzip: true,
			cwd: docsDir,
		},
		files
	).pipe(fs.createWriteStream(path.join(docsDir, 'docs.tgz')));

	silent || console.log(`${chalk.green('Documentation generated')} at ${docsDirRelative}`);
}