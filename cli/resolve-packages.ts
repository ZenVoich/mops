import path from 'node:path';
import chalk from 'chalk';
import {checkConfigFile, formatDir, formatGithubDir, getRootDir, parseGithubURL, readConfig} from './mops.js';
import {VesselConfig, readVesselConfig} from './vessel.js';
import {Config, Dependency} from './types.js';

export async function resolvePackages({verbose = false} = {}): Promise<Record<string, string>> {
	if (!checkConfigFile()) {
		return {};
	}

	let packages: Record<string, Dependency & {isRoot: boolean;}> = {};
	let versions: Record<string, string[]> = {};

	let compareVersions = (a: string = '0.0.0', b: string = '0.0.0') => {
		let ap = a.split('.').map((x: string) => parseInt(x)) as [number, number, number];
		let bp = b.split('.').map((x: string) => parseInt(x)) as [number, number, number];
		if (ap[0] - bp[0]) {
			return Math.sign(ap[0] - bp[0]);
		}
		if (ap[0] === bp[0] && ap[1] - bp[1]) {
			return Math.sign(ap[1] - bp[1]);
		}
		if (ap[0] === bp[0] && ap[1] === bp[1] && ap[2] - bp[2]) {
			return Math.sign(ap[2] - bp[2]);
		}
		return 0;
	};

	const gitVerRegex = new RegExp(/v(\d{1,2}\.\d{1,2}\.\d{1,2})(-.*)?$/);

	const compareGitVersions = (repoA: string, repoB: string) => {
		const {branch: a} = parseGithubURL(repoA);
		const {branch: b} = parseGithubURL(repoB);

		if (gitVerRegex.test(a) && gitVerRegex.test(b)) {
			return compareVersions(a.substring(1), b.substring(1));
		}
		else if (!gitVerRegex.test(a)) {
			return -1;
		}
		else {
			return 1;
		}
	};

	let collectDeps = async (config: Config | VesselConfig, isRoot = false) => {
		let allDeps = [...Object.values(config.dependencies || {})];
		if (isRoot) {
			allDeps = [...allDeps, ...Object.values(config['dev-dependencies'] || {})];
		}
		for (const pkgDetails of allDeps) {
			const {name, repo, version} = pkgDetails;

			// take root dep version or bigger one
			if (
				isRoot
				|| !packages[name]
				|| !packages[name]?.isRoot
				&& (
					repo && packages[name]?.repo && compareGitVersions(packages[name]?.repo || '', repo) === -1
					|| compareVersions(packages[name]?.version, version) === -1)
			) {
				packages[name] = {
					...pkgDetails,
					isRoot,
				};
			}

			let nestedConfig;

			if (repo) {
				const dir = formatGithubDir(name, repo);
				nestedConfig = await readVesselConfig(dir, {silent: true}) || {};
			}
			else if (!pkgDetails.path && version) {
				const file = formatDir(name, version) + '/mops.toml';
				nestedConfig = readConfig(file);
			}

			if (nestedConfig && !pkgDetails.path) {
				await collectDeps(nestedConfig);
			}

			if (!versions[name]) {
				versions[name] = [];
			}

			if (repo) {
				const {branch} = parseGithubURL(repo);
				versions[name]?.push(branch);
			}
			else if (version) {
				versions[name]?.push(version);
			}
		}
	};

	let config = readConfig();
	await collectDeps(config, true);

	// show conflicts
	if (verbose) {
		for (let [dep, vers] of Object.entries(versions)) {
			if (vers.length > 1) {
				console.log(chalk.yellow('WARN:'), `Conflicting package versions "${dep}" - ${vers.join(', ')}`);
			}
		}
	}

	let rootDir = getRootDir();

	return Object.fromEntries(
		Object.entries(packages).map(([name, pkg]) => {
			let version: string;
			if (pkg.path) {
				version = path.resolve(rootDir, pkg.path).replaceAll('{MOPS_ENV}', process.env.MOPS_ENV || 'local');
			}
			else if (pkg.repo) {
				version = pkg.repo;
			}
			else if (pkg.version) {
				version = pkg.version;
			}
			else {
				return [name, ''];
			}
			return [name, version];
		}).filter(([, version]) => version !== '')
	);
}