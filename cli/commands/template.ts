import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import prompts from 'prompts';
import {getRootDir} from '../mops.js';

export async function template(templateName?: string) {
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
}