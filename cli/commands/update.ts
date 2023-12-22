import chalk from 'chalk';
import {checkConfigFile, getGithubCommit, parseGithubURL, readConfig} from '../mops.js';
import {add} from './add.js';
import {getAvailableUpdates} from './available-updates.js';
import {checkIntegrity} from '../integrity.js';

type UpdateOptions = {
	verbose?: boolean;
	dev?: boolean;
	lock?: 'update' | 'ignore';
};

export async function update(pkg?: string, {lock}: UpdateOptions = {}) {
	if (!checkConfigFile()) {
		return;
	}
	let config = readConfig();

	if (pkg && !config.dependencies?.[pkg] && !config['dev-dependencies']?.[pkg]) {
		console.log(chalk.red(`Package "${pkg}" is not installed!`));
		return;
	}

	// update github packages
	let deps = Object.values(config.dependencies || {});
	let devDeps = Object.values(config['dev-dependencies'] || {});
	let githubDeps = [...deps, ...devDeps].filter((dep) => dep.repo);
	if (pkg) {
		githubDeps = githubDeps.filter((dep) => dep.name === pkg);
	}

	for (let dep of githubDeps) {
		let {org, gitName, branch, commitHash} = parseGithubURL(dep.repo || '');
		let dev = !!config['dev-dependencies']?.[dep.name];
		let commit = await getGithubCommit(`${org}/${gitName}`, branch);
		if (commit.sha !== commitHash) {
			await add(`https://github.com/${org}/${gitName}#${branch}@${commit.sha}`, {dev}, dep.name);
		}
	}

	// update mops packages
	let available = await getAvailableUpdates(config, pkg);

	if (available.length === 0) {
		if (pkg) {
			console.log(chalk.green(`Package "${pkg}" is up to date!`));
		}
		else {
			console.log(chalk.green('All dependencies are up to date!'));
		}
	}
	else {
		for (let dep of available) {
			let dev = !!config['dev-dependencies']?.[dep[0]];
			await add(`${dep[0]}@${dep[2]}`, {dev});
		}
	}

	await checkIntegrity(lock);
}