import fs from 'node:fs/promises';
import {globSync} from 'glob';
import * as prettier from 'prettier';
import {getRootDir, readConfig} from '../mops.js';
import motokoPlugin from 'prettier-plugin-motoko';
import path from 'node:path';
import {absToRel} from './test/utils.js';
import chalk from 'chalk';
import {parallel} from '../parallel.js';

let ignore = [
	'**/node_modules/**',
	'**/.mops/**',
	'**/.vessel/**',
	'**/.git/**',
	'**/dist/**',
];

let globConfig = {
	nocase: true,
	ignore: ignore,
};

type FmtOptions = {
	check : boolean,
	silent : boolean,
};

export type FmtResult = {
	ok : boolean,
	total : number,
	checked : number,
	valid : number,
	invalid : number,
	formatted : number,
};

export async function fmt(filter : string, options : Partial<FmtOptions> = {}, signal ?: AbortSignal, onProgress ?: (result : FmtResult) => void) : Promise<FmtResult> {
	let startTime = Date.now();
	let config = readConfig();

	let rootDir = getRootDir();
	let globStr = '**/*.mo';
	if (filter) {
		globStr = `**/*${filter}*.mo`;
	}

	let files = globSync(path.join(rootDir, globStr), {
		...globConfig,
		cwd: rootDir,
	});
	let invalidFiles = 0;
	let checkedFiles = 0;

	let getResult = (ok : boolean) => {
		let result : FmtResult = {
			ok,
			total: files.length,
			checked: checkedFiles,
			valid: files.length - invalidFiles,
			invalid: invalidFiles,
			formatted: invalidFiles,
		};
		onProgress?.(result);
		return result;
	};

	if (!files.length) {
		if (filter) {
			options.silent || console.log(`No files found for filter '${filter}'`);
			return getResult(false);
		}
		if (!options.silent) {
			console.log('No *.mo files found');
		}
		return getResult(false);
	}

	if (signal?.aborted) {
		return getResult(false);
	}

	// get prettier config from .prettierrc
	let prettierConfigFile = await prettier.resolveConfigFile();

	await parallel(4, files, async (file) => {
		if (signal?.aborted) {
			return;
		}

		let conf = await prettier.resolveConfig(file, {editorconfig: true});
		let prettierConfig : prettier.Options = {};
		if (prettierConfigFile) {
			if (conf) {
				prettierConfig = conf;
			}
		}

		// merge config from mops.toml [fmt]
		// TODO: disable, because we lose vscode extension support
		if (config.fmt) {
			Object.assign(prettierConfig, config.fmt);
		}

		// add motoko parser plugin
		Object.assign(prettierConfig, {
			parser: 'motoko-tt-parse',
			plugins: [motokoPlugin],
			filepath: file,
		});

		// check file
		let code = await fs.readFile(file, 'utf8');
		let formatted = await prettier.format(code, prettierConfig);
		let ok = formatted === code;
		invalidFiles += Number(!ok);

		if (options.check) {
			if (ok) {
				options.silent || console.log(`${chalk.green('✓')} ${absToRel(file)} ${chalk.gray('valid')}`);
			}
			else {
				options.silent || console.log(`${chalk.red('✖')} ${absToRel(file)} ${chalk.gray('invalid')}`);
			}
		}
		else {
			if (ok) {
				options.silent || console.log(`${chalk.green('✓')} ${absToRel(file)} ${chalk.gray('valid')}`);
			}
			else {
				await fs.writeFile(file, formatted);
				options.silent || console.log(`${chalk.yellow('*')} ${absToRel(file)} ${chalk.gray('formatted')}`);
			}
		}

		checkedFiles += 1;

		// trigger onProgress
		getResult(false);
	});

	if (signal?.aborted) {
		return getResult(false);
	}

	if (!options.silent) {
		console.log('-'.repeat(50));

		let plural = (n : number) => n === 1 ? '' : 's';
		let str = `Checked ${chalk.gray(files.length)} file${plural(files.length)} in ${chalk.gray(((Date.now() - startTime) / 1000).toFixed(2) + 's')}`;
		if (invalidFiles) {
			str += options.check
				? `, invalid ${chalk.redBright(invalidFiles)} file${plural(invalidFiles)}`
				: `, formatted ${chalk.yellowBright(invalidFiles)} file${plural(invalidFiles)}`;
		}
		console.log(str);

		if (!invalidFiles) {
			console.log(chalk.green('✓ All files have valid formatting'));
		}
	}

	if (options.check && invalidFiles && !options.silent) {
		console.log(`${(`Run '${chalk.yellow('mops fmt' + (filter ? ` ${filter}` : ''))}' to format your code`)}`);
		return getResult(false);
	}

	return getResult(true);
}