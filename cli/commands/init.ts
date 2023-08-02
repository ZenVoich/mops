import {execSync} from 'node:child_process';
import path from 'node:path';
import fs, {existsSync, readFileSync, writeFileSync} from 'node:fs';
import chalk from 'chalk';
import prompts from 'prompts';

import {checkApiCompatibility, mainActor, writeConfig} from '../mops.js';
import {installAll} from './install-all.js';
import {VesselConfig, readVesselConfig} from '../vessel.js';
import {Config, Dependencies} from '../types.js';
import {template} from './template.js';

export async function init() {
	let configFile = path.join(process.cwd(), 'mops.toml');
	let exists = fs.existsSync(configFile);
	if (exists) {
		console.log(chalk.yellow('mops.toml already exists'));
		// return;
	}

	console.log('Initializing...');

	let config: Config = {};

	// migrate from vessel
	let vesselFile = path.join(process.cwd(), 'vessel.dhall');
	let vesselConfig: VesselConfig = {dependencies: [], 'dev-dependencies': []};

	if (fs.existsSync(vesselFile)) {
		console.log('Reading vessel.dhall file');
		let res = await readVesselConfig(process.cwd(), {cache: false});
		if (res) {
			vesselConfig = {...res};
		}
	}

	if (vesselConfig.dependencies) {
		let deps: Dependencies = {};
		deps = {};

		for (const dep of (vesselConfig.dependencies || [])) {
			deps[dep.name] = dep;
		}

		if (Object.keys(deps).length) {
			config.dependencies = deps;
		}
	}

	let promptsConfig = {
		onCancel() {
			console.log('aborted');
			process.exit(0);
		}
	};

	// type
	let {type} = await prompts({
		type: 'select',
		name: 'type',
		message: 'Select type:',
		choices: [
			{title: `Project ${chalk.dim('(I just want to use mops packages in my project)')}`, value: 'project'},
			{title: `Package ${chalk.dim('(I plan to publish this package on mops)')}`, value: 'package'},
		],
	}, promptsConfig);

	// package details
	if (type === 'package') {
		let res = await prompts([
			{
				type: 'text',
				name: 'name',
				message: 'Enter package name:',
				initial: '',
			},
			{
				type: 'text',
				name: 'description',
				message: 'Enter package description:',
				initial: '',
			},
			{
				type: 'text',
				name: 'repository',
				message: 'Enter package repository url:',
				hint: 'https://github.com/ZenVoich/mops',
				initial: '',
			},
			{
				type: 'text',
				name: 'keywords',
				message: 'Enter keywords separated by spaces:',
				hint: 'lib http',
				initial: '',
			}
		], promptsConfig);

		config.package = {
			name: (res.name || '').trim(),
			version: '0.1.0',
			description: (res.description || '').trim(),
			repository: (res.repository || '').trim(),
			keywords: [...new Set(res.keywords.split(' ').filter(Boolean))] as string[],
		};
	}

	// GitHub workflow
	let {setupWorkflow} = await prompts({
		type: 'confirm',
		name: 'setupWorkflow',
		message: `Setup GitHub workflow? ${chalk.dim('(run `mops test` on push)')}`,
		initial: true,
	}, promptsConfig);

	// apply GitHub workflow
	if (setupWorkflow) {
		await template('github-workflow:mops-test');
	}

	// set packtool in dfx.json
	let dfxJson = path.resolve(process.cwd(), 'dfx.json');
	let dfxJsonData;
	if (existsSync(dfxJson)) {
		let dfxJsonText = fs.readFileSync(dfxJson).toString();
		dfxJsonData = JSON.parse(dfxJsonText);
		console.log('Setting packtool in dfx.json...');
		dfxJsonData.defaults = dfxJsonData.defaults || {};
		dfxJsonData.defaults.build = dfxJsonData.defaults.build || {};
		dfxJsonData.defaults.build.packtool = 'mops sources';
		let indent = dfxJsonText.match(/([ \t]+)"/)?.[1] || '  ';
		writeFileSync(path.join(process.cwd(), 'dfx.json'), JSON.stringify(dfxJsonData, null, indent));
	}

	// add .mops to .gitignore
	{
		console.log('Adding .mops to .gitignore...');
		let gitignore = path.join(process.cwd(), '.gitignore');
		let gitignoreData = existsSync(gitignore) ? readFileSync(gitignore).toString() : '';
		let lf = gitignoreData.endsWith('\n') ? '\n' : '';
		if (!gitignoreData.includes('.mops')) {
			writeFileSync(gitignore, `${gitignoreData}\n.mops${lf}`.trimStart());
		}
	}

	// get default packages
	if (type === 'project') {
		let compatible = await checkApiCompatibility();
		if (!compatible) {
			return;
		}

		let dfxVersion = dfxJsonData?.dfx || '';
		if (!dfxVersion) {
			try {
				let res = execSync('dfx --version').toString();
				let match = res.match(/\d+\.\d+\.\d+/);
				if (match) {
					dfxVersion = match[0];
				}
			}
			catch {}
		}

		console.log(`Fetching default packages for dfx ${dfxVersion}...`);
		let actor = await mainActor();
		let defaultPackages = await actor.getDefaultPackages(dfxVersion);

		if (!config.dependencies) {
			config.dependencies = {};
		}

		for (let [name, version] of defaultPackages) {
			config.dependencies[name] = {name, version};
		}
	}

	// save config
	writeConfig(config, configFile);

	// install deps
	if (Object.keys(config.dependencies || {}).length) {
		console.log('Installing dependencies...');
		await installAll({verbose: true});
	}

	console.log(chalk.green('mops.toml has been created'));
}