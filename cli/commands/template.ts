import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import prompts from 'prompts';
import camelCase from 'camelcase';
import {getRootDir, readConfig} from '../mops.js';

export async function template(templateName?: string, options: any = {}) {
	if (!templateName) {
		let res = await prompts({
			type: 'select',
			name: 'value',
			message: 'Select template:',
			choices: [
				{title: 'README.md', value: 'readme'},
				{title: 'src/lib.mo', value: 'lib.mo'},
				{title: 'test/lib.test.mo', value: 'lib.test.mo'},
				{title: 'License MIT', value: 'license:MIT'},
				{title: 'License Apache-2.0', value: 'license:Apache-2.0'},
				{title: 'GitHub Workflow to run \'mops test\'', value: 'github-workflow:mops-test'},
				{title: 'GitHub Workflow to publish a package', value: 'github-workflow:mops-publish'},
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
		console.log(chalk.green('Created'), path.relative(getRootDir(), dest));
	}
	else if (templateName === 'github-workflow:mops-publish') {
		let dest = path.resolve(getRootDir(), '.github/workflows/mops-publish.yml');
		if (fs.existsSync(dest)) {
			console.log(chalk.yellow('Workflow already exists:'), path.relative(getRootDir(), dest));
			return;
		}
		let mopsPublishYml = new URL('../templates/mops-publish.yml', import.meta.url);
		fs.mkdirSync(path.resolve(getRootDir(), '.github/workflows'), {recursive: true});
		fs.copyFileSync(mopsPublishYml, dest);
		console.log(chalk.green('Created'), path.relative(getRootDir(), dest));
	}
	else if (templateName?.startsWith('license:')) {
		let dest = path.resolve(getRootDir(), 'LICENSE');
		if (fs.existsSync(dest)) {
			console.log(chalk.yellow('LICENSE already exists'));
			return;
		}

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
			console.log(chalk.green('Created'), path.relative(getRootDir(), 'LICENSE'));
		}
		else if (templateName === 'license:Apache-2.0') {
			fs.copyFileSync(new URL('../templates/licenses/Apache-2.0', import.meta.url), path.resolve(getRootDir(), 'LICENSE'));
			fs.copyFileSync(new URL('../templates/licenses/Apache-2.0-NOTICE', import.meta.url), path.resolve(getRootDir(), 'NOTICE'));
			setYearAndOwner(path.resolve(getRootDir(), 'NOTICE'));
			console.log(chalk.green('Created'), path.relative(getRootDir(), 'LICENSE'));
			console.log(chalk.green('Created'), path.relative(getRootDir(), 'NOTICE'));
		}
	}
	else if (templateName === 'lib.mo') {
		fs.mkdirSync(path.join(getRootDir(), 'src'), {recursive: true});
		fs.copyFileSync(new URL('../templates/src/lib.mo', import.meta.url), path.resolve(getRootDir(), 'src/lib.mo'));
		console.log(chalk.green('Created'), path.relative(getRootDir(), 'src/lib.mo'));
	}
	else if (templateName === 'lib.test.mo') {
		fs.mkdirSync(path.join(getRootDir(), 'test'), {recursive: true});
		fs.copyFileSync(new URL('../templates/test/lib.test.mo', import.meta.url), path.resolve(getRootDir(), 'test/lib.test.mo'));
		console.log(chalk.green('Created'), path.relative(getRootDir(), 'test/lib.test.mo'));
	}
	else if (templateName === 'readme') {
		let dest = path.resolve(getRootDir(), 'README.md');
		if (fs.existsSync(dest)) {
			console.log(chalk.yellow('README.md already exists'));
			return;
		}
		fs.copyFileSync(new URL('../templates/README.md', import.meta.url), dest);

		let config = readConfig();

		let data = fs.readFileSync(dest).toString();
		data = data.replace(/<year>/g, new Date().getFullYear().toString());
		if (config.package?.name) {
			data = data.replace(/<name>/g, config.package.name);
			data = data.replace(/<import-name>/g, camelCase(config.package.name, {pascalCase: true}));
		}
		fs.writeFileSync(dest, data);

		console.log(chalk.green('Created'), path.relative(getRootDir(), 'README.md'));
	}
}