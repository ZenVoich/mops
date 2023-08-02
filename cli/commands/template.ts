import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import prompts from 'prompts';
import {getRootDir} from '../mops.js';

export async function template(templateName?: string, options: any = {}) {
	if (!templateName) {
		let res = await prompts({
			type: 'select',
			name: 'value',
			message: 'Select template:',
			choices: [
				{title: 'GitHub Workflow to run \'mops test\'', value: 'github-workflow:mops-test'},
				{title: '× Cancel', value: ''},
			],
			initial: 0,
		});
		templateName = res.value;
	}

	if (templateName === 'github-workflow:mops-test') {
		let dest = path.resolve(getRootDir(), '.github/workflows/mops-test.yml');
		if (fs.existsSync(dest)) {
			console.log(chalk.yellow('Workflow already exists:'), path.relative(getRootDir(), dest));
			return;
		}
		let mopsTestYml = new URL('../templates/mops-test.yml', import.meta.url);
		fs.mkdirSync(path.resolve(getRootDir(), '.github/workflows'), {recursive: true});
		fs.copyFileSync(mopsTestYml, dest);
		console.log(chalk.green('Workflow created:'), path.relative(getRootDir(), dest));
	}
	else if (templateName?.startsWith('license:')) {
		let setYearAndOwner = (file: string) => {
			let license = fs.readFileSync(file).toString();
			license = license.replace(/<year>/g, new Date().getFullYear().toString());
			if (options.copyrightOwner) {
				license = license.replace(/<copyright-owner>/g, options.copyrightOwner);
			}
			fs.writeFileSync(file, license);
		};

		if (templateName === 'license:MIT') {
			fs.copyFileSync(new URL('../templates/licenses/MIT', import.meta.url), path.resolve(getRootDir(), 'LICENSE'));
			setYearAndOwner(path.resolve(getRootDir(), 'LICENSE'));
			console.log(chalk.green('License file created:'), path.relative(getRootDir(), 'LICENSE'));
		}
		else if (templateName === 'license:Apache-2.0') {
			fs.copyFileSync(new URL('../templates/licenses/Apache-2.0', import.meta.url), path.resolve(getRootDir(), 'LICENSE'));
			fs.copyFileSync(new URL('../templates/licenses/Apache-2.0-NOTICE', import.meta.url), path.resolve(getRootDir(), 'NOTICE'));
			setYearAndOwner(path.resolve(getRootDir(), 'NOTICE'));
			console.log(chalk.green('License file created:'), path.relative(getRootDir(), 'LICENSE'));
			console.log(chalk.green('License file created:'), path.relative(getRootDir(), 'NOTICE'));
		}
	}
	else if (templateName === 'lib.mo') {
		fs.mkdirSync(path.join(getRootDir(), 'src'), {recursive: true});
		fs.copyFileSync(new URL('../templates/src/lib.mo', import.meta.url), path.resolve(getRootDir(), 'src/lib.mo'));
		console.log(chalk.green('Source file created:'), path.relative(getRootDir(), 'src/lib.mo'));
	}
	else if (templateName === 'lib.test.mo') {
		fs.mkdirSync(path.join(getRootDir(), 'test'), {recursive: true});
		fs.copyFileSync(new URL('../templates/test/lib.test.mo', import.meta.url), path.resolve(getRootDir(), 'test/lib.test.mo'));
		console.log(chalk.green('Test file created:'), path.relative(getRootDir(), 'test/lib.test.mo'));
	}
}